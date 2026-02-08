import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { z } from 'zod';
import { db } from './firebase';

const userSchema = z.object({
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  role: z.enum(['owner', 'helper']).optional(),
  helperIds: z.array(z.string()).optional(),
});

export type UserProfile = z.infer<typeof userSchema> & { id: string };

export const subscribeUserProfile = (userId: string, callback: (user: UserProfile | null) => void) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const parsed = userSchema.safeParse(snapshot.data());
    if (!parsed.success) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...parsed.data });
  });
};

export const subscribeHelperOwners = (
  helperId: string,
  callback: (owners: UserProfile[]) => void,
) => {
  const usersRef = collection(db, 'users');
  const ownersQuery = query(usersRef, where('helperIds', 'array-contains', helperId));
  return onSnapshot(ownersQuery, (snapshot) => {
    const owners: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      const parsed = userSchema.safeParse(docSnap.data());
      if (parsed.success) {
        owners.push({ id: docSnap.id, ...parsed.data });
      }
    });
    callback(owners);
  });
};
