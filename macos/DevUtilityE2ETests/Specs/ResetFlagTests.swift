import XCTest

final class ResetFlagTests: XCTestCase {
  func test_resetFlagStartsWithEmptyClipboardHistory() {
    var app = AppLauncher.launchFresh()
    Pasteboard.write("left over from a previous test")
    MainPanel(app: app).openClipboard().waitForRowText(0, toEqual: "left over from a previous test")

    app.terminate()
    app = AppLauncher.launchFresh()
    defer { app.terminate() }

    let clipboard = MainPanel(app: app).openClipboard()
    Pasteboard.write("copied after the reset")
    clipboard.waitForRowText(0, toEqual: "copied after the reset")
    XCTAssertEqual(clipboard.rowCount, 1, "old history appeared after the reset launch")
  }

  func test_resetFlagRestoresTheDefaultShortcut() {
    var app = AppLauncher.launchFresh()
    MainPanel(app: app).openSettings().recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")

    app.terminate()
    app = AppLauncher.launchFresh()
    defer { app.terminate() }

    let settings = MainPanel(app: app).openSettings()
    // The "Current:" label shows ⌃⌥D until the stored shortcut loads, so only the recorder proves the reset.
    Wait.until("the recorder shows the default shortcut") { settings.recorderText == "⌃⌥D" }
  }
}
