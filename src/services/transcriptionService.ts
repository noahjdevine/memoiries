import { httpsCallable } from 'firebase/functions';
import { z } from 'zod';
import { functions } from './firebase';
import { logger } from '../utils/logger';

const requestSchema = z.object({
  itemId: z.string(),
});

export const requestTranscription = async (itemId: string) => {
  const parsed = requestSchema.parse({ itemId });
  const callable = httpsCallable(functions, 'requestTranscription');
  const startTime = Date.now();
  logger.info('Transcription request started', { itemId });
  await callable(parsed);
  logger.info('Transcription request completed', { itemId, durationMs: Date.now() - startTime });
};
