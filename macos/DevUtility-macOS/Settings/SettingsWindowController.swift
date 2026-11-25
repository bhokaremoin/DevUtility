import Cocoa
import KeyboardShortcuts

/// Settings is a non-activating panel, like the tool panels: it takes the keyboard without
/// asking macOS to activate DevUtility, which macOS may decline for a menu-bar app (see
/// PanelPresenter). It sits one level above the tool panels so it always opens in front of them.
private final class SettingsPanel: NSPanel {
  override var canBecomeKey: Bool { true }
}

@objc final class SettingsWindowController: NSObject, NSWindowDelegate {
  @objc static let shared = SettingsWindowController()

  private static let size = NSSize(width: 520, height: 440)

  let window: NSPanel = SettingsPanel(
    contentRect: NSRect(origin: .zero, size: SettingsWindowController.size),
    styleMask: [.titled, .closable, .nonactivatingPanel],
    backing: .buffered,
    defer: false
  )

  /// The tool whose ⌘, opened Settings, while Settings stays open. That tool's panel treats
  /// clicks in Settings as its own, so they don't close it.
  private(set) var openedFromToolId: String?

  private override init() {
    super.init()
    window.title = "DevUtility Settings"
    window.level = NSWindow.Level(rawValue: NSWindow.Level.floating.rawValue + 1)
    window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    window.hidesOnDeactivate = false
    window.isReleasedWhenClosed = false
    window.becomesKeyOnlyIfNeeded = false
    window.setAccessibilityIdentifier("settings.window")
    window.delegate = self
  }

  @objc func setUp(rootView: NSView) {
    let viewController = NSViewController()
    viewController.view = rootView
    rootView.frame = NSRect(origin: .zero, size: Self.size)
    rootView.autoresizingMask = [.width, .height]
    window.contentViewController = viewController
    window.setContentSize(Self.size)
  }

  @objc func show(openedFromToolId toolId: String?) {
    if !window.isVisible {
      let screens = NSScreen.screens.map { ScreenArea(frame: $0.frame, visibleFrame: $0.visibleFrame) }
      let visibleFrame = PanelFrameCalculator.visibleFrame(containing: NSEvent.mouseLocation, screens: screens)
      let frame = PanelFrameCalculator.frame(
        for: .centeredOnMouseScreen, size: window.frame.size, mouse: NSEvent.mouseLocation, visibleFrame: visibleFrame)
      window.setFrameOrigin(frame.origin)
    }
    openedFromToolId = toolId
    window.makeKeyAndOrderFront(nil)
  }

  func windowWillClose(_ notification: Notification) {
    openedFromToolId = nil
  }

  // A registered global shortcut swallows its keys before any window sees them, so a recorder
  // could never record a shortcut another tool already uses. The tools' shortcuts are switched
  // off while Settings has the keyboard and back on when it lets go.
  func windowDidBecomeKey(_ notification: Notification) {
    KeyboardShortcuts.disable(ToolShortcuts.allNames)
  }

  func windowDidResignKey(_ notification: Notification) {
    KeyboardShortcuts.enable(ToolShortcuts.allNames)
  }
}
