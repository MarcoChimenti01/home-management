import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastHost } from '@/components/ToastHost';
import { SessionProvider, useSession } from '@/lib/session';
import { useHousehold } from '@/lib/household';

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading } = useSession();
  const { data: household, isLoading: householdLoading } = useHousehold();
  const segments = useSegments();
  const router = useRouter();

  const waiting = loading || (!!session && householdLoading);

  useEffect(() => {
    if (waiting) return;
    const group = segments[0];
    if (!session) {
      if (group !== '(auth)') router.replace('/login');
    } else if (!household) {
      if (group !== '(onboarding)') router.replace('/household');
    } else if (group === '(auth)' || group === '(onboarding)') {
      router.replace('/');
    }
  }, [session, household, waiting, segments, router]);

  if (waiting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthGate />
        <ToastHost />
      </SessionProvider>
    </QueryClientProvider>
  );
}
