// PanelManager.swift
// DevUtility
//
// Description: Singleton that owns and controls the floating NSPanel window.
// Architecture Role: Central coordinator for all panel interactions. Receives
//   show/hide calls from GlobalShortcutModule and AppDelegate, manages
//   positioning relative to the active screen, drives the status bar icon,
//   and installs/removes the global click-outside monitor.

import Cocoa

// MARK: - UtilityPanel

/// A custom NSPanel subclass that accepts key and main window status,
/// enabling it to receive keyboard events while the app is in panel mode.
///
/// Escape key handling is intentionally suppressed here and delegated
/// to `KeyEventModule` so the JS layer can implement cascading dismiss logic.
class UtilityPanel: NSPanel {
  override var canBecomeKey: Bool { true }
  override var canBecomeMain: Bool { true }

  override func keyDown(with event: NSEvent) {
    super.keyDown(with: event)
  }

  override func cancelOperation(_ sender: Any?) {
    // Esc is handled by KeyEventModule for cascading behavior
  }
}

// MARK: - PanelManager

/// Singleton manager for DevUtility's floating `NSPanel` window.
///
/// Responsibilities:
/// - One-time panel setup from the React Native root view (`setup(with:)`)
/// - Toggle, show, and hide the panel with proper macOS activation
/// - Center the panel on whichever screen the cursor is on
/// - Install a global mouse monitor to dismiss on outside clicks
/// - Manage the status bar icon and its left/right-click context menu
@objc class PanelManager: NSObject {

  // MARK: - Properties

  /// The shared singleton instance.
  @objc static let shared = PanelManager()

  /// The floating panel window that hosts the React Native root view.
  private var panel: UtilityPanel!
  /// The macOS menu-bar status item (icon + button).
  private var statusItem: NSStatusItem!
  /// Global mouse-down event monitor used to dismiss the panel on outside clicks.
  private var clickMonitor: Any?
  /// Default panel dimensions. Can be overridden by dragging the panel.
  private var panelSize = NSSize(width: 800, height: 600)

  // MARK: - Initialization

  private override init() {
    super.init()
  }

  // MARK: - Public Interface

  /// Configures the panel using the provided React Native root view.
  /// Called once by `AppDelegate` after the RN bridge has bootstrapped.
  ///
  /// - Parameter rootView: The `NSView` created by `RCTAppDelegate` containing the RN hierarchy.
  @objc func setup(with rootView: NSView) {
    panel = UtilityPanel(
      contentRect: NSRect(origin: .zero, size: panelSize),
      styleMask: [.titled, .fullSizeContentView],
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

  // MARK: - Status Bar

  /// Creates the menu-bar status item and configures its icon and click target.
  private func setupStatusItem() {
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    guard let button = statusItem.button else { return }

    if let image = NSImage(named: "MenuBarIcon") {
      image.isTemplate = true
      button.image = image
    } else {
      button.title = "</>"
    }

    button.sendAction(on: [.leftMouseUp, .rightMouseUp])
    button.action = #selector(statusBarButtonClicked)
    button.target = self
  }

  // MARK: - Panel Lifecycle

  /// Timestamp of the last toggle, used to debounce rapid double-calls.
  private var lastToggleTime: TimeInterval = 0

  /// Toggles the panel between visible and hidden, debounced to 350 ms.
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

  /// Centers the panel on the screen containing the cursor and makes it key.
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

    if #available(macOS 14.0, *) {
      NSRunningApplication.current.activate(options: [])
    } else {
      NSRunningApplication.current.activate(options: .activateIgnoringOtherApps)
    }
    panel.makeKeyAndOrderFront(nil)

    installClickOutsideMonitor()
  }

  /// Hides the panel and removes the global click monitor.
  @objc func hide() {
    guard panel != nil else { return }
    panel.orderOut(nil)
    removeClickOutsideMonitor()
  }

  // MARK: - Private Helpers

  /// Installs a global NSEvent monitor that hides the panel when the user
  /// clicks outside its frame. Any existing monitor is replaced first.
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

  /// Removes and nullifies the global click monitor, if one is installed.
  private func removeClickOutsideMonitor() {
    if let monitor = clickMonitor {
      NSEvent.removeMonitor(monitor)
      clickMonitor = nil
    }
  }

  /// Routes status-bar button clicks: right-click shows a context menu,
  /// left-click toggles the panel (deferred to next run loop).
  @objc private func statusBarButtonClicked() {
    guard let event = NSApp.currentEvent else { return }
    if event.type == .rightMouseUp {
      showContextMenu()
    } else {
      // Defer to next run loop so the status bar mouse-up event is fully
      // processed before we take focus.
      DispatchQueue.main.async { [weak self] in
        self?.toggle()
      }
    }
  }

  /// Builds and shows a transient right-click context menu with Open and Quit items.
  private func showContextMenu() {
    let menu = NSMenu()
    menu.addItem(NSMenuItem(title: "Open DevUtility", action: #selector(show), keyEquivalent: ""))
    menu.addItem(NSMenuItem.separator())
    menu.addItem(NSMenuItem(title: "Quit DevUtility", action: #selector(quitApp), keyEquivalent: "q"))
    for item in menu.items { item.target = self }
    statusItem.menu = menu
    statusItem.button?.performClick(nil)
    statusItem.menu = nil
  }

  /// Terminates the application.
  @objc private func quitApp() {
    NSApplication.shared.terminate(nil)
  }
}
