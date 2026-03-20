// index.js — React Native entry point.
// Registers the root App component with the native bridge so the macOS runtime
// knows which component to mount when the JS bundle starts.

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
