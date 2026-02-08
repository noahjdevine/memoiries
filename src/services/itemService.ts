import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { z } from 'zod';
import { db } from './firebase';

export const transcriptionSchema = z.object({
  status: z.enum(['idle', 'processing', 'complete', 'error']),
  text: z.string().optional(),
  segments: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        text: z.string(),
      }),
    )
    .optional(),
  language: z.string().optional(),
  provider: z.string().optional(),
  completedAt: z.any().optional(),
  errorMessage: z.string().optional(),
});

export const itemSchema = z.object({
  ownerId: z.string(),
  createdById: z.string(),
  createdAt: z.any(),
  updatedAt: z.any(),
  title: z.string().nullable().optional(),
  promptKey: z.string().nullable().optional(),
  photos: z.array(z.object({ url: z.string(), path: z.string() })).optional(),
  audio: z
    .object({
      url: z.string(),
      path: z.string(),
      durationSec: z.number(),
      mime: z.string(),
    })
    .optional(),
  transcription: transcriptionSchema.optional(),
  tags: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  visibility: z.enum(['private', 'family', 'specific']).optional(),
  allowedUserIds: z.array(z.string()).optional(),
  outcome: z.enum(['keep', 'gift', 'donate', 'sell', 'discard']).optional(),
});

export type Item = z.infer<typeof itemSchema> & { id: string };

export const createItemDraft = async (ownerId: string, createdById: string) => {
  const itemsRef = collection(db, 'items');
  const itemRef = doc(itemsRef);
  await setDoc(itemRef, {
    ownerId,
    createdById,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    transcription: { status: 'idle' },
    photos: [],
    tags: [],
    collectionIds: [],
    allowedUserIds: [],
  });
  return itemRef.id;
};

export const updateItem = async (itemId: string, data: Partial<Item>) => {
  const itemRef = doc(db, 'items', itemId);
  await updateDoc(itemRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const subscribeItem = (itemId: string, callback: (item: Item | null) => void) => {
  const itemRef = doc(db, 'items', itemId);
  return onSnapshot(itemRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = itemSchema.safeParse(snapshot.data());
    if (!data.success) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...data.data });
  });
};
