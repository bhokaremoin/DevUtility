import Cocoa

class UtilityPanel: NSPanel {
  override var canBecomeKey: Bool { true }
  override var canBecomeMain: Bool { true }

  override func keyDown(with event: NSEvent) {
    if event.keyCode == 53 {
      PanelManager.shared.hide()
    } else {
      super.keyDown(with: event)
    }
  }

  override func cancelOperation(_ sender: Any?) {
    PanelManager.shared.hide()
  }
}

@objc class PanelManager: NSObject {
  @objc static let shared = PanelManager()

  private var panel: UtilityPanel!
  private var statusItem: NSStatusItem!
  private var clickMonitor: Any?
  private var panelSize = NSSize(width: 800, height: 600)

  private override init() {
    super.init()
  }

  @objc func setup(with rootView: NSView) {
    panel = UtilityPanel(
      contentRect: NSRect(origin: .zero, size: panelSize),
      styleMask: [.titled, .closable, .resizable, .fullSizeContentView, .nonactivatingPanel],
      backing: .buffered,
      defer: false
    )

    panel.titlebarAppearsTransparent = true
    panel.titleVisibility = .hidden
    panel.isMovableByWindowBackground = true
    panel.level = .floating
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    panel.hidesOnDeactivate = false
    panel.isReleasedWhenClosed = false
    panel.becomesKeyOnlyIfNeeded = false
    panel.backgroundColor = NSColor(red: 0.051, green: 0.051, blue: 0.051, alpha: 1.0)
    panel.hasShadow = true
    panel.minSize = NSSize(width: 480, height: 360)

    let viewController = NSViewController()
    viewController.view = rootView
    rootView.frame = NSRect(origin: .zero, size: panelSize)
    rootView.autoresizingMask = [.width, .height]
    panel.contentViewController = viewController

    setupStatusItem()
  }

  private func setupStatusItem() {
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    guard let button = statusItem.button else { return }

    if let image = NSImage(systemSymbolName: "wrench.and.screwdriver", accessibilityDescription: "DevUtility") {
      image.isTemplate = true
      button.image = image
    } else {
      button.title = "DU"
    }

    button.action = #selector(statusBarButtonClicked)
    button.target = self
  }

  private var lastToggleTime: TimeInterval = 0

  @objc func toggle() {
    let now = ProcessInfo.processInfo.systemUptime
    guard now - lastToggleTime > 0.35 else { return }
    lastToggleTime = now

    if panel.isVisible {
      hide()
    } else {
      show()
    }
  }

  @objc func show() {
    guard panel != nil else { return }

    let mouseLocation = NSEvent.mouseLocation
    let screen = NSScreen.screens.first { screen in
      NSMouseInRect(mouseLocation, screen.frame, false)
    } ?? NSScreen.main ?? NSScreen.screens.first!

    let visibleFrame = screen.visibleFrame
    let x = visibleFrame.midX - panel.frame.width / 2
    let y = visibleFrame.midY - panel.frame.height / 2
    panel.setFrameOrigin(NSPoint(x: x, y: y))

    NSApp.activate(ignoringOtherApps: true)
    panel.makeKeyAndOrderFront(nil)

    installClickOutsideMonitor()
  }

  @objc func hide() {
    guard panel != nil else { return }
    panel.orderOut(nil)
    removeClickOutsideMonitor()
  }

  private func installClickOutsideMonitor() {
    removeClickOutsideMonitor()
    clickMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] _ in
      guard let self = self, self.panel.isVisible else { return }
      let mouseLocation = NSEvent.mouseLocation
      if !self.panel.frame.contains(mouseLocation) {
        self.hide()
      }
    }
  }

  private func removeClickOutsideMonitor() {
    if let monitor = clickMonitor {
      NSEvent.removeMonitor(monitor)
      clickMonitor = nil
    }
  }

  @objc private func statusBarButtonClicked() {
    toggle()
  }
}
