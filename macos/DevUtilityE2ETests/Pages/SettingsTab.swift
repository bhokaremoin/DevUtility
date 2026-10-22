import XCTest

struct SettingsTab {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  var currentShortcutText: String { element("settings.shortcut.current").displayedText }

  var recorderText: String { element("settings.shortcut.recorder").displayedText }

  func recordShortcut(_ key: String, modifiers: XCUIElement.KeyModifierFlags) {
    let recorder = element("settings.shortcut.recorder")
    recorder.click()
    recorder.typeKey(key, modifierFlags: modifiers)
  }

  func resetShortcut() { element("settings.shortcut.reset").click() }
}
