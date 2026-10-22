import XCTest

struct MainPanel {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  var isVisible: Bool { element("header.tab.clipboard").exists }

  func waitUntilVisible(
    timeout: TimeInterval = Wait.defaultTimeout,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    Wait.until("the panel is visible", timeout: timeout, file: file, line: line) { self.isVisible }
  }

  func waitUntilHidden(file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("the panel is hidden", file: file, line: line) { !self.isVisible }
  }

  func staysVisible(for seconds: TimeInterval) -> Bool {
    let hides = XCTNSPredicateExpectation(
      predicate: NSPredicate { _, _ in !self.isVisible },
      object: nil
    )
    hides.isInverted = true
    return XCTWaiter().wait(for: [hides], timeout: seconds) == .completed
  }

  func openClipboard() -> ClipboardTab {
    element("header.tab.clipboard").click()
    return ClipboardTab(app: app)
  }

  func openSnippets() -> SnippetsTab {
    element("header.tab.snippets").click()
    XCTAssertTrue(element("snippets.search").waitForExistence(timeout: Wait.defaultTimeout))
    return SnippetsTab(app: app)
  }

  func openSettings() -> SettingsTab {
    element("header.settings").click()
    XCTAssertTrue(element("settings.shortcut.reset").waitForExistence(timeout: Wait.defaultTimeout))
    return SettingsTab(app: app)
  }

  func openShortcutsHelp() {
    element("header.help").click()
    XCTAssertTrue(shortcutsHelpSheet.waitForExistence(timeout: Wait.defaultTimeout))
  }

  var shortcutsHelpSheet: XCUIElement { element("shortcuts.sheet") }

  func closeShortcutsHelp() {
    element("shortcuts.close").click()
  }

  var shortcutsHelpTitle: XCUIElement { app.staticTexts["Keyboard Shortcuts"] }

  var shortcutsHelpActions: [String] {
    app.descendants(matching: .any)
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

  func press(_ character: String, modifiers: XCUIElement.KeyModifierFlags = []) {
    app.typeKey(character, modifierFlags: modifiers)
  }

  func press(_ key: XCUIKeyboardKey, modifiers: XCUIElement.KeyModifierFlags = []) {
    app.typeKey(key, modifierFlags: modifiers)
  }

  func type(_ text: String) {
    app.typeText(text)
  }
}
