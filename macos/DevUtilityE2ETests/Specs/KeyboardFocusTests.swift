import XCTest

final class KeyboardFocusTests: XCTestCase {
  private var app: XCUIApplication!
  private var panel: MainPanel!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
    panel = MainPanel(app: app)
    panel.waitUntilVisible()
  }

  override func tearDown() {
    app.terminate()
  }

  // MARK: - Typing after programmatic focus

  func test_typingRightAfterSwitchingToSnippetsGoesIntoSearch() {
    panel.press("2", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("nginx")
    snippets.waitForSearchText("nginx")
  }

  func test_typingRightAfterCommandFGoesIntoSearch() {
    panel.press("f", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("docker")
    snippets.waitForSearchText("docker")
  }

  func test_typingWorksAgainAfterSnippetsIsRemountedByReopening() {
    panel.press("2", modifiers: .command)
    panel.press("1", modifiers: .command)
    panel.press(.escape)
    panel.waitUntilHidden()
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilVisible()
    panel.press("2", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("again")
    snippets.waitForSearchText("again")
  }

  // MARK: - Panel over another app

  func test_shortcutOpensThePanelWithoutActivatingTheApp() {
    let otherApp = hidePanelThenReopenItFromAnotherApp()
    XCTAssertEqual(otherApp.state, .runningForeground, "opening the panel activated DevUtility")
  }

  func test_iconOpensThePanelWithoutActivatingTheApp() {
    let menuBar = MenuBar(app: app)
    menuBar.clickIcon()
    panel.waitUntilHidden()
    let otherApp = OtherApp.bringToFront()
    menuBar.clickIcon()
    panel.waitUntilVisible()
    XCTAssertEqual(otherApp.state, .runningForeground, "opening the panel activated DevUtility")
  }

  func test_arrowKeysWorkRightAfterTheShortcutOpensThePanelOverAnotherApp() {
    Pasteboard.write("older")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "older")
    Pasteboard.write("newer")
    clipboard.waitForRowText(0, toEqual: "newer")
    let otherApp = hidePanelThenReopenItFromAnotherApp()
    panel.press(.downArrow)
    Wait.until("row 1 is selected") { clipboard.isRowSelected(1) }
    XCTAssertEqual(otherApp.state, .runningForeground, "sending keys activated DevUtility")
  }

  func test_typingWorksRightAfterTheShortcutOpensSnippetsOverAnotherApp() {
    let otherApp = hidePanelThenReopenItFromAnotherApp()
    panel.press("2", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("menu")
    snippets.waitForSearchText("menu")
    XCTAssertEqual(otherApp.state, .runningForeground, "sending keys activated DevUtility")
  }

  // MARK: - Panel key while the app is inactive

  func test_clearAllAlertWorksWhileAnotherAppIsFrontmost() {
    Pasteboard.write("keep me")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "keep me")
    _ = hidePanelThenReopenItFromAnotherApp()
    clipboard.clearAll(confirm: false)
    XCTAssertTrue(clipboard.rowCountStays(1, for: 2), "Cancel cleared the history")
    clipboard.clearAll(confirm: true)
    Wait.until("history is empty") { clipboard.emptyState.exists }
  }

  func test_shortcutRecorderWorksWhileAnotherAppIsFrontmost() {
    _ = hidePanelThenReopenItFromAnotherApp()
    let settings = panel.openSettings()
    settings.recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")
  }

  func test_enterInsideSnippetSearchDoesNotCopyWhileAnotherAppIsFrontmost() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Nginx proxy", description: "", tags: "", content: "proxy_pass")
    _ = hidePanelThenReopenItFromAnotherApp()
    snippets.search(for: "Nginx")
    Pasteboard.clear()
    panel.press(.return)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2), "Enter inside search copied the snippet")
  }

  // MARK: - Helpers

  private func hidePanelThenReopenItFromAnotherApp() -> XCUIApplication {
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilHidden()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilVisible()
    return otherApp
  }
}
