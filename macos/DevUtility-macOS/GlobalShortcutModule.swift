// GlobalShortcutModule.swift
// DevUtility
//
// Description: React Native module that manages the global toggle keyboard shortcut.
// Architecture Role: Registers the system-wide hotkey using the KeyboardShortcuts
//   library and bridges its state (read/reset) to the JS settings screen.

import Cocoa
import KeyboardShortcuts

/// The named shortcut used throughout the app for toggling the panel.
/// Default binding: Ctrl+Option+D (⌃⌥D).
extension KeyboardShortcuts.Name {
  static let toggleApp = Self("toggleApp", default: .init(.d, modifiers: [.control, .option]))
}

/// React Native module that registers the global hotkey and exposes shortcut
/// management to the JS settings screen.
///
/// On init the module wires `KeyboardShortcuts.onKeyDown` to `PanelManager.toggle()`,
/// so the shortcut works system-wide regardless of which app is in focus.
@objc(GlobalShortcutModule)
class GlobalShortcutModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { true }

  override init() {
    super.init()
    // Register the global key-down handler — fires even when the app is backgrounded.
    KeyboardShortcuts.onKeyDown(for: .toggleApp) {
      PanelManager.shared.toggle()
    }
  }

  /// Returns the currently registered shortcut as a JS-serializable dictionary
  /// with `keyCode`, `modifiers`, and `description` keys, or resolves with
  /// `NSNull` if no shortcut is configured.
  @objc func getShortcut(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let shortcut = KeyboardShortcuts.getShortcut(for: .toggleApp) else {
        resolve(NSNull())
        return
      }
      var result: [String: Any] = [:]
      if let key = shortcut.key {
        result["keyCode"] = Int(key.rawValue)
      }
      result["modifiers"] = Int(shortcut.modifiers.rawValue)
      result["description"] = shortcut.description
      resolve(result)
    }
  }

  /// Resets the global shortcut to its compiled-in default (⌃⌥D).
  @objc func resetShortcut() {
    DispatchQueue.main.async {
      KeyboardShortcuts.reset(.toggleApp)
    }
  }
}
