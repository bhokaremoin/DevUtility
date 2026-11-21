import XCTest

final class KeyboardNavigationTests: XCTestCase {
  private var app: XCUIApplication!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
  }

  override func tearDown() {
    app.terminate()
  }

  private func press(_ key: XCUIKeyboardKey, modifiers: XCUIElement.KeyModifierFlags = []) {
    app.typeKey(key, modifierFlags: modifiers)
  }

  private func press(_ character: String, modifiers: XCUIElement.KeyModifierFlags = []) {
    app.typeKey(character, modifierFlags: modifiers)
  }

  private func clipboardWithThreeItems() -> ClipboardPanel {
    let clipboard = ClipboardPanel(app: app).open()
    for text in ["one", "two", "three"] {
      Pasteboard.write(text)
      clipboard.waitForRowText(0, toEqual: text)
    }
    return clipboard
  }

  func test_arrowKeysMoveTheSelection() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    press(.downArrow)
    Wait.until("row 1 is selected") { clipboard.isRowSelected(1) }
    press(.upArrow)
    Wait.until("row 0 is selected") { clipboard.isRowSelected(0) }
  }

  func test_arrowKeysInSnippetSearchMoveTheListSelection() {
    let snippets = SnippetsPanel(app: app).open()
    for title in ["Third", "Second", "First"] {
      snippets.addSnippet(title: title, description: "", tags: "", content: "\(title) content")
    }
    snippets.selectRow(0)
    snippets.searchField.focus()
    press(.downArrow)
    Wait.until("row 1 is selected") { snippets.isRowSelected(1) }
    press(.upArrow)
    Wait.until("row 0 is selected") { snippets.isRowSelected(0) }
  }

  func test_arrowKeysInsideTheDetailEditorMoveTheCursorNotTheSelection() {
    let clipboard = ClipboardPanel(app: app).open()
    Pasteboard.write("older item")
    clipboard.waitForRowText(0, toEqual: "older item")
    Pasteboard.write("first line\nsecond line")
    Wait.until("the two-line item is at the top") { clipboard.rowCount == 2 }
    clipboard.selectRow(0)
    clipboard.detailEditor.focus()
    press(.upArrow, modifiers: .command)
    press(.downArrow)
    app.typeText("X")
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
    press(.return)
    Wait.until("the pasteboard holds the selected item") { Pasteboard.read() == "two" }
  }

  func test_enterInTheSnippetListCopiesTheSelectedSnippet() {
    let snippets = SnippetsPanel(app: app).open()
    snippets.addSnippet(title: "Older", description: "", tags: "", content: "older content")
    snippets.addSnippet(title: "Newer", description: "", tags: "", content: "newer content")
    snippets.selectRow(1)
    XCTAssertFalse(snippets.isSearchFocused, "the search field kept focus after clicking a row")
    Pasteboard.clear()
    press(.return)
    Wait.until("the pasteboard holds the selected snippet") { Pasteboard.read() == "older content" }
  }

  func test_enterInsideATextInputDoesNotCopy() {
    let snippets = SnippetsPanel(app: app).open()
    snippets.addSnippet(title: "Entry", description: "", tags: "", content: "entry content")
    Pasteboard.clear()
    snippets.searchField.typeAfterFocusing("Entry")
    press(.return)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2))
  }

  func test_commandEnterCopiesStoredTextNotUnsavedDraft() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    clipboard.replaceDetailText(with: "unsaved draft")
    Pasteboard.clear()
    press(.return, modifiers: .command)
    Wait.until("the pasteboard holds the stored text") { Pasteboard.read() == "three" }
  }

  func test_escapeInSnippetsClearsTheSearch() {
    let snippets = SnippetsPanel(app: app).open()
    snippets.addSnippet(title: "Alpha", description: "", tags: "", content: "a")
    snippets.search(for: "zzz")
    Wait.until("the search hides the snippet") { snippets.rowCount == 0 }
    press(.escape)
    Wait.until("the cleared search shows the snippet again") { snippets.rowCount == 1 }
  }

  func test_commandCommaOpensSettings() {
    _ = ClipboardPanel(app: app).open()
    press(",", modifiers: .command)
    SettingsWindow(app: app).waitUntilShown()
  }

  func test_commandFMovesFocusFromTheDetailEditorToSnippetSearch() {
    let snippets = SnippetsPanel(app: app).open()
    snippets.addSnippet(title: "Focus", description: "", tags: "", content: "focus content")
    snippets.selectRow(0)
    snippets.detailEditor.focus()
    XCTAssertFalse(snippets.isSearchFocused, "the search still has focus while editing")
    press("f", modifiers: .command)
    Wait.until("the search has focus") { snippets.isSearchFocused }
  }

  func test_shortcutsHelpListsTheShortcuts() {
    let clipboard = ClipboardPanel(app: app).open()
    clipboard.openShortcutsHelp()
    XCTAssertTrue(clipboard.shortcutsHelpTitle.exists)
    clipboard.closeShortcutsHelp()
    Wait.until("the help sheet is closed") { !clipboard.shortcutsHelpSheet.exists }
  }

  func test_eachHelpSheetListsOnlyItsToolsShortcuts() {
    let clipboard = ClipboardPanel(app: app).open()
    clipboard.openShortcutsHelp()
    XCTAssertEqual(clipboard.shortcutsHelpRows.map(\.action), [
      "Open / close Clipboard", "Move selection", "Copy selected", "Copy stored text", "Stop editing / close", "Open Settings",
    ])
    XCTAssertEqual(clipboard.shortcutsHelpRows.first { $0.action == "Open Settings" }?.keys, "⌘ + ,")
    clipboard.closeShortcutsHelp()

    let snippets = SnippetsPanel(app: app).open()
    snippets.openShortcutsHelp()
    XCTAssertEqual(snippets.shortcutsHelpRows.map(\.action), [
      "Open / close Snippets", "Move selection", "Focus search", "Copy selected", "Copy stored text",
      "Clear search / stop editing", "Open Settings",
    ])
  }

  // MARK: - Esc

  func test_escapeClosesAnOpenHelpSheetFirstInClipboard() {
    let clipboard = ClipboardPanel(app: app).open()
    clipboard.openShortcutsHelp()
    press(.escape)
    Wait.until("the help sheet is closed") { !clipboard.shortcutsHelpSheet.exists }
    XCTAssertTrue(clipboard.staysVisible(for: 1), "Esc closed Clipboard along with its help sheet")
  }

  func test_escapeClosesAnOpenHelpSheetFirstInSnippets() {
    let snippets = SnippetsPanel(app: app).open()
    snippets.search(for: "keep")
    snippets.openShortcutsHelp()
    press(.escape)
    Wait.until("the help sheet is closed") { !snippets.shortcutsHelpSheet.exists }
    XCTAssertEqual(snippets.searchText, "keep", "the first Esc also cleared the search")
  }

  func test_escapeClosesTheAddDialog() {
    let snippets = SnippetsPanel(app: app).open()
    _ = snippets.openAddDialog()
    press(.escape)
    Wait.until("the add dialog is closed") { !snippets.isAddDialogOpen }
    XCTAssertTrue(snippets.isVisible)
  }

  func test_escapeInClipboardStopsEditingThenClosesThePanel() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    clipboard.detailEditor.focus()
    Wait.until("the editor has focus") { clipboard.isDetailEditorFocused }
    press(.escape)
    Wait.until("the editor lost focus") { !clipboard.isDetailEditorFocused }
    XCTAssertTrue(clipboard.staysVisible(for: 1), "the first Esc closed Clipboard while editing")
    press(.escape)
    clipboard.waitUntilHidden()
  }

  func test_escapeNeverClosesSnippets() {
    let snippets = SnippetsPanel(app: app).open()
    for _ in 1...3 {
      press(.escape)
    }
    XCTAssertTrue(snippets.staysVisible(for: 1), "Esc closed Snippets")
  }

  // MARK: - Keys that belong to one tool

  func test_commandFInClipboardDoesNothing() {
    let clipboard = ClipboardPanel(app: app).open()
    press("f", modifiers: .command)
    XCTAssertTrue(SnippetsPanel(app: app).staysHidden(for: 1), "⌘F in Clipboard opened Snippets")
    XCTAssertTrue(clipboard.isVisible)
  }

  func test_snippetsOpensWithItsSearchFocusedEvenAfterEditingElsewhere() {
    let snippets = SnippetsPanel(app: app).open()
    snippets.addSnippet(title: "Focus", description: "", tags: "", content: "focus content")
    snippets.selectRow(0)
    snippets.detailEditor.focus()
    Wait.until("the search lost focus") { !snippets.isSearchFocused }
    snippets.closeButton.click()
    snippets.waitUntilHidden()
    snippets.open()
    Wait.until("the search has focus again") { snippets.isSearchFocused }
  }
}
