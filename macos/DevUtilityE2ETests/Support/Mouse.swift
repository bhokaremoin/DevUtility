import CoreGraphics
import XCTest

// Clicks at the HID level, as a physical mouse does. XCUIElement.click() activates the element's
// app first, so it can't show what a click does while DevUtility stays inactive behind another app.
enum Mouse {
  static func click(_ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertTrue(
      element.waitForExistence(timeout: Wait.defaultTimeout),
      "\(element.identifier) is not on screen",
      file: file,
      line: line
    )
    post([.mouseMoved, .leftMouseDown, .leftMouseUp], at: center(of: element), button: .left)
  }

  // XCUIElement.rightClick() on a menu-bar icon waits for a menu-open notification that a status
  // item's menu never sends, so it times out even when the menu opens.
  static func rightClick(_ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertTrue(
      element.waitForExistence(timeout: Wait.defaultTimeout),
      "\(element.identifier) is not on screen",
      file: file,
      line: line
    )
    post([.mouseMoved, .rightMouseDown, .rightMouseUp], at: center(of: element), button: .right)
  }

  static func click(at point: CGPoint) {
    post([.mouseMoved, .leftMouseDown, .leftMouseUp], at: point, button: .left)
  }

  static func move(to point: CGPoint) {
    post([.mouseMoved], at: point, button: .left)
  }

  // XCUIElement.frame and CGEvent locations share the same space: global, top-left origin.
  private static func center(of element: XCUIElement) -> CGPoint {
    CGPoint(x: element.frame.midX, y: element.frame.midY)
  }

  private static func post(_ types: [CGEventType], at point: CGPoint, button: CGMouseButton) {
    for type in types {
      let event = CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: point, mouseButton: button)
      event?.post(tap: .cghidEventTap)
    }
  }
}
