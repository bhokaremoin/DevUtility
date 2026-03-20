/**
 * @file native/GlobalShortcut.ts
 * @description JavaScript interface for the native `GlobalShortcutModule`.
 *
 * Architecture Role: Typed façade over the raw NativeModules bridge so
 * consumers (e.g. `SettingsScreen`) get a typed API instead of dynamic
 * property access. The underlying Swift module registers/manages the
 * global hotkey via the `KeyboardShortcuts` library.
 */

import {NativeModules} from 'react-native';

// Destructure once so all calls go through this typed proxy.
const {GlobalShortcutModule} = NativeModules;

/** The current global shortcut configuration returned by `getShortcut`. */
export interface ShortcutInfo {
  /** Raw AppKit key code of the shortcut key. */
  keyCode: number;
  /** Bitmask of modifier flags (NSEventModifierFlags raw value). */
  modifiers: number;
  /** Human-readable label, e.g. `"⌃⌥D"`. */
  description: string;
}

/** Typed JS façade for the native `GlobalShortcutModule`. */
export const GlobalShortcut = {
  /**
   * Retrieves the currently registered global shortcut from the native layer.
   * @returns A `ShortcutInfo` object, or `null` if no shortcut is set.
   */
  getShortcut: (): Promise<ShortcutInfo | null> =>
    GlobalShortcutModule.getShortcut(),

  /**
   * Resets the global shortcut to its factory default (Ctrl+Option+D).
   */
  resetShortcut: (): void => GlobalShortcutModule.resetShortcut(),
};
