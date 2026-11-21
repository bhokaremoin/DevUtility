import XCTest

// Keys and clicks go through Keyboard and Mouse (HID-level events), as a real keyboard and mouse
// do: XCUITest's own input activates DevUtility first, which hides activation and focus bugs.
final class KeyboardFocusTests: XCTestCase {
  private var app: XCUIApplication!
  private var clipboard: ClipboardPanel!
  private var snippets: SnippetsPanel!

  override func setUp() {
    continueAfterFailure = false
    Keyboard.requirePermissionToPostEvents()
    app = AppLauncher.launchFresh()
    clipboard = ClipboardPanel(app: app)
    snippets = SnippetsPanel(app: app)
  }

  override func tearDown() {
    app.terminate()
  }

  // MARK: - Typing right after a panel opens

  func test_typingRightAfterTheShortcutOpensSnippetsGoesIntoSearch() {
    openFromAnotherApp(snippets)
    Keyboard.type("nginx")
    snippets.waitForSearchText("nginx")
  }

  func test_typingRightAfterCommandFGoesIntoSearch() {
    openFromAnotherApp(snippets)
    Keyboard.press("f", modifiers: .maskCommand)
    // ⌘F focuses search through a JS round trip; keys posted in the same instant reach the panel first.
    Wait.until("search is focused") { self.snippets.isSearchFocused }
    Keyboard.type("docker")
    snippets.waitForSearchText("docker")
  }

  func test_typingWorksAgainAfterSnippetsIsClosedAndReopened() {
    openFromAnotherApp(snippets)
    pressShortcut(of: SnippetsPanel.self)
    snippets.waitUntilHidden()
    reopenFromAnotherApp(snippets)
    Keyboard.type("again")
    snippets.waitForSearchText("again")
  }

  // MARK: - Panels over another app

  func test_shortcutOpensClipboardWithoutActivatingTheApp() {
    openFromAnotherApp(clipboard)
    XCTAssertTrue(OtherApp.staysFrontmost(for: 1), "opening Clipboard with the shortcut activated DevUtility")
  }

  func test_iconOpensClipboardWithoutActivatingTheApp() {
    OtherApp.bringToFront()
    Mouse.click(MenuBar(app: app).icon(for: ClipboardPanel.toolId))
    clipboard.waitUntilVisible()
    XCTAssertTrue(OtherApp.staysFrontmost(for: 1), "opening Clipboard with the icon activated DevUtility")
  }

  func test_typingWorksRightAfterTheIconOpensSnippetsOverAnotherApp() {
    OtherApp.bringToFront()
    Mouse.click(MenuBar(app: app).icon(for: SnippetsPanel.toolId))
    snippets.waitUntilVisible()
    Keyboard.type("menu")
    snippets.waitForSearchText("menu")
  }

  func test_arrowKeysWorkRightAfterTheShortcutOpensClipboardOverAnotherApp() {
    Pasteboard.write("older")
    clipboard.open().waitForRowText(0, toEqual: "older")
    Pasteboard.write("newer")
    clipboard.waitForRowText(0, toEqual: "newer")
    reopenFromAnotherApp(clipboard)
    Keyboard.press(.downArrow)
    Wait.until("row 1 is selected") { self.clipboard.isRowSelected(1) }
    XCTAssertTrue(OtherApp.staysFrontmost(for: 1), "sending keys activated DevUtility")
  }

  func test_typingWorksRightAfterTheShortcutOpensSnippetsOverAnotherApp() {
    openFromAnotherApp(snippets)
    Keyboard.type("menu")
    snippets.waitForSearchText("menu")
    XCTAssertTrue(OtherApp.staysFrontmost(for: 1), "sending keys activated DevUtility")
  }

  // MARK: - Panel keys while the app is inactive

  func test_clearAllAlertWorksWhileAnotherAppIsFrontmost() {
    Pasteboard.write("keep me")
    clipboard.open().waitForRowText(0, toEqual: "keep me")
    reopenFromAnotherApp(clipboard)
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Clear All")
    clipboard.clearAll(confirm: false)
    XCTAssertTrue(clipboard.rowCountStays(1, for: 2), "Cancel cleared the history")
    clipboard.clearAll(confirm: true)
    Wait.until("history is empty") { self.clipboard.emptyState.exists }
  }

  // A mouse-down inside a panel makes the window server activate DevUtility (see the spec's
  // Focus bug section), so the recorder, which needs a click, is checked after it.
  func test_shortcutRecorderWorksAfterTheShortcutOpensClipboardOverAnotherApp() {
    openFromAnotherApp(clipboard)
    Keyboard.press(",", modifiers: .maskCommand)
    let settings = SettingsWindow(app: app)
    settings.waitUntilShown()
    XCTAssertTrue(OtherApp.isFrontmost, "opening Settings with ⌘, activated DevUtility")
    Mouse.click(settings.recorder(for: ClipboardPanel.toolId))
    Keyboard.press("k", modifiers: [.maskControl, .maskAlternate])
    Wait.until("the recorder shows ⌃⌥K") { settings.recorderText(for: ClipboardPanel.toolId) == "⌃⌥K" }
  }

  func test_returnOutsideSearchCopiesWhileAnotherAppIsFrontmost() {
    Pasteboard.write("older")
    clipboard.open().waitForRowText(0, toEqual: "older")
    Pasteboard.write("newer")
    clipboard.waitForRowText(0, toEqual: "newer")
    reopenFromAnotherApp(clipboard)
    Keyboard.press(.downArrow)
    Wait.until("row 1 is selected") { self.clipboard.isRowSelected(1) }
    Pasteboard.clear()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Return")
    Keyboard.press(.returnKey)
    Wait.until("the pasteboard holds the selected item") { Pasteboard.read() == "older" }
  }

  func test_returnInsideSnippetSearchDoesNotCopyWhileAnotherAppIsFrontmost() {
    snippets.open().addSnippet(title: "Nginx proxy", description: "", tags: "", content: "proxy_pass")
    reopenFromAnotherApp(snippets)
    Keyboard.press("f", modifiers: .maskCommand)
    // ⌘F focuses search through a JS round trip; keys posted in the same instant reach the panel first.
    Wait.until("search is focused") { self.snippets.isSearchFocused }
    Keyboard.type("nginx")
    snippets.waitForSearchText("nginx")
    Pasteboard.clear()
    XCTAssertTrue(OtherApp.isFrontmost, "DevUtility was active before Return")
    Keyboard.press(.returnKey)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2), "Return inside search copied the snippet")
    XCTAssertEqual(snippets.searchText, "nginx", "Return changed the search")
    XCTAssertEqual(snippets.rowCount, 1, "Return changed the search results")
  }

  // MARK: - Focus after a panel hides

  func test_hidingClipboardAfterAClickInsideItGivesFocusBackToTheOtherApp() {
    openFromAnotherApp(clipboard)
    Mouse.click(clipboard.emptyState)
    Wait.until("the click activated DevUtility, which this spec is about") { !OtherApp.isFrontmost }
    Keyboard.press(.escape)
    clipboard.waitUntilHidden()
    Wait.until("Calculator is frontmost again") { OtherApp.isFrontmost }
  }

  // MARK: - Helpers

  private func pressShortcut<Page: ToolPanelPage>(of page: Page.Type) {
    let key: Character = page.toolId == ClipboardPanel.toolId ? "v" : "s"
    Keyboard.press(key, modifiers: [.maskControl, .maskAlternate])
  }

  private func openFromAnotherApp<Page: ToolPanelPage>(_ page: Page) {
    OtherApp.bringToFront()
    pressShortcut(of: Page.self)
    page.waitUntilVisible()
  }

  /// Closes the panel with its shortcut while it is key, then opens it again with the shortcut
  /// while another app is frontmost.
  private func reopenFromAnotherApp<Page: ToolPanelPage>(_ page: Page) {
    pressShortcut(of: Page.self)
    page.waitUntilHidden()
    // A panel ignores a second toggle within 350 ms, and HID keys arrive far faster than that.
    XCTAssertTrue(page.staysHidden(for: 0.5), "the panel reopened by itself")
    openFromAnotherApp(page)
  }
}
