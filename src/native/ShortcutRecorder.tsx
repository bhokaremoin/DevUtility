import {requireNativeComponent} from 'react-native';
import type {ViewStyle} from 'react-native';

interface ShortcutRecorderProps {
  style?: ViewStyle;
}

export const ShortcutRecorder =
  requireNativeComponent<ShortcutRecorderProps>('ShortcutRecorder');
