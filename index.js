import React from 'react';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {StorageResetGate} from './src/testSupport/StorageResetGate';
import {name as appName} from './app.json';

function Root({isE2EReset = false}) {
  return (
    <StorageResetGate shouldReset={isE2EReset}>
      <App />
    </StorageResetGate>
  );
}

AppRegistry.registerComponent(appName, () => Root);
