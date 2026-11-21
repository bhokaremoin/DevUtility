import XCTest

struct SettingsWindow {
  let app: XCUIApplication

  var window: XCUIElement { app.windows["settings.window"] }

  private func element(_ identifier: String) -> XCUIElement {
    window.descendants(matching: .any)[identifier]
  }

  var openWindowCount: Int { app.windows.matching(identifier: "settings.window").count }

  var isShown: Bool { window.exists }

  func waitUntilShown(file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("the Settings window is shown", file: file, line: line) { self.isShown }
  }

  func currentShortcutText(for toolId: String) -> String {
    element("settings.shortcut.\(toolId).current").displayedText
  }

  func recorder(for toolId: String) -> XCUIElement { element("settings.shortcut.\(toolId)") }

  func recorderText(for toolId: String) -> String { recorder(for: toolId).displayedText }

  func recordShortcut(
    for toolId: String,
    _ key: String,
    modifiers: XCUIElement.KeyModifierFlags,
    shownAs expectedLabel: String,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    let recorder = recorder(for: toolId)
    recorder.click()
    recorder.typeKey(key, modifierFlags: modifiers)
    Wait.until("the \(toolId) recorder shows \(expectedLabel)", file: file, line: line) {
      self.recorderText(for: toolId) == expectedLabel
    }
  }

  func resetShortcut(for toolId: String) { element("settings.shortcut.\(toolId).reset").click() }
}
