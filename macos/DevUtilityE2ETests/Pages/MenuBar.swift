import XCTest

struct MenuBar {
  let app: XCUIApplication

  var icon: XCUIElement { app.statusItems["statusItem.app"] }

  func clickIcon() {
    XCTAssertTrue(icon.waitForExistence(timeout: Wait.defaultTimeout), "menu-bar icon missing")
    icon.click()
  }
}
