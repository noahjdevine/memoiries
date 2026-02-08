import {
  collection,
  DocumentData,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Item, itemSchema } from './itemService';

export const subscribeRecentItemsByOwner = (
  ownerId: string,
  pageSize: number,
  callback: (items: Item[]) => void,
  onError?: (error: Error) => void,
) => {
  const itemsRef = collection(db, 'items');
  const recentQuery = query(
    itemsRef,
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );

  return onSnapshot(
    recentQuery,
    (snapshot) => {
      const items: Item[] = [];
      snapshot.forEach((docSnap) => {
        const data = itemSchema.safeParse(docSnap.data());
        if (data.success) {
          items.push({ id: docSnap.id, ...data.data });
        }
      });
      callback(items);
    },
    (error) => {
      onError?.(error);
    },
  );
};

export const subscribeRecentItems = (
  ownerId: string,
  callback: (items: Item[]) => void,
  onError?: (error: Error) => void,
) => subscribeRecentItemsByOwner(ownerId, 10, callback, onError);
