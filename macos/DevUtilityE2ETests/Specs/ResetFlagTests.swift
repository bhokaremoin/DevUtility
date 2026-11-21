import XCTest

final class ResetFlagTests: XCTestCase {
  func test_resetFlagStartsWithEmptyClipboardHistory() {
    var app = AppLauncher.launchFresh()
    Pasteboard.write("left over from a previous test")
    ClipboardPanel(app: app).open().waitForRowText(0, toEqual: "left over from a previous test")

    app.terminate()
    app = AppLauncher.launchFresh()
    defer { app.terminate() }

    let clipboard = ClipboardPanel(app: app).open()
    Pasteboard.write("copied after the reset")
    clipboard.waitForRowText(0, toEqual: "copied after the reset")
    XCTAssertEqual(clipboard.rowCount, 1, "old history appeared after the reset launch")
  }

  func test_resetFlagRestoresEveryToolsDefaultShortcut() {
    var app = AppLauncher.launchFresh()
    let settings = ClipboardPanel(app: app).open().openSettings()
    settings.recordShortcut(for: "clipboard", "k", modifiers: [.control, .option], shownAs: "⌃⌥K")
    settings.recordShortcut(for: "snippets", "j", modifiers: [.control, .option], shownAs: "⌃⌥J")

    app.terminate()
    app = AppLauncher.launchFresh()
    defer { app.terminate() }

    let relaunchedSettings = ClipboardPanel(app: app).open().openSettings()
    // The "Current:" labels show the defaults until the stored shortcuts load, so only the recorders prove the reset.
    Wait.until("the Clipboard recorder shows its default") { relaunchedSettings.recorderText(for: "clipboard") == "⌃⌥V" }
    Wait.until("the Snippets recorder shows its default") { relaunchedSettings.recorderText(for: "snippets") == "⌃⌥S" }
  }
}
