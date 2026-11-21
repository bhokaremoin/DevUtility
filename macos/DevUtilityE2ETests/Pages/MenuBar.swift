import XCTest

struct MenuBar {
  let app: XCUIApplication

  var icon: XCUIElement { app.statusItems["statusItem.app"] }

  func clickIcon() {
    XCTAssertTrue(icon.waitForExistence(timeout: Wait.defaultTimeout), "menu-bar icon missing")
    icon.click()
  }

  func chooseFromRightClickMenu(_ title: String, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertTrue(icon.waitForExistence(timeout: Wait.defaultTimeout), "menu-bar icon missing", file: file, line: line)
    Mouse.rightClick(icon, file: file, line: line)
    let item = app.menuItems[title]
    XCTAssertTrue(item.waitForExistence(timeout: Wait.defaultTimeout), "no \(title) menu item", file: file, line: line)
    Mouse.click(item, file: file, line: line)
  }
}
