import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { openai } from './utils/openai';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const requestSchema = z.object({
  itemId: z.string(),
});

const itemSchema = z.object({
  ownerId: z.string().optional(),
  createdById: z.string().optional(),
  audio: z
    .object({
      path: z.string(),
      mime: z.string(),
    })
    .optional(),
  transcription: z
    .object({
      status: z.string().optional(),
      lastTranscribedAudioPath: z.string().optional(),
    })
    .optional(),
});

export const requestTranscription = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const parsed = requestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Missing itemId.');
  }

  const itemRef = admin.firestore().doc(`items/${parsed.data.itemId}`);
  const snapshot = await itemRef.get();

  if (!snapshot.exists) {
    throw new HttpsError('not-found', 'Item not found.');
  }

  const itemData = itemSchema.safeParse(snapshot.data());
  if (!itemData.success || !itemData.data.audio?.path) {
    throw new HttpsError('failed-precondition', 'Audio is missing for this item.');
  }

  const requesterId = request.auth.uid;
  const { ownerId, createdById } = itemData.data;
  if (requesterId !== ownerId && requesterId !== createdById) {
    throw new HttpsError('permission-denied', 'Not allowed to transcribe this item.');
  }

  const currentAudioPath = itemData.data.audio.path;
  const lastTranscribedAudioPath = itemData.data.transcription?.lastTranscribedAudioPath;
  const currentStatus = itemData.data.transcription?.status;

  if (
    lastTranscribedAudioPath === currentAudioPath &&
    (currentStatus === 'processing' || currentStatus === 'complete')
  ) {
    return { status: 'skipped' };
  }

  await itemRef.update({
    'transcription.status': 'processing',
    'transcription.provider': 'whisper',
    'transcription.lastTranscribedAudioPath': currentAudioPath,
  });

  const bucket = admin.storage().bucket();
  const audioPath = itemData.data.audio.path;
  const tempFilePath = path.join(os.tmpdir(), path.basename(audioPath));

  try {
    await bucket.file(audioPath).download({ destination: tempFilePath });

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    const segments = response.segments?.map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text,
    }));

    await itemRef.update({
      'transcription.status': 'complete',
      'transcription.text': response.text,
      'transcription.segments': segments ?? [],
      'transcription.language': response.language,
      'transcription.provider': 'whisper',
      'transcription.completedAt': admin.firestore.FieldValue.serverTimestamp(),
      'transcription.lastTranscribedAudioPath': currentAudioPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await itemRef.update({
      'transcription.status': 'error',
      'transcription.errorMessage': message,
      'transcription.provider': 'whisper',
      'transcription.lastTranscribedAudioPath': currentAudioPath,
    });
    throw new HttpsError('internal', message);
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});
