import XCTest

enum OtherApp {
  // Calculator is light and has no documents, so activating it and typing through it is fast.
  // The spike measured ~30s per keystroke call through Finder.
  static let bundleIdentifier = "com.apple.calculator"

  static func bringToFront() -> XCUIApplication {
    let app = XCUIApplication(bundleIdentifier: bundleIdentifier)
    app.activate()
    Wait.until("Calculator is frontmost", timeout: 10) { app.state == .runningForeground }
    return app
  }
}
