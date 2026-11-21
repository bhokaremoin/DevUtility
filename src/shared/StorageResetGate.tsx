import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  shouldReset: boolean;
  children: React.ReactNode;
}

// Every tool's root runs in one JS context, so they share this promise and storage is cleared once.
let storageReset: Promise<void> | null = null;

function resetStorageOnce(): Promise<void> {
  if (!storageReset) {
    storageReset = AsyncStorage.clear().catch(error => console.error('E2E storage reset failed', error));
  }
  return storageReset;
}

// Renders children immediately unless the E2E build's --e2e-reset flag asked for a storage wipe.
export function StorageResetGate({shouldReset, children}: Props) {
  const [isReady, setIsReady] = useState(!shouldReset);

  useEffect(() => {
    if (!shouldReset) {
      return;
    }
    resetStorageOnce().finally(() => setIsReady(true));
  }, [shouldReset]);

  return isReady ? <>{children}</> : null;
}
