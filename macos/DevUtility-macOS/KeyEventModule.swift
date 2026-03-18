import Cocoa

@objc(KeyEventModule)
class KeyEventModule: RCTEventEmitter {
  private var localMonitor: Any?
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String] {
    ["onNavigate", "onCopyAction", "onEscape", "onSearch"]
  }

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

  private func installMonitor() {
    removeMonitor()
    localMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
      guard let self = self, self.hasListeners else {
        return event
      }
      return self.handleKeyEvent(event)
    }
  }

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

    return event
  }

  @objc func hidePanel() {
    DispatchQueue.main.async {
      PanelManager.shared.hide()
    }
  }
}
