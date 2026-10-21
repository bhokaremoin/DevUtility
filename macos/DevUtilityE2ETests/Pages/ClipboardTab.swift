import XCTest

struct ClipboardTab {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  var emptyState: XCUIElement { element("clipboard.emptyState") }

  var rowCount: Int {
    app.descendants(matching: .any)
      .matching(NSPredicate(format: "identifier MATCHES %@", "clipboard\\.row\\.[0-9]+"))
      .count
  }

  func row(_ index: Int) -> XCUIElement { element("clipboard.row.\(index)") }

  func rowText(_ index: Int) -> String { element("clipboard.row.\(index).text").displayedText }

  func waitForRowText(_ index: Int, toEqual expected: String, file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("row \(index) shows \"\(expected.prefix(40))\"", file: file, line: line) {
      self.element("clipboard.row.\(index).text").exists && self.rowText(index) == expected
    }
  }

  func selectRow(_ index: Int) { row(index).click() }

  func isRowSelected(_ index: Int) -> Bool { row(index).isSelected }

  func clickCopy(onRow index: Int) { element("clipboard.row.\(index).copy").click() }

  func copyButtonLabel(onRow index: Int) -> String { element("clipboard.row.\(index).copy").label }

  var detailEditor: XCUIElement { element("clipboard.detail.editor") }

  func replaceDetailText(with text: String) {
    detailEditor.focus()
    detailEditor.typeKey("a", modifierFlags: .command)
    detailEditor.typeText(text)
  }

  func clickDetailCopy() { element("clipboard.detail.copy").click() }

  var detailCopyButtonLabel: String { element("clipboard.detail.copy").label }

  var saveButton: XCUIElement { element("clipboard.detail.save") }

  func clickDetailSave() { saveButton.click() }

  func clearAll(confirm: Bool) {
    element("header.clearAll").click()
    let buttonTitle = confirm ? "Clear All" : "Cancel"
    let button = app.buttons[buttonTitle].firstMatch
    XCTAssertTrue(button.waitForExistence(timeout: Wait.defaultTimeout), "\(buttonTitle) button in confirmation missing")
    button.click()
  }

  func scrollToBottom() {
    row(0).scroll(byDeltaX: 0, deltaY: -2000)
  }
}
