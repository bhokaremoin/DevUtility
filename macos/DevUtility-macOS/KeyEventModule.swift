// KeyEventModule.swift
// DevUtility
//
// Description: React Native event emitter that intercepts NSPanel keyboard events
//   and translates them into JS-layer events for shortcut dispatch.
// Architecture Role: Local NSEvent monitor bridge. Installed when JS subscribes
//   (startObserving) and removed when all listeners are gone (stopObserving).
//   Translates raw key codes into semantic event names consumed by
//   `useKeyboardShortcuts` in the JS layer.

import Cocoa

/// React Native event emitter that intercepts local key-down events on the panel
/// and emits named shortcut events to the JS layer.
///
/// Emitted events:
/// - `onNavigate`        — ⌘1/⌘2/⌘3 tab switch; body `{tab: "clipboard"|"snippets"|"settings"}`
/// - `onCopyAction`      — Enter (outside text input) or ⌘Enter; no body
/// - `onEscape`          — Escape key; no body
/// - `onSearch`          — ⌘F; no body
/// - `onArrowNavigation` — ↑/↓; body `{direction: "up"|"down"}`
@objc(KeyEventModule)
class KeyEventModule: RCTEventEmitter {
  /// The installed local NSEvent monitor, or `nil` when not observing.
  private var localMonitor: Any?
  /// Guards event emission; set true/false in sync with monitor install/removal.
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool { true }

  /// Declares the full set of events this emitter can dispatch to JS.
  override func supportedEvents() -> [String] {
    ["onNavigate", "onCopyAction", "onEscape", "onSearch", "onArrowNavigation"]
  }

  /// Called by RN when the first JS listener subscribes. Installs the key monitor.
  override func startObserving() {
    // Set hasListeners and install the monitor together on the main thread
    // to avoid a race where hasListeners=true but the monitor closure already
    // ran and saw hasListeners=false (or vice-versa).
    if Thread.isMainThread {
      hasListeners = true
      installMonitor()
    } else {
      DispatchQueue.main.async {
        self.hasListeners = true
        self.installMonitor()
      }
    }
  }

  /// Called by RN when the last JS listener unsubscribes. Removes the key monitor.
  override func stopObserving() {
    if Thread.isMainThread {
      hasListeners = false
      removeMonitor()
    } else {
      DispatchQueue.main.async {
        self.hasListeners = false
        self.removeMonitor()
      }
    }
  }

  /// Replaces any existing monitor with a fresh local key-down monitor.
  private func installMonitor() {
    removeMonitor()
    localMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
      guard let self = self, self.hasListeners else {
        return event
      }
      return self.handleKeyEvent(event)
    }
  }

  /// Removes and nullifies the local key-down monitor.
  private func removeMonitor() {
    if let monitor = localMonitor {
      NSEvent.removeMonitor(monitor)
      localMonitor = nil
    }
  }

  private func handleKeyEvent(_ event: NSEvent) -> NSEvent? {
    let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
    let isCmd = flags.contains(.command)
    let isTextInputFocused = NSApp.keyWindow?.firstResponder is NSTextView

    if isCmd && event.keyCode == 18 {
      sendEvent(withName: "onNavigate", body: ["tab": "clipboard"])
      return nil
    }
    if isCmd && event.keyCode == 19 {
      sendEvent(withName: "onNavigate", body: ["tab": "snippets"])
      return nil
    }
    if isCmd && event.keyCode == 43 {
      sendEvent(withName: "onNavigate", body: ["tab": "settings"])
      return nil
    }
    if isCmd && event.keyCode == 3 {
      sendEvent(withName: "onSearch", body: nil)
      return nil
    }

    if event.keyCode == 36 {
      if isCmd || !isTextInputFocused {
        sendEvent(withName: "onCopyAction", body: nil)
        return nil
      }
    }

    if event.keyCode == 53 {
      sendEvent(withName: "onEscape", body: nil)
      return nil
    }

    if event.keyCode == 125 || event.keyCode == 126 {
      let direction = event.keyCode == 125 ? "down" : "up"
      // If a multiline text editor is focused (detail pane editor), pass the event
      // through so cursor movement still works, but also notify JS so it can decide
      // whether to navigate (it will bail if the detail editor is focused).
      if let textView = NSApp.keyWindow?.firstResponder as? NSTextView,
         (textView.textContainer?.maximumNumberOfLines ?? 0) == 0 {
        sendEvent(withName: "onArrowNavigation", body: ["direction": direction])
        return event // don't consume — let cursor move in the editor
      }
      // Otherwise (no text input focused, or single-line search input): navigate.
      sendEvent(withName: "onArrowNavigation", body: ["direction": direction])
      return nil
    }

    return event
  }

  /// Hides the panel. Exposed to JS so the Escape handler in `App.tsx` can
  /// dismiss the panel without importing a separate native module.
  @objc func hidePanel() {
    DispatchQueue.main.async {
      PanelManager.shared.hide()
    }
  }
}
