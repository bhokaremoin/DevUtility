// ShortcutRecorderViewManager.swift
// DevUtility
//
// Description: React Native view manager that bridges the KeyboardShortcuts
//   recorder control into the JS component tree.
// Architecture Role: Provides the native side of the `<ShortcutRecorder />`
//   component used in `SettingsScreen`. Creates a `KeyboardShortcuts.RecorderCocoa`
//   bound to the `toggleApp` shortcut name so any user input directly updates
//   the registered global shortcut without additional JS round-trips.

import Cocoa
import KeyboardShortcuts

/// RCTViewManager subclass that vends a `KeyboardShortcuts.RecorderCocoa` view
/// to React Native, registered under the module name `ShortcutRecorderManager`.
///
/// The recorder is pre-bound to the `.toggleApp` shortcut name so changes made
/// by the user are persisted automatically by the `KeyboardShortcuts` library.
@objc(ShortcutRecorderManager)
class ShortcutRecorderManager: RCTViewManager {

  override static func requiresMainQueueSetup() -> Bool { true }

  /// Returns a new `KeyboardShortcuts.RecorderCocoa` configured to record the
  /// global toggle shortcut. Content hugging is set high so the recorder
  /// doesn't stretch to fill its flex container.
  override func view() -> NSView {
    let recorder = KeyboardShortcuts.RecorderCocoa(for: .toggleApp)
    recorder.setContentHuggingPriority(.defaultHigh, for: .horizontal)
    recorder.setContentHuggingPriority(.defaultHigh, for: .vertical)
    return recorder
  }
}
