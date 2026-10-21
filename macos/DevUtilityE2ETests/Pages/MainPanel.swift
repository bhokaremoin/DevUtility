import XCTest

struct MainPanel {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  var isVisible: Bool { element("header.tab.clipboard").exists }

  func waitUntilVisible(file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("the panel is visible", file: file, line: line) { self.isVisible }
  }

  func waitUntilHidden(file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("the panel is hidden", file: file, line: line) { !self.isVisible }
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

  func press(_ key: XCUIKeyboardKey, modifiers: XCUIElement.KeyModifierFlags = []) {
    app.typeKey(key, modifierFlags: modifiers)
  }

  func type(_ text: String) {
    app.typeText(text)
  }
}
