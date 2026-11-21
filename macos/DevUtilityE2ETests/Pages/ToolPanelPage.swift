import XCTest

// What every tool panel page has in common. Lookups stay inside the tool's own window, because
// both tools' panels can be open at once and share identifiers such as `shortcuts.sheet`.
protocol ToolPanelPage {
  static var toolId: String { get }
  var app: XCUIApplication { get }
  init(app: XCUIApplication)
}

extension ToolPanelPage {
  // Floating panels are not listed in app.windows, so the window is found by identifier among all elements.
  var window: XCUIElement { app.descendants(matching: .any)["\(Self.toolId).window"] }

  func element(_ identifier: String) -> XCUIElement {
    window.descendants(matching: .any)[identifier]
  }

  // An ordered-out panel leaves the accessibility tree, so a hidden panel's window does not exist.
  var isVisible: Bool { window.exists }

  /// Opens the panel from its menu-bar icon unless it is already open.
  @discardableResult
  func open(file: StaticString = #filePath, line: UInt = #line) -> Self {
    if !isVisible {
      MenuBar(app: app).clickIcon(for: Self.toolId, file: file, line: line)
    }
    waitUntilVisible(file: file, line: line)
    return self
  }

  func waitUntilVisible(timeout: TimeInterval = Wait.defaultTimeout, file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("the \(Self.toolId) panel is visible", timeout: timeout, file: file, line: line) { self.isVisible }
  }

  func waitUntilHidden(file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("the \(Self.toolId) panel is hidden", file: file, line: line) { !self.isVisible }
  }

  func staysVisible(for seconds: TimeInterval) -> Bool {
    let hides = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in !self.isVisible }, object: nil)
    hides.isInverted = true
    return XCTWaiter().wait(for: [hides], timeout: seconds) == .completed
  }

  func staysHidden(for seconds: TimeInterval) -> Bool {
    let shows = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in self.isVisible }, object: nil)
    shows.isInverted = true
    return XCTWaiter().wait(for: [shows], timeout: seconds) == .completed
  }

  func press(_ character: String, modifiers: XCUIElement.KeyModifierFlags = []) {
    app.typeKey(character, modifierFlags: modifiers)
  }

  func press(_ key: XCUIKeyboardKey, modifiers: XCUIElement.KeyModifierFlags = []) {
    app.typeKey(key, modifierFlags: modifiers)
  }

  func type(_ text: String) {
    app.typeText(text)
  }

  func openSettings(file: StaticString = #filePath, line: UInt = #line) -> SettingsWindow {
    press(",", modifiers: .command)
    let settings = SettingsWindow(app: app)
    settings.waitUntilShown(file: file, line: line)
    return settings
  }

  // MARK: - Shortcuts help sheet

  var helpButton: XCUIElement { element("\(Self.toolId).header.help") }

  func openShortcutsHelp() {
    helpButton.click()
    XCTAssertTrue(shortcutsHelpSheet.waitForExistence(timeout: Wait.defaultTimeout))
  }

  var shortcutsHelpSheet: XCUIElement { element("shortcuts.sheet") }

  func closeShortcutsHelp() { element("shortcuts.close").click() }

  var shortcutsHelpTitle: XCUIElement { window.staticTexts["Keyboard Shortcuts"] }

  var shortcutsHelpActions: [String] {
    window.descendants(matching: .any)
      .matching(NSPredicate(format: "identifier BEGINSWITH %@", "shortcuts.action."))
      .allElementsBoundByIndex
      .map(\.displayedText)
  }

  func shortcutsHelpAction(section: Int, row: Int) -> String {
    element("shortcuts.action.\(section).\(row)").displayedText
  }

  func shortcutsHelpKeys(section: Int, row: Int) -> String {
    element("shortcuts.keys.\(section).\(row)").displayedText
  }
}
