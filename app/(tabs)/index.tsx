<<<<<<< ours
import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
=======
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton } from '../../src/components/BigButton';
import { auth } from '../../src/services/firebase';
import { useCaptureStore } from '../../src/state/captureStore';
import { subscribeRecentItemsByOwner } from '../../src/services/feedService';
import { Item } from '../../src/services/itemService';
import { useSessionStore } from '../../src/state/sessionStore';
import { subscribeHelperOwners, subscribeUserProfile } from '../../src/services/userService';

const HomeScreen = () => {
  const router = useRouter();
  const startNewDraft = useCaptureStore((state) => state.startNewDraft);
  const hydrateDraft = useCaptureStore((state) => state.hydrateDraft);
  const resetDraft = useCaptureStore((state) => state.resetDraft);
  const draft = useCaptureStore((state) => state.draft);
  const hasHydrated = useCaptureStore((state) => state.hasHydrated);
  const role = useSessionStore((state) => state.role);
  const activeOwnerId = useSessionStore((state) => state.activeOwnerId);
  const activeOwnerName = useSessionStore((state) => state.activeOwnerName);
  const setRole = useSessionStore((state) => state.setRole);
  const setActiveOwner = useSessionStore((state) => state.setActiveOwner);
  const clearActiveOwner = useSessionStore((state) => state.clearActiveOwner);
  const hydrateSession = useSessionStore((state) => state.hydrate);
  const sessionHydrated = useSessionStore((state) => state.hydrated);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [owners, setOwners] = useState<Array<{ ownerId: string; displayName: string }>>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [feedRetryToken, setFeedRetryToken] = useState(0);
  const [hasPromptedResume, setHasPromptedResume] = useState(false);

  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid ?? null;

  const resumeRoute = useMemo(() => {
    if (draft.photos.length === 0) return '/capture/photos';
    if (!draft.audio) return '/capture/record';
    return '/capture/transcript';
  }, [draft.audio, draft.photos.length]);

  const hasDraftContent = useMemo(() => {
    return (
      draft.photos.length > 0 ||
      Boolean(draft.audio) ||
      Boolean(draft.transcript) ||
      Boolean(draft.title) ||
      Boolean(draft.promptKey)
    );
  }, [draft.audio, draft.photos.length, draft.promptKey, draft.title, draft.transcript]);

  useEffect(() => {
    hydrateDraft();
  }, [hydrateDraft]);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (!currentUserId) {
      setProfileLoading(false);
      return;
    }
    const userId = currentUserId;
    const unsubscribe = subscribeUserProfile(userId, (profile) => {
      const nextRole = profile?.role ?? 'owner';
      setRole(nextRole);
      if (nextRole === 'owner') {
        setActiveOwner(userId, profile?.displayName ?? 'You');
      }
      setProfileLoading(false);
    });
    return unsubscribe;
  }, [setActiveOwner, setRole]);

  useEffect(() => {
    if (!sessionHydrated || role !== 'owner' || !currentUserId) return;
    setActiveOwner(currentUserId, activeOwnerName ?? 'You');
  }, [activeOwnerName, role, sessionHydrated, setActiveOwner]);

  useEffect(() => {
    if (profileLoading || !role) {
      setIsLoading(true);
      return;
    }
    if (role === 'helper' && !activeOwnerId) {
      setItems([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }
    const userId = activeOwnerId ?? currentUserId;
    if (!userId) return;
    setIsLoading(true);
    const unsubscribe = subscribeRecentItemsByOwner(
      userId,
      10,
      (recent) => {
        setItems(recent);
        setIsLoading(false);
        setErrorMessage(null);
      },
      () => {
        setIsLoading(false);
        setErrorMessage('We had trouble loading recent stories.');
      },
    );
    return unsubscribe;
  }, [activeOwnerId, feedRetryToken, profileLoading, role]);

  useEffect(() => {
    if (role !== 'helper' || !currentUserId) return;
    const helperId = currentUserId;
    setOwnersLoading(true);
    const unsubscribe = subscribeHelperOwners(helperId, (list) => {
      const ownersList = list.map((owner) => ({
        ownerId: owner.id,
        displayName: owner.displayName ?? 'Unnamed',
      }));
      setOwners(ownersList);
      setOwnersLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  useEffect(() => {
    if (!hasHydrated || !hasDraftContent || hasPromptedResume) return;
    setHasPromptedResume(true);
    Alert.alert(
      'Resume your unfinished story?',
      'Pick up where you left off or start fresh.',
      [
        {
          text: 'Start over',
          style: 'destructive',
          onPress: () => resetDraft(),
        },
        {
          text: 'Resume',
          onPress: () => router.push(resumeRoute),
        },
      ],
    );
  }, [hasDraftContent, hasHydrated, hasPromptedResume, resetDraft, resumeRoute, router]);

  if (!currentUserId) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title} allowFontScaling>
          Memoiries
        </Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle} allowFontScaling>
            You’re signed out.
          </Text>
          <Text style={styles.emptyText} allowFontScaling>
            Please sign in to capture or view stories.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (profileLoading || !sessionHydrated) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title} allowFontScaling>
          Memoiries
        </Text>
        <View style={styles.loadingCard} accessibilityLabel="Loading profile">
          <ActivityIndicator size="large" color="#1A4DFF" />
          <Text style={styles.loadingText} allowFontScaling>
            Loading your dashboard…
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (role === 'helper' && !activeOwnerId) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title} allowFontScaling>
          Who are you helping today?
        </Text>
        <Text style={styles.subtitle} allowFontScaling>
          Choose a person to capture stories with.
        </Text>
        {ownersLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1A4DFF" />
            <Text style={styles.loadingText} allowFontScaling>
              Loading owners…
            </Text>
          </View>
        ) : null}
        {!ownersLoading && owners.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle} allowFontScaling>
              No owners linked yet.
            </Text>
            <Text style={styles.emptyText} allowFontScaling>
              Ask an owner to add you as a helper.
            </Text>
          </View>
        ) : null}
        {!ownersLoading
          ? owners.map((owner) => (
              <Pressable
                key={owner.ownerId}
                onPress={() => setActiveOwner(owner.ownerId, owner.displayName)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${owner.displayName}`}
                accessibilityHint="Sets the owner you are helping"
                style={styles.ownerRow}
              >
                <View style={styles.ownerAvatar}>
                  <Text style={styles.ownerInitials} allowFontScaling>
                    {owner.displayName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName} allowFontScaling>
                    {owner.displayName}
                  </Text>
                </View>
              </Pressable>
            ))
          : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title} allowFontScaling>
        Memoiries
      </Text>
      <Text style={styles.subtitle} allowFontScaling>
        Capture the stories behind what matters most.
      </Text>
      {role === 'helper' && activeOwnerName ? (
        <View style={styles.helperBanner}>
          <Text style={styles.helperText} allowFontScaling>
            Capturing for: {activeOwnerName}
          </Text>
          <Pressable
            onPress={() => {
              clearActiveOwner();
              setItems([]);
              setErrorMessage(null);
              setIsLoading(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Change active owner"
            accessibilityHint="Clears the current owner selection"
            style={styles.changeOwnerButton}
          >
            <Text style={styles.changeOwnerText} allowFontScaling>
              Change
            </Text>
          </Pressable>
        </View>
      ) : null}
      <BigButton
        label="Capture an item"
        onPress={() => {
          if (role === 'helper' && !activeOwnerId) {
            Alert.alert(
              'Choose an owner first',
              'Select who you are helping before capturing a new item.',
            );
            return;
          }
          const ownerId = role === 'helper' ? activeOwnerId : currentUserId;
          if (!ownerId) {
            Alert.alert(
              'Choose an owner first',
              'Select who you are helping before capturing a new item.',
            );
            return;
          }
          startNewDraft(ownerId, currentUserId);
          router.push('/capture/photos');
        }}
        accessibilityLabel="Capture an item"
        accessibilityHint="Starts the photo capture step"
      />
      {hasDraftContent ? (
        <View style={styles.resumeCard}>
          <Text style={styles.resumeTitle} allowFontScaling>
            Resume unfinished story
          </Text>
          <Text style={styles.resumeBody} allowFontScaling>
            Pick up where you left off.
          </Text>
          <BigButton
            label="Resume draft"
            onPress={() => router.push(resumeRoute)}
            accessibilityLabel="Resume draft"
            accessibilityHint="Continues your unfinished capture flow"
          />
        </View>
      ) : null}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} allowFontScaling>
          Recent items
        </Text>
      </View>
      {isLoading ? (
        <View
          style={styles.loadingCard}
          accessibilityLabel="Loading recent items"
          accessibilityHint="Recent items are loading"
        >
          <ActivityIndicator size="large" color="#1A4DFF" />
          <Text style={styles.loadingText} allowFontScaling>
            Loading your stories…
          </Text>
        </View>
      ) : null}
      {errorMessage ? (
        <View
          style={styles.errorCard}
          accessibilityLabel="Recent items failed to load"
          accessibilityHint="Check your connection and try again later"
        >
          <Text style={styles.errorText} allowFontScaling>
            Something went wrong.
          </Text>
          <BigButton
            label="Try again"
            onPress={() => {
              setIsLoading(true);
              setErrorMessage(null);
              setFeedRetryToken((value) => value + 1);
            }}
            accessibilityLabel="Try again"
            accessibilityHint="Retries loading recent items"
          />
        </View>
      ) : null}
      {!isLoading && !errorMessage && items.length === 0 ? (
        <View
          style={styles.emptyCard}
          accessibilityLabel="No recent items"
          accessibilityHint="Start capturing a new item"
        >
          <Text style={styles.emptyTitle} allowFontScaling>
            No stories yet.
          </Text>
          <Text style={styles.emptyText} allowFontScaling>
            When you’re ready, capture a new item so its story stays safe.
          </Text>
          <BigButton
            label="Capture an item"
            onPress={() => {
              if (role === 'helper' && !activeOwnerId) {
                Alert.alert(
                  'Choose an owner first',
                  'Select who you are helping before capturing a new item.',
                );
                return;
              }
              const ownerId = role === 'helper' ? activeOwnerId : currentUserId;
              if (!ownerId) {
                Alert.alert(
                  'Choose an owner first',
                  'Select who you are helping before capturing a new item.',
                );
                return;
              }
              startNewDraft(ownerId, currentUserId);
              router.push('/capture/photos');
            }}
            accessibilityLabel="Capture an item"
            accessibilityHint="Starts the photo capture step"
          />
        </View>
      ) : null}
      {!isLoading && !errorMessage
        ? items.map((item) => {
            const coverPhoto = item.photos?.[0]?.url;
            const snippet = item.transcription?.text?.slice(0, 100) ?? 'Story coming soon.';
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/items/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title ?? 'item story'}`}
                accessibilityHint="Opens the item detail screen"
                style={styles.itemCard}
              >
                {coverPhoto ? (
                  <Image
                    source={{ uri: coverPhoto }}
                    style={styles.itemImage}
                    accessibilityLabel="Item cover photo"
                    accessibilityHint="Cover photo for the item"
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={styles.itemPlaceholderText} allowFontScaling>
                      No photo yet
                    </Text>
                  </View>
                )}
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle} allowFontScaling numberOfLines={1}>
                    {item.title ?? 'Untitled story'}
                  </Text>
                  <Text style={styles.itemSnippet} allowFontScaling numberOfLines={2}>
                    {snippet}
                  </Text>
                  {item.outcome ? (
                    <View style={styles.outcomeChip}>
                      <Text style={styles.outcomeText} allowFontScaling>
                        {item.outcome}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#475467',
    marginBottom: 8,
  },
  resumeCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  resumeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  resumeBody: {
    fontSize: 16,
    color: '#475467',
  },
  helperBanner: {
    backgroundColor: '#EEF4FF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  helperText: {
    fontSize: 16,
    color: '#1A4DFF',
    fontWeight: '600',
  },
  changeOwnerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1A4DFF',
    minHeight: 44,
    justifyContent: 'center',
  },
  changeOwnerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#475467',
  },
  errorCard: {
    backgroundColor: '#FEF3F2',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#7A271A',
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  emptyText: {
    fontSize: 16,
    color: '#475467',
  },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 12,
    minHeight: 96,
  },
  itemImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
  },
  itemImagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  itemPlaceholderText: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 6,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  itemSnippet: {
    fontSize: 15,
    color: '#475467',
  },
  outcomeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF4FF',
  },
  outcomeText: {
    fontSize: 14,
    color: '#1A4DFF',
    fontWeight: '600',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    minHeight: 72,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A4DFF',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
});

export default HomeScreen;
>>>>>>> theirs
