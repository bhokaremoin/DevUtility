import XCTest

struct SettingsTab {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  var isShown: Bool { element("settings.shortcut.reset").exists }

  var currentShortcutText: String { element("settings.shortcut.current").displayedText }

  var recorder: XCUIElement { element("settings.shortcut.recorder") }

  var recorderText: String { recorder.displayedText }

  func recordShortcut(
    _ key: String,
    modifiers: XCUIElement.KeyModifierFlags,
    shownAs expectedLabel: String,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    recorder.click()
    recorder.typeKey(key, modifierFlags: modifiers)
    Wait.until("the recorder shows \(expectedLabel)", file: file, line: line) { self.recorderText == expectedLabel }
  }

  func resetShortcut() { element("settings.shortcut.reset").click() }
}
