import Cocoa

/// Turns key presses in a tool panel into named events for JS. Every event carries the `toolId`
/// of the panel in front, and each tool's JS root ignores events for other tools.
///
/// Events:
/// - `onCopyAction`: Return outside a text input, or ⌘Return anywhere
/// - `onEscape`: Esc, body `{isTextInputFocused}`
/// - `onSearch`: ⌘F
/// - `onArrowNavigation`: ↑ or ↓, body `{direction: "up" | "down"}`
/// - `onPanelShown`: the tool's panel has just opened
///
/// ⌘, opens Settings here, without a JS round trip.
@objc(KeyEventModule)
final class KeyEventModule: RCTEventEmitter {
  private enum KeyCode {
    static let returnKey: UInt16 = 36
    static let escape: UInt16 = 53
    static let downArrow: UInt16 = 125
    static let upArrow: UInt16 = 126
    static let f: UInt16 = 3
    static let comma: UInt16 = 43
  }

  private var localMonitor: Any?
  private var panelOpenObserver: NSObjectProtocol?
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String] {
    ["onCopyAction", "onEscape", "onSearch", "onArrowNavigation", "onPanelShown"]
  }

  override func startObserving() {
    onMainThread {
      self.hasListeners = true
      self.installMonitor()
    }
  }

  override func stopObserving() {
    onMainThread {
      self.hasListeners = false
      self.removeMonitor()
    }
  }

  // The flag and the monitor change together on the main thread, so the monitor never sees a
  // stale flag.
  private func onMainThread(_ work: @escaping () -> Void) {
    if Thread.isMainThread {
      work()
    } else {
      DispatchQueue.main.async(execute: work)
    }
  }

  private func installMonitor() {
    removeMonitor()
    panelOpenObserver = NotificationCenter.default.addObserver(
      forName: .toolPanelDidOpen, object: nil, queue: .main
    ) { [weak self] notification in
      guard let self, self.hasListeners, let toolId = notification.object as? String else { return }
      self.send("onPanelShown", toolId: toolId)
    }
    localMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
      guard let self, self.hasListeners else { return event }
      return self.handleKeyEvent(event)
    }
  }

  private func removeMonitor() {
    if let observer = panelOpenObserver {
      NotificationCenter.default.removeObserver(observer)
      panelOpenObserver = nil
    }
    guard let monitor = localMonitor else { return }
    NSEvent.removeMonitor(monitor)
    localMonitor = nil
  }

  private func handleKeyEvent(_ event: NSEvent) -> NSEvent? {
    // Keys typed in Settings, alerts or the shortcut recorder belong to those windows.
    guard let panel = NSApp.keyWindow as? ToolPanel else { return event }

    let toolId = panel.toolId
    let isCommandDown = event.modifierFlags.intersection(.deviceIndependentFlagsMask).contains(.command)
    let focusedTextView = panel.firstResponder as? NSTextView

    switch event.keyCode {
    case KeyCode.comma where isCommandDown:
      SettingsWindowController.shared.show(openedFromToolId: toolId)
      return nil
    case KeyCode.f where isCommandDown:
      send("onSearch", toolId: toolId)
      return nil
    case KeyCode.returnKey where isCommandDown || focusedTextView == nil:
      send("onCopyAction", toolId: toolId)
      return nil
    case KeyCode.escape:
      // The panel's first responder is the truth about focus; JS focus events can miss a blur.
      send("onEscape", toolId: toolId, body: ["isTextInputFocused": focusedTextView != nil])
      return nil
    case KeyCode.downArrow, KeyCode.upArrow:
      send("onArrowNavigation", toolId: toolId, body: ["direction": event.keyCode == KeyCode.downArrow ? "down" : "up"])
      // In a multi-line editor the arrow also moves the cursor; JS skips list navigation there.
      let isMultilineEditor = focusedTextView.map { ($0.textContainer?.maximumNumberOfLines ?? 0) == 0 } ?? false
      return isMultilineEditor ? event : nil
    default:
      return event
    }
  }

  private func send(_ name: String, toolId: String, body: [String: Any] = [:]) {
    var taggedBody = body
    taggedBody["toolId"] = toolId
    sendEvent(withName: name, body: taggedBody)
  }
}
