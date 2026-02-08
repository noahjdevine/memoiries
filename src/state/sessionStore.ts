import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type UserRole = 'owner' | 'helper' | null;

type SessionState = {
  role: UserRole;
  activeOwnerId: string | null;
  activeOwnerName: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setRole: (role: UserRole) => void;
  setActiveOwner: (ownerId: string | null, ownerName: string | null) => Promise<void>;
  clearActiveOwner: () => Promise<void>;
  resetSession: () => Promise<void>;
};

const ACTIVE_OWNER_STORAGE_KEY = 'memoiries.activeOwner';

type StoredOwner = {
  activeOwnerId: string | null;
  activeOwnerName: string | null;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  role: null,
  activeOwnerId: null,
  activeOwnerName: null,
  hydrated: false,
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(ACTIVE_OWNER_STORAGE_KEY);
    if (!stored) {
      set({ hydrated: true });
      return;
    }
    try {
      const parsed = JSON.parse(stored) as StoredOwner;
      set({
        activeOwnerId: parsed.activeOwnerId ?? null,
        activeOwnerName: parsed.activeOwnerName ?? null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  setRole: (role) => set({ role }),
  setActiveOwner: async (ownerId, ownerName) => {
    const next: StoredOwner = {
      activeOwnerId: ownerId,
      activeOwnerName: ownerName,
    };
    await AsyncStorage.setItem(ACTIVE_OWNER_STORAGE_KEY, JSON.stringify(next));
    set({ activeOwnerId: ownerId, activeOwnerName: ownerName });
  },
  clearActiveOwner: async () => {
    const next: StoredOwner = {
      activeOwnerId: null,
      activeOwnerName: null,
    };
    await AsyncStorage.setItem(ACTIVE_OWNER_STORAGE_KEY, JSON.stringify(next));
    set({ activeOwnerId: null, activeOwnerName: null });
  },
  resetSession: async () => {
    await AsyncStorage.removeItem(ACTIVE_OWNER_STORAGE_KEY);
    set({ role: null, activeOwnerId: null, activeOwnerName: null });
  },
}));
