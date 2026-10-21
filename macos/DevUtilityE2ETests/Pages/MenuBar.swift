import XCTest

struct MenuBar {
  let app: XCUIApplication

  func clickIcon() {
    let icon = app.statusItems["statusItem.app"]
    XCTAssertTrue(icon.waitForExistence(timeout: Wait.defaultTimeout), "menu-bar icon missing")
    icon.click()
  }
}
