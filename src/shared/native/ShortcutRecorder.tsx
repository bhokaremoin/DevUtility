import {requireNativeComponent} from 'react-native';
import type {ViewStyle} from 'react-native';
import {ToolId} from '../toolIds';

interface ShortcutRecorderProps {
  toolId: ToolId;
  style?: ViewStyle;
}

/** The shortcut library's macOS recorder; a recorded shortcut takes effect at once. */
export const ShortcutRecorder = requireNativeComponent<ShortcutRecorderProps>('ShortcutRecorder');
