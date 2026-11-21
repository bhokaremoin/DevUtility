import Cocoa
import KeyboardShortcuts

/// Owns one tool's panel, menu-bar icon and global shortcut.
final class ToolPanelController: NSObject {
  let tool: ToolDefinition
  let panel: ToolPanel
  private let presenter: PanelPresenter
  private var statusItem: NSStatusItem!
  private var clickOutsideMonitor: Any?
  private var lastToggleTime: TimeInterval = 0

  init(tool: ToolDefinition, rootView: NSView) {
    self.tool = tool
    panel = ToolPanel(tool: tool)
    presenter = PanelPresenter(panel: panel)
    super.init()

    let viewController = NSViewController()
    viewController.view = rootView
    rootView.frame = NSRect(origin: .zero, size: tool.size)
    rootView.autoresizingMask = [.width, .height]
    panel.contentViewController = viewController
    panel.setContentSize(tool.size)

    setUpStatusItem()
    if let shortcutName = ToolShortcuts.name(for: tool.id) {
      KeyboardShortcuts.onKeyDown(for: shortcutName) { [weak self] in self?.toggle() }
    }
  }

  var isVisible: Bool { panel.isVisible }

  /// Open and in front: close. Open but behind another window: bring to front. Closed: open.
  func toggle() {
    // The icon and the shortcut can both fire for one gesture; ignore a second toggle within 350 ms.
    let now = ProcessInfo.processInfo.systemUptime
    guard now - lastToggleTime > 0.35 else { return }
    lastToggleTime = now

    if panel.isVisible && panel.isKeyWindow {
      hide()
    } else {
      show()
    }
  }

  func show() {
    if panel.isVisible {
      panel.makeKeyAndOrderFront(nil)
      return
    }
    // Position and size are not remembered: every opening starts from the tool's rule and default size.
    let screens = NSScreen.screens.map { ScreenArea(frame: $0.frame, visibleFrame: $0.visibleFrame) }
    let mouse = NSEvent.mouseLocation
    let visibleFrame = PanelFrameCalculator.visibleFrame(containing: mouse, screens: screens)
    let frame = PanelFrameCalculator.frame(
      for: tool.openingPosition, size: tool.size, mouse: mouse, visibleFrame: visibleFrame)
    panel.setFrame(frame, display: false)
    presenter.show(at: frame.origin)
    installClickOutsideMonitor()
  }

  func hide() {
    guard panel.isVisible else { return }
    presenter.hide()
    removeClickOutsideMonitor()
  }

  // MARK: - Menu-bar icon

  private func setUpStatusItem() {
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    guard let button = statusItem.button else { return }
    button.setAccessibilityIdentifier("statusItem.\(tool.id)")
    button.image = iconImage()
    button.sendAction(on: [.leftMouseUp, .rightMouseUp])
    button.action = #selector(statusItemClicked)
    button.target = self
  }

  private func iconImage() -> NSImage? {
    let image: NSImage?
    switch tool.icon {
    case .asset(let name):
      image = NSImage(named: name)
    case .systemSymbol(let name):
      image = NSImage(systemSymbolName: name, accessibilityDescription: tool.displayName)
    }
    image?.isTemplate = true
    return image
  }

  @objc private func statusItemClicked() {
    guard let event = NSApp.currentEvent else { return }
    if event.type == .rightMouseUp {
      showContextMenu()
    } else {
      // Let the status bar finish handling its mouse-up before the panel takes the keyboard.
      DispatchQueue.main.async { [weak self] in self?.toggle() }
    }
  }

  private func showContextMenu() {
    let menu = NSMenu()
    menu.addItem(menuItem("Open \(tool.displayName)", identifier: "statusMenu.open", action: #selector(openFromMenu)))
    menu.addItem(menuItem("Settings…", identifier: "statusMenu.settings", action: #selector(openSettings), key: ","))
    menu.addItem(NSMenuItem.separator())
    menu.addItem(menuItem("Quit DevUtility", identifier: "statusMenu.quit", action: #selector(quit), key: "q"))
    statusItem.menu = menu
    statusItem.button?.performClick(nil)
    statusItem.menu = nil
  }

  private func menuItem(_ title: String, identifier: String, action: Selector, key: String = "") -> NSMenuItem {
    let item = NSMenuItem(title: title, action: action, keyEquivalent: key)
    item.identifier = NSUserInterfaceItemIdentifier(identifier)
    item.target = self
    return item
  }

  @objc private func openFromMenu() { show() }

  @objc private func openSettings() { SettingsWindowController.shared.show(openedFromToolId: nil) }

  @objc private func quit() { NSApp.terminate(nil) }

  // MARK: - Closing on outside clicks

  private func installClickOutsideMonitor() {
    removeClickOutsideMonitor()
    clickOutsideMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] _ in
      guard let self, self.panel.isVisible, !self.panel.frame.contains(NSEvent.mouseLocation) else { return }
      self.hide()
    }
  }

  private func removeClickOutsideMonitor() {
    guard let monitor = clickOutsideMonitor else { return }
    NSEvent.removeMonitor(monitor)
    clickOutsideMonitor = nil
  }
}
