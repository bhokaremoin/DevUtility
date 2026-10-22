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

  func rowCountStays(_ count: Int, for seconds: TimeInterval) -> Bool {
    let predicate = NSPredicate { _, _ in self.rowCount != count }
    let rowCountChanged = XCTNSPredicateExpectation(predicate: predicate, object: nil)
    rowCountChanged.isInverted = true
    return XCTWaiter().wait(for: [rowCountChanged], timeout: seconds) == .completed
  }

  func row(_ index: Int) -> XCUIElement { element("clipboard.row.\(index)") }

  func isRowVisible(_ index: Int) -> Bool { row(index).isHittable }

  func rowText(_ index: Int) -> String { element("clipboard.row.\(index).text").displayedText }

  func waitForRowText(_ index: Int, toEqual expected: String, file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("row \(index) shows \"\(expected.prefix(40))\"", file: file, line: line) {
      self.element("clipboard.row.\(index).text").exists && self.rowText(index) == expected
    }
  }

  func selectRow(_ index: Int) { row(index).click() }

  func isRowSelected(_ index: Int) -> Bool { row(index).isSelected }

  func rowStaysSelected(_ index: Int, for seconds: TimeInterval) -> Bool {
    let predicate = NSPredicate { _, _ in !self.isRowSelected(index) }
    let selectionLost = XCTNSPredicateExpectation(predicate: predicate, object: nil)
    selectionLost.isInverted = true
    return XCTWaiter().wait(for: [selectionLost], timeout: seconds) == .completed
  }

  func clickCopy(onRow index: Int) { element("clipboard.row.\(index).copy").click() }

  func copyButtonLabel(onRow index: Int) -> String { element("clipboard.row.\(index).copy").label }

  var detailEditor: XCUIElement { element("clipboard.detail.editor") }

  func replaceDetailText(with text: String) {
    detailEditor.focus()
    detailEditor.typeKey("a", modifierFlags: .command)
    detailEditor.typeText(text)
  }

  func clickDetailCopy() { element("clipboard.detail.copy").click() }

  var saveButton: XCUIElement { element("clipboard.detail.save") }

  func clickDetailSave() { saveButton.click() }

  func clearAll(confirm: Bool) {
    element("header.clearAll").click()
    let buttonTitle = confirm ? "Clear All" : "Cancel"
    // Scoped to the alert: an unscoped query also matches Touch Bar buttons, which cannot be clicked.
    let dialogButton = app.dialogs.buttons[buttonTitle]
    let sheetButton = app.sheets.buttons[buttonTitle]
    Wait.until("the \(buttonTitle) button in the confirmation appears") { dialogButton.exists || sheetButton.exists }
    let button = dialogButton.exists ? dialogButton : sheetButton
    button.click()
  }

  func scrollToBottom() {
    row(0).scroll(byDeltaX: 0, deltaY: -2000)
  }
}
