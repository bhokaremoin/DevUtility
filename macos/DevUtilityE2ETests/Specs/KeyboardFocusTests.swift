import XCTest

// Keys go through Keyboard (HID-level events) so they follow the system's keyboard routing, as a
// real keypress does, and land within milliseconds of each other. See Support/Keyboard.swift.
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
    menuBar.clickIcon()
    panel.waitUntilHidden()
    OtherApp.bringToFront()
    menuBar.clickIcon()
    panel.waitUntilVisible()
    XCTAssertTrue(OtherApp.isFrontmost, "opening the panel with the icon activated DevUtility")
  }

  func test_typingWorksRightAfterTheIconOpensSnippetsOverAnotherApp() {
    let menuBar = MenuBar(app: app)
    menuBar.clickIcon()
    panel.waitUntilHidden()
    OtherApp.bringToFront()
    menuBar.clickIcon()
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

  func test_shortcutRecorderWorksWhileAnotherAppIsFrontmost() {
    hidePanelThenReopenItFromAnotherApp()
    let settings = panel.openSettings()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before recording")
    settings.recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")
  }

  func test_returnOutsideSearchCopiesWhileAnotherAppIsFrontmost() {
    Pasteboard.write("older")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "older")
    Pasteboard.write("newer")
    clipboard.waitForRowText(0, toEqual: "newer")
    hidePanelThenReopenItFromAnotherApp()
    Pasteboard.clear()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Return")
    Keyboard.press(.returnKey)
    Wait.until("the pasteboard holds the selected item") { Pasteboard.read() == "newer" }
  }

  func test_returnInsideSnippetSearchDoesNotCopyWhileAnotherAppIsFrontmost() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Nginx proxy", description: "", tags: "", content: "proxy_pass")
    hidePanelThenReopenItFromAnotherApp()
    snippets.search(for: "Nginx")
    Pasteboard.clear()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Return")
    Keyboard.press(.returnKey)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2), "Return inside search copied the snippet")
    XCTAssertEqual(snippets.searchText, "Nginx", "Return changed the search")
    XCTAssertEqual(snippets.rowCount, 1, "Return changed the search results")
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
