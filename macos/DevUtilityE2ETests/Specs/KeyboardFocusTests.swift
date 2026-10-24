import XCTest

// Keys and clicks go through Keyboard and Mouse (HID-level events), as a real keyboard and mouse
// do: XCUITest's own input activates DevUtility first, which hides activation and focus bugs.
final class KeyboardFocusTests: XCTestCase {
  private var app: XCUIApplication!
  private var panel: MainPanel!

  override func setUp() {
    continueAfterFailure = false
    Keyboard.requirePermissionToPostEvents()
    app = AppLauncher.launchFresh()
    panel = MainPanel(app: app)
    panel.waitUntilVisible()
  }

  override func tearDown() {
    app.terminate()
  }

  // MARK: - Typing after programmatic focus

  func test_typingRightAfterSwitchingToSnippetsGoesIntoSearch() {
    Keyboard.press("2", modifiers: .maskCommand)
    let snippets = SnippetsTab(app: app)
    Wait.until("Snippets is shown") { snippets.isShown }
    Keyboard.type("nginx")
    snippets.waitForSearchText("nginx")
  }

  func test_typingRightAfterCommandFGoesIntoSearch() {
    Keyboard.press("f", modifiers: .maskCommand)
    let snippets = SnippetsTab(app: app)
    Wait.until("Snippets is shown") { snippets.isShown }
    Keyboard.type("docker")
    snippets.waitForSearchText("docker")
  }

  func test_typingWorksAgainAfterSnippetsIsRemountedByReopening() {
    Keyboard.press("2", modifiers: .maskCommand)
    Keyboard.press("1", modifiers: .maskCommand)
    Keyboard.press(.escape)
    panel.waitUntilHidden()
    OtherApp.bringToFront()
    pressTheGlobalShortcut()
    panel.waitUntilVisible()
    Keyboard.press("2", modifiers: .maskCommand)
    let snippets = SnippetsTab(app: app)
    Wait.until("Snippets is shown") { snippets.isShown }
    Keyboard.type("again")
    snippets.waitForSearchText("again")
  }

  // MARK: - Panel over another app

  func test_shortcutOpensThePanelWithoutActivatingTheApp() {
    hidePanelThenReopenItFromAnotherApp()
    XCTAssertTrue(OtherApp.isFrontmost, "opening the panel with the shortcut activated DevUtility")
  }

  func test_iconOpensThePanelWithoutActivatingTheApp() {
    let menuBar = MenuBar(app: app)
    Mouse.click(menuBar.icon)
    panel.waitUntilHidden()
    OtherApp.bringToFront()
    Mouse.click(menuBar.icon)
    panel.waitUntilVisible()
    XCTAssertTrue(OtherApp.isFrontmost, "opening the panel with the icon activated DevUtility")
  }

  func test_typingWorksRightAfterTheIconOpensSnippetsOverAnotherApp() {
    let menuBar = MenuBar(app: app)
    Mouse.click(menuBar.icon)
    panel.waitUntilHidden()
    OtherApp.bringToFront()
    Mouse.click(menuBar.icon)
    panel.waitUntilVisible()
    Keyboard.press("2", modifiers: .maskCommand)
    let snippets = SnippetsTab(app: app)
    Wait.until("Snippets is shown") { snippets.isShown }
    Keyboard.type("menu")
    snippets.waitForSearchText("menu")
  }

  func test_arrowKeysWorkRightAfterTheShortcutOpensThePanelOverAnotherApp() {
    Pasteboard.write("older")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "older")
    Pasteboard.write("newer")
    clipboard.waitForRowText(0, toEqual: "newer")
    hidePanelThenReopenItFromAnotherApp()
    Keyboard.press(.downArrow)
    Wait.until("row 1 is selected") { clipboard.isRowSelected(1) }
    XCTAssertTrue(OtherApp.isFrontmost, "sending keys activated DevUtility")
  }

  func test_typingWorksRightAfterTheShortcutOpensSnippetsOverAnotherApp() {
    hidePanelThenReopenItFromAnotherApp()
    Keyboard.press("2", modifiers: .maskCommand)
    let snippets = SnippetsTab(app: app)
    Wait.until("Snippets is shown") { snippets.isShown }
    Keyboard.type("menu")
    snippets.waitForSearchText("menu")
    XCTAssertTrue(OtherApp.isFrontmost, "sending keys activated DevUtility")
  }

  // MARK: - Panel keys while the app is inactive

  func test_clearAllAlertWorksWhileAnotherAppIsFrontmost() {
    Pasteboard.write("keep me")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "keep me")
    hidePanelThenReopenItFromAnotherApp()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Clear All")
    clipboard.clearAll(confirm: false)
    XCTAssertTrue(clipboard.rowCountStays(1, for: 2), "Cancel cleared the history")
    clipboard.clearAll(confirm: true)
    Wait.until("history is empty") { clipboard.emptyState.exists }
  }

  // A mouse-down inside the panel makes the window server activate DevUtility (see the spec's
  // Focus bug section), so the recorder, which needs a click, is checked after it.
  func test_shortcutRecorderWorksAfterTheShortcutOpensThePanelOverAnotherApp() {
    hidePanelThenReopenItFromAnotherApp()
    Keyboard.press(",", modifiers: .maskCommand)
    let settings = SettingsTab(app: app)
    Wait.until("Settings is shown") { settings.isShown }
    XCTAssertTrue(OtherApp.isFrontmost, "opening Settings with ⌘, activated DevUtility")
    Mouse.click(settings.recorder)
    Keyboard.press("k", modifiers: [.maskControl, .maskAlternate])
    Wait.until("the recorder shows ⌃⌥K") { settings.recorderText == "⌃⌥K" }
  }

  func test_returnOutsideSearchCopiesWhileAnotherAppIsFrontmost() {
    Pasteboard.write("older")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "older")
    Pasteboard.write("newer")
    clipboard.waitForRowText(0, toEqual: "newer")
    hidePanelThenReopenItFromAnotherApp()
    Keyboard.press(.downArrow)
    Wait.until("row 1 is selected") { clipboard.isRowSelected(1) }
    Pasteboard.clear()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Return")
    Keyboard.press(.returnKey)
    Wait.until("the pasteboard holds the selected item") { Pasteboard.read() == "older" }
  }

  func test_returnInsideSnippetSearchDoesNotCopyWhileAnotherAppIsFrontmost() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Nginx proxy", description: "", tags: "", content: "proxy_pass")
    hidePanelThenReopenItFromAnotherApp()
    Keyboard.press("f", modifiers: .maskCommand)
    Keyboard.type("nginx")
    snippets.waitForSearchText("nginx")
    Pasteboard.clear()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Return")
    Keyboard.press(.returnKey)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2), "Return inside search copied the snippet")
    XCTAssertEqual(snippets.searchText, "nginx", "Return changed the search")
    XCTAssertEqual(snippets.rowCount, 1, "Return changed the search results")
  }

  // MARK: - Focus after the panel hides

  func test_hidingThePanelAfterAClickInsideItGivesFocusBackToTheOtherApp() {
    hidePanelThenReopenItFromAnotherApp()
    Mouse.click(panel.settingsButton)
    Wait.until("the click activated DevUtility, which this spec is about") { !OtherApp.isFrontmost }
    Keyboard.press(.escape)
    panel.waitUntilHidden()
    Wait.until("Calculator is frontmost again") { OtherApp.isFrontmost }
  }

  // MARK: - Helpers

  private func pressTheGlobalShortcut() {
    Keyboard.press("d", modifiers: [.maskControl, .maskAlternate])
  }

  private func hidePanelThenReopenItFromAnotherApp() {
    OtherApp.bringToFront()
    pressTheGlobalShortcut()
    panel.waitUntilHidden()
    // The panel ignores a second toggle within 350 ms, and HID keys arrive far faster than that.
    XCTAssertTrue(panel.staysHidden(for: 0.5), "the panel reopened by itself")
    pressTheGlobalShortcut()
    panel.waitUntilVisible()
  }
}
