import Cocoa

/// Closes a tool's panel when a click lands where its ClosingRule says it should close.
///
/// A global monitor only sees clicks delivered to other apps, so a local monitor covers clicks in
/// DevUtility's own windows: the other tool's panel, Settings, alerts and the menu-bar icons.
final class PanelDismissal {
  private let tool: ToolDefinition
  private let panel: ToolPanel
  private let ownStatusItemWindow: () -> NSWindow?
  private let closePanel: () -> Void
  private var monitors: [Any] = []

  init(tool: ToolDefinition, panel: ToolPanel, ownStatusItemWindow: @escaping () -> NSWindow?, closePanel: @escaping () -> Void) {
    self.tool = tool
    self.panel = panel
    self.ownStatusItemWindow = ownStatusItemWindow
    self.closePanel = closePanel
  }

  func start() {
    stop()
    guard tool.closingRule == .closesOnOutsideClick else { return }

    let clicks: NSEvent.EventTypeMask = [.leftMouseDown, .rightMouseDown]
    if let monitor = NSEvent.addGlobalMonitorForEvents(matching: clicks, handler: { [weak self] _ in
      self?.handleClick(at: .otherApp)
    }) {
      monitors.append(monitor)
    }
    if let monitor = NSEvent.addLocalMonitorForEvents(matching: clicks, handler: { [weak self] event in
      if let self {
        self.handleClick(at: self.location(of: event.window))
      }
      return event
    }) {
      monitors.append(monitor)
    }
  }

  func stop() {
    monitors.forEach(NSEvent.removeMonitor)
    monitors.removeAll()
  }

  private func handleClick(at location: ClickLocation) {
    guard panel.isVisible, OutsideClickRule.shouldClose(tool.closingRule, after: location) else { return }
    closePanel()
  }

  private func location(of window: NSWindow?) -> ClickLocation {
    guard let window else { return .otherDevUtilityWindow }
    if window === panel {
      return .ownPanel
    }
    if window.sheetParent === panel || window === NSApp.modalWindow {
      return .ownSheetOrAlert
    }
    let settings = SettingsWindowController.shared
    if window === settings.window && settings.openedFromToolId == tool.id {
      return .settingsOpenedFromThisPanel
    }
    if window === ownStatusItemWindow() {
      return .ownStatusItem
    }
    return .otherDevUtilityWindow
  }
}
