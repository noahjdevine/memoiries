import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { createItemDraft, updateItem } from '../services/itemService';
import { uploadAudio, uploadPhoto } from '../services/storageService';
import { requestTranscription } from '../services/transcriptionService';
import { logger } from '../utils/logger';
import { useSessionStore } from './sessionStore';

export type DraftPhoto = {
  localUri: string;
  remoteUrl?: string;
  path?: string;
};

export type DraftAudio = {
  localUri: string;
  durationSec: number;
  mime: string;
  remoteUrl?: string;
  path?: string;
};

export type DraftItem = {
  itemId?: string;
  ownerId?: string;
  createdById?: string;
  title?: string;
  promptKey?: string;
  photos: DraftPhoto[];
  audio?: DraftAudio;
  transcript?: string;
  visibility: 'private' | 'family' | 'specific';
  allowedUserIds: string[];
  outcome?: 'keep' | 'gift' | 'donate' | 'sell' | 'discard';
};

type CaptureState = {
  draft: DraftItem;
  isSaving: boolean;
  errorMessage?: string;
  uploadProgress: number;
  hasHydrated: boolean;
  startNewDraft: (ownerId: string, createdById: string) => boolean;
  addPhoto: (localUri: string) => void;
  removePhoto: (index: number) => void;
  setAudio: (localUri: string, durationSec: number, mime: string) => void;
  setPromptKey: (promptKey: string) => void;
  setTitle: (title: string) => void;
  setTranscript: (text: string) => void;
  setVisibility: (mode: DraftItem['visibility']) => void;
  setAllowedUserIds: (ids: string[]) => void;
  setOutcome: (outcome: DraftItem['outcome']) => void;
  resetDraft: () => void;
  persistDraftToFirestore: () => Promise<string>;
  hydrateDraft: () => Promise<void>;
  clearDraftLocal: () => Promise<void>;
  retryTranscription: () => Promise<void>;
};

const baseDraft: DraftItem = {
  photos: [],
  visibility: 'private',
  allowedUserIds: [],
};

const draftSchema = z.object({
  ownerId: z.string(),
  createdById: z.string(),
});

const persistedDraftSchema = z.object({
  itemId: z.string().optional(),
  ownerId: z.string().optional(),
  createdById: z.string().optional(),
  title: z.string().optional(),
  promptKey: z.string().optional(),
  photos: z.array(
    z.object({
      localUri: z.string(),
      remoteUrl: z.string().optional(),
      path: z.string().optional(),
    }),
  ),
  audio: z
    .object({
      localUri: z.string(),
      durationSec: z.number(),
      mime: z.string(),
      remoteUrl: z.string().optional(),
      path: z.string().optional(),
    })
    .optional(),
  transcript: z.string().optional(),
  visibility: z.enum(['private', 'family', 'specific']),
  allowedUserIds: z.array(z.string()),
  outcome: z.enum(['keep', 'gift', 'donate', 'sell', 'discard']).optional(),
});

const DRAFT_STORAGE_KEY = 'memoiries:captureDraft';

export const useCaptureStore = create<CaptureState>((set, get) => ({
  draft: baseDraft,
  isSaving: false,
  uploadProgress: 0,
  hasHydrated: false,
  hydrateDraft: async () => {
    try {
      const stored = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (!stored) {
        set({ hasHydrated: true });
        return;
      }
      const parsed = persistedDraftSchema.safeParse(JSON.parse(stored));
      if (!parsed.success) {
        set({ hasHydrated: true });
        return;
      }
      set({ draft: parsed.data, hasHydrated: true });
    } catch (error) {
      logger.error('Draft hydrate failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      set({ hasHydrated: true });
    }
  },
  clearDraftLocal: async () => {
    await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
  },
  startNewDraft: (ownerId, createdById) => {
    const { role, activeOwnerId } = useSessionStore.getState();
    if (role === 'helper' && !activeOwnerId) {
      set({ errorMessage: 'Select an owner before starting a new capture.' });
      return false;
    }
    const resolvedOwnerId = role === 'helper' ? activeOwnerId ?? ownerId : ownerId;
    const draft = { ...baseDraft, ownerId: resolvedOwnerId, createdById };
    AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft)).catch((error) => {
      logger.error('Failed to persist new draft', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
    set({ draft, errorMessage: undefined });
    return true;
  },
  addPhoto: (localUri) =>
    set((state) => {
      const draft = { ...state.draft, photos: [...state.draft.photos, { localUri }] };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  removePhoto: (index) =>
    set((state) => {
      const draft = {
        ...state.draft,
        photos: state.draft.photos.filter((_, idx) => idx !== index),
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  setAudio: (localUri, durationSec, mime) =>
    set((state) => {
      const draft = { ...state.draft, audio: { localUri, durationSec, mime } };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  setPromptKey: (promptKey) =>
    set((state) => {
      const draft = { ...state.draft, promptKey };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  setTitle: (title) =>
    set((state) => {
      const draft = { ...state.draft, title };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  setTranscript: (text) =>
    set((state) => {
      const draft = { ...state.draft, transcript: text };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  setVisibility: (mode) =>
    set((state) => {
      const draft = { ...state.draft, visibility: mode };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  setAllowedUserIds: (ids) =>
    set((state) => {
      const draft = { ...state.draft, allowedUserIds: ids };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  setOutcome: (outcome) =>
    set((state) => {
      const draft = { ...state.draft, outcome };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return { draft };
    }),
  resetDraft: () => {
    AsyncStorage.removeItem(DRAFT_STORAGE_KEY).catch((error) => {
      logger.error('Failed to clear draft', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
    set({ draft: baseDraft, errorMessage: undefined });
  },
  retryTranscription: async () => {
    const { draft } = get();
    if (!draft.itemId || !draft.audio?.path) {
      throw new Error('No uploaded audio available to retry transcription.');
    }
    logger.info('Retry transcription requested', { itemId: draft.itemId });
    await requestTranscription(draft.itemId);
  },
  persistDraftToFirestore: async () => {
    const { draft } = get();
    const parsed = draftSchema.safeParse({
      ownerId: draft.ownerId,
      createdById: draft.createdById,
    });
    if (!parsed.success) {
      set({ errorMessage: 'Missing owner or creator information.' });
      throw new Error('Missing owner or creator information.');
    }

    set({ isSaving: true, errorMessage: undefined, uploadProgress: 0 });
    logger.info('Item save started', { itemId: draft.itemId ?? 'new' });

    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        set({
          isSaving: false,
          errorMessage: "You're offline. We'll try again when you're back online.",
        });
        throw new Error('Offline');
      }
      let itemId = draft.itemId;
      if (!itemId) {
        itemId = await createItemDraft(parsed.data.ownerId, parsed.data.createdById);
        set((state) => {
          const updated = { ...state.draft, itemId };
          AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
          return { draft: updated };
        });
      }

      const shouldRequestTranscription = Boolean(draft.audio && !draft.audio.remoteUrl);
      const uploadedPhotos = await Promise.all(
        draft.photos.map(async (photo, index) => {
          if (photo.remoteUrl && photo.path) {
            return photo;
          }
          const result = await uploadPhoto(
            parsed.data.ownerId,
            itemId,
            photo.localUri,
            index,
            (progress) => set({ uploadProgress: progress }),
          );
          return { ...photo, remoteUrl: result.downloadUrl, path: result.path };
        }),
      );

      let uploadedAudio = draft.audio;
      if (draft.audio && !draft.audio.remoteUrl) {
        const result = await uploadAudio(
          parsed.data.ownerId,
          itemId,
          draft.audio.localUri,
          draft.audio.mime,
          (progress) => set({ uploadProgress: progress }),
        );
        uploadedAudio = {
          ...draft.audio,
          remoteUrl: result.downloadUrl,
          path: result.path,
        };
      }

      const transcriptionPayload = uploadedAudio
        ? {
            status: shouldRequestTranscription ? 'processing' : 'idle',
            text: draft.transcript,
            provider: 'whisper',
          }
        : undefined;

      await updateItem(itemId, {
        ownerId: parsed.data.ownerId,
        createdById: parsed.data.createdById,
        title: draft.title ?? null,
        promptKey: draft.promptKey ?? null,
        photos: uploadedPhotos.map((photo) => ({
          url: photo.remoteUrl ?? '',
          path: photo.path ?? '',
        })),
        audio: uploadedAudio
          ? {
              url: uploadedAudio.remoteUrl ?? '',
              path: uploadedAudio.path ?? '',
              durationSec: uploadedAudio.durationSec,
              mime: uploadedAudio.mime,
            }
          : undefined,
        ...(transcriptionPayload ? { transcription: transcriptionPayload } : {}),
        visibility: draft.visibility,
        allowedUserIds: draft.allowedUserIds,
        outcome: draft.outcome,
      });

      if (uploadedAudio && shouldRequestTranscription) {
        try {
          await requestTranscription(itemId);
        } catch (error) {
          await updateItem(itemId, {
            transcription: {
              status: 'error',
              errorMessage:
                error instanceof Error ? error.message : 'Transcription request failed.',
            },
          });
          throw error;
        }
      }

      set((state) => ({
        draft: {
          ...state.draft,
          photos: uploadedPhotos,
          audio: uploadedAudio,
          itemId,
        },
        isSaving: false,
      }));

      logger.info('Item save completed', { itemId });
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(get().draft));
      return itemId;
    } catch (error) {
      set({ isSaving: false, errorMessage: 'Saving failed. Please try again.' });
      logger.error('Item save failed', {
        itemId: draft.itemId ?? 'new',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
}));
