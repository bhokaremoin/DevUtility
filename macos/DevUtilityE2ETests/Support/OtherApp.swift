import AppKit
import XCTest

enum OtherApp {
  // Calculator opens no document window or dialog, so activation is predictable on a fresh runner.
  static let bundleIdentifier = "com.apple.calculator"

  // XCUIApplication.state reports .runningForeground for any running app on macOS, active or not,
  // so the frontmost app is read from the system instead.
  static var isFrontmost: Bool {
    NSWorkspace.shared.frontmostApplication?.bundleIdentifier == bundleIdentifier
  }

  @discardableResult
  static func bringToFront() -> XCUIApplication {
    let app = XCUIApplication(bundleIdentifier: bundleIdentifier)
    app.activate()
    Wait.until("Calculator is frontmost", timeout: 10) { isFrontmost }
    return app
  }
}
