enum ClickLocation {
  case ownPanel
  /// The tool's own menu-bar icon, which toggles the panel itself.
  case ownStatusItem
  /// An alert or sheet the panel opened, such as "Clear all?".
  case ownSheetOrAlert
  /// The Settings window, while it is open because this panel's ⌘, opened it.
  case settingsOpenedFromThisPanel
  case otherDevUtilityWindow
  /// Another app or the desktop.
  case otherApp
}

enum OutsideClickRule {
  static func shouldClose(_ rule: ClosingRule, after click: ClickLocation) -> Bool {
    guard rule == .closesOnOutsideClick else { return false }

    switch click {
    case .otherApp, .otherDevUtilityWindow:
      return true
    case .ownPanel, .ownStatusItem, .ownSheetOrAlert, .settingsOpenedFromThisPanel:
      return false
    }
  }
}
