import XCTest

enum OtherApp {
  // Calculator opens no document window or dialog, so activation is predictable on a fresh runner.
  // Synthesized keystrokes into any other app take 10-20s on CI (Calculator and TextEdit measured alike).
  static let bundleIdentifier = "com.apple.calculator"

  static func bringToFront() -> XCUIApplication {
    let app = XCUIApplication(bundleIdentifier: bundleIdentifier)
    app.activate()
    Wait.until("Calculator is frontmost", timeout: 10) { app.state == .runningForeground }
    return app
  }
}
