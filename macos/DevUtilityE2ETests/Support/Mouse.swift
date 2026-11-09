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
    // XCUIElement.frame and CGEvent locations share the same space: global, top-left origin.
    let center = CGPoint(x: element.frame.midX, y: element.frame.midY)
    for type in [CGEventType.mouseMoved, .leftMouseDown, .leftMouseUp] {
      let event = CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: center, mouseButton: .left)
      event?.post(tap: .cghidEventTap)
    }
  }
}
