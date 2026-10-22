import XCTest

final class KeyboardNavigationTests: XCTestCase {
  private var app: XCUIApplication!
  private var panel: MainPanel!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
    panel = MainPanel(app: app)
  }

  override func tearDown() {
    app.terminate()
  }

  private func clipboardWithThreeItems() -> ClipboardTab {
    let clipboard = panel.openClipboard()
    for text in ["one", "two", "three"] {
      Pasteboard.write(text)
      clipboard.waitForRowText(0, toEqual: text)
    }
    return clipboard
  }

  func test_arrowKeysMoveTheSelection() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    panel.press(.downArrow)
    Wait.until("row 1 is selected") { clipboard.isRowSelected(1) }
    panel.press(.upArrow)
    Wait.until("row 0 is selected") { clipboard.isRowSelected(0) }
  }

  func test_arrowKeysInSnippetSearchMoveTheListSelection() {
    let snippets = panel.openSnippets()
    for title in ["Third", "Second", "First"] {
      snippets.addSnippet(title: title, description: "", tags: "", content: "\(title) content")
    }
    snippets.selectRow(0)
    snippets.searchField.focus()
    panel.press(.downArrow)
    Wait.until("row 1 is selected") { snippets.isRowSelected(1) }
    panel.press(.upArrow)
    Wait.until("row 0 is selected") { snippets.isRowSelected(0) }
  }

  func test_arrowKeysInsideTheDetailEditorMoveTheCursorNotTheSelection() {
    let clipboard = panel.openClipboard()
    Pasteboard.write("older item")
    clipboard.waitForRowText(0, toEqual: "older item")
    Pasteboard.write("first line\nsecond line")
    Wait.until("the two-line item is at the top") { clipboard.rowCount == 2 }
    clipboard.selectRow(0)
    clipboard.detailEditor.focus()
    panel.press(.upArrow, modifiers: .command)
    panel.press(.downArrow)
    panel.type("X")
    Wait.until("the marker lands at the start of line 2") {
      clipboard.detailEditor.displayedText == "first line\nXsecond line"
    }
    XCTAssertTrue(clipboard.rowStaysSelected(0, for: 2))
  }

  func test_enterCopiesTheSelectedItem() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(1)
    Pasteboard.clear()
    // .return is the main Return key (keyCode 36); .enter is the keypad key, which the app does not handle.
    panel.press(.return)
    Wait.until("the pasteboard holds the selected item") { Pasteboard.read() == "two" }
  }

  func test_enterInTheSnippetListCopiesTheSelectedSnippet() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Older", description: "", tags: "", content: "older content")
    snippets.addSnippet(title: "Newer", description: "", tags: "", content: "newer content")
    snippets.selectRow(1)
    XCTAssertFalse(snippets.isSearchFocused, "the search field kept focus after clicking a row")
    Pasteboard.clear()
    panel.press(.return)
    Wait.until("the pasteboard holds the selected snippet") { Pasteboard.read() == "older content" }
  }

  func test_enterInsideATextInputDoesNotCopy() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Entry", description: "", tags: "", content: "entry content")
    Pasteboard.clear()
    snippets.searchField.typeAfterFocusing("Entry")
    panel.press(.return)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2))
  }

  func test_commandEnterCopiesStoredTextNotUnsavedDraft() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    clipboard.replaceDetailText(with: "unsaved draft")
    Pasteboard.clear()
    panel.press(.return, modifiers: .command)
    Wait.until("the pasteboard holds the stored text") { Pasteboard.read() == "three" }
  }

  func test_escapeInSnippetsClearsTheSearch() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Alpha", description: "", tags: "", content: "a")
    snippets.search(for: "zzz")
    Wait.until("the search hides the snippet") { snippets.rowCount == 0 }
    panel.press(.escape)
    Wait.until("the cleared search shows the snippet again") { snippets.rowCount == 1 }
  }

  func test_commandOneAndTwoSwitchBetweenClipboardAndSnippets() {
    let clipboard = panel.openClipboard()
    panel.press("2", modifiers: .command)
    Wait.until("the Snippets tab is shown") { SnippetsTab(app: self.app).isShown }
    panel.press("1", modifiers: .command)
    Wait.until("the Clipboard tab is shown") { clipboard.emptyState.exists }
  }

  func test_commandThreeOpensSettings() {
    _ = panel.openClipboard()
    panel.press("3", modifiers: .command)
    Wait.until("the Settings tab is shown") { SettingsTab(app: self.app).isShown }
  }

  func test_commandFFocusesSnippetSearchFromAnotherTab() {
    _ = panel.openClipboard()
    panel.press("f", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("the search has focus") { snippets.isSearchFocused }
  }

  func test_commandFMovesFocusFromTheDetailEditorToSnippetSearch() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Focus", description: "", tags: "", content: "focus content")
    snippets.selectRow(0)
    snippets.detailEditor.focus()
    XCTAssertFalse(snippets.isSearchFocused, "the search still has focus while editing")
    panel.press("f", modifiers: .command)
    Wait.until("the search has focus") { snippets.isSearchFocused }
  }

  func test_shortcutsHelpListsTheShortcuts() {
    panel.openShortcutsHelp()
    XCTAssertTrue(panel.shortcutsHelpTitle.exists)
    let actions = panel.shortcutsHelpActions
    XCTAssertTrue(actions.contains("Switch to Snippets tab"), "help actions: \(actions)")
    XCTAssertTrue(actions.contains("Copy selected item (list focused)"), "help actions: \(actions)")
    panel.closeShortcutsHelp()
    Wait.until("the help sheet is closed") { !self.panel.shortcutsHelpSheet.exists }
  }
}
