import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  shouldReset: boolean;
  children: React.ReactNode;
}

// Renders children immediately unless the E2E build's --e2e-reset flag asked for a storage wipe.
export function StorageResetGate({shouldReset, children}: Props) {
  const [isReady, setIsReady] = useState(!shouldReset);

  useEffect(() => {
    if (!shouldReset) {
      return;
    }
    AsyncStorage.clear()
      .catch(error => console.error('E2E storage reset failed', error))
      .finally(() => setIsReady(true));
  }, [shouldReset]);

  return isReady ? <>{children}</> : null;
}
