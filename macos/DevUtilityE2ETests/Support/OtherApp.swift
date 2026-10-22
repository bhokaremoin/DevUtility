import XCTest

enum OtherApp {
  // Calculator took 10-20s per synthesized keystroke on CI, so another built-in app is used.
  static let bundleIdentifier = "com.apple.TextEdit"

  static func bringToFront() -> XCUIApplication {
    let app = XCUIApplication(bundleIdentifier: bundleIdentifier)
    app.activate()
    Wait.until("TextEdit is frontmost", timeout: 10) { app.state == .runningForeground }
    return app
  }
}
