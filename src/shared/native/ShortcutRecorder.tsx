import {requireNativeComponent} from 'react-native';
import type {ViewStyle} from 'react-native';

/** Props accepted by the native ShortcutRecorder view. */
interface ShortcutRecorderProps {
  /** Layout and sizing for the recorder widget. */
  style?: ViewStyle;
}

/**
 * Native macOS shortcut-recorder component. Renders a `KeyboardShortcuts.RecorderCocoa`
 * control that lets the user press a new key combination to replace the global toggle shortcut.
 */
export const ShortcutRecorder =
  requireNativeComponent<ShortcutRecorderProps>('ShortcutRecorder');
