import XCTest

final class LaunchTests: XCTestCase {
  private var app: XCUIApplication!

  override func setUp() {
    continueAfterFailure = false
  }

  override func tearDown() {
    app.terminate()
  }

  func test_firstLaunchAfterTheUpdateOpensSettingsOnceAndLaterLaunchesDoNot() {
    app = AppLauncher.launch(XCUIApplication(), arguments: ["--e2e-reset"])
    SettingsWindow(app: app).waitUntilShown()

    app.terminate()
    app = AppLauncher.launch(app, arguments: [])
    XCTAssertTrue(SettingsWindow(app: app).staysHidden(for: 2), "Settings opened again on a later launch")
  }

  func test_copiesAreCapturedBeforeTheClipboardPanelWasEverOpened() {
    app = AppLauncher.launchFresh()
    let clipboard = ClipboardPanel(app: app)
    Pasteboard.write("copied before opening")
    // Longer than the 2 s clipboard poll, so the copy is captured while the panel has never opened.
    XCTAssertTrue(clipboard.staysHidden(for: 3), "Clipboard opened by itself")
    Pasteboard.clear()
    clipboard.open().waitForRowText(0, toEqual: "copied before opening")
  }
}
