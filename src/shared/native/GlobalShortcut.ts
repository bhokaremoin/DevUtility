import {NativeEventEmitter, NativeModules} from 'react-native';
import {ToolId} from '../toolIds';

const {GlobalShortcutModule} = NativeModules;
const emitter = GlobalShortcutModule ? new NativeEventEmitter(GlobalShortcutModule) : null;

export interface ShortcutInfo {
  /** AppKit key code of the shortcut's key. */
  keyCode: number;
  /** NSEvent.ModifierFlags raw value. */
  modifiers: number;
  /** As macOS shows it, e.g. `⌃⌥V`. */
  description: string;
}

export interface ToolShortcutInfo {
  id: ToolId;
  displayName: string;
  defaultShortcutLabel: string;
}

export interface ShortcutChange {
  assignedToolId: ToolId;
  /** Tools that had the same shortcut and lost it. */
  clearedToolIds: ToolId[];
}

export const GlobalShortcut = {
  /** Every tool, in the order the native registry lists them. */
  tools: (GlobalShortcutModule?.tools ?? []) as ToolShortcutInfo[],

  /** Resolves with `null` when the tool has no shortcut. */
  getShortcut: (toolId: ToolId): Promise<ShortcutInfo | null> => GlobalShortcutModule.getShortcut(toolId),

  resetShortcut: (toolId: ToolId): void => GlobalShortcutModule.resetShortcut(toolId),

  /** Calls `listener` after the user records or clears a shortcut. Returns the unsubscribe function. */
  onShortcutChange: (listener: (change: ShortcutChange) => void): (() => void) => {
    const subscription = emitter?.addListener('onShortcutChange', listener);
    return () => subscription?.remove();
  },
};
