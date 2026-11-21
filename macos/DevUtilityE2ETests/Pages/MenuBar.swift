import XCTest

struct MenuBar {
  let app: XCUIApplication

  func icon(for toolId: String) -> XCUIElement { app.statusItems["statusItem.\(toolId)"] }

  func clickIcon(for toolId: String, file: StaticString = #filePath, line: UInt = #line) {
    let icon = icon(for: toolId)
    XCTAssertTrue(icon.waitForExistence(timeout: Wait.defaultTimeout), "no \(toolId) menu-bar icon", file: file, line: line)
    icon.click()
  }

  func chooseFromRightClickMenu(_ title: String, on toolId: String, file: StaticString = #filePath, line: UInt = #line) {
    Mouse.rightClick(icon(for: toolId), file: file, line: line)
    let item = app.menuItems[title]
    XCTAssertTrue(item.waitForExistence(timeout: Wait.defaultTimeout), "no \(title) menu item", file: file, line: line)
    Mouse.click(item, file: file, line: line)
  }
}
