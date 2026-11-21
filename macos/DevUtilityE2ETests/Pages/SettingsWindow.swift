import XCTest

struct SettingsWindow {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  var window: XCUIElement { app.windows["settings.window"] }

  var openWindowCount: Int { app.windows.matching(identifier: "settings.window").count }

  var isShown: Bool { window.exists }

  func waitUntilShown(file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("the Settings window is shown", file: file, line: line) { self.isShown }
  }

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
