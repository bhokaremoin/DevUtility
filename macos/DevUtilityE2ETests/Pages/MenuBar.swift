import XCTest

struct MenuBar {
  // The app menu has its own Settings… and Quit items, so the icon's menu items are found by identifier.
  enum IconMenuItem: String {
    case openTool = "statusMenu.open"
    case settings = "statusMenu.settings"
    case quit = "statusMenu.quit"
  }

  let app: XCUIApplication

  func icon(for toolId: String) -> XCUIElement { app.statusItems["statusItem.\(toolId)"] }

  func clickIcon(for toolId: String, file: StaticString = #filePath, line: UInt = #line) {
    let icon = icon(for: toolId)
    XCTAssertTrue(icon.waitForExistence(timeout: Wait.defaultTimeout), "no \(toolId) menu-bar icon", file: file, line: line)
    icon.click()
  }

  func rightClickMenuItem(_ item: IconMenuItem) -> XCUIElement { app.menuItems[item.rawValue] }

  func chooseFromRightClickMenu(_ item: IconMenuItem, on toolId: String, file: StaticString = #filePath, line: UInt = #line) {
    Mouse.rightClick(icon(for: toolId), file: file, line: line)
    let menuItem = rightClickMenuItem(item)
    XCTAssertTrue(menuItem.waitForExistence(timeout: Wait.defaultTimeout), "no \(item) menu item", file: file, line: line)
    Mouse.click(menuItem, file: file, line: line)
  }
}
