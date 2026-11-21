import AppKit
import XCTest

final class PanelFrameCalculatorTests: XCTestCase {
  private let laptopVisibleFrame = NSRect(x: 0, y: 0, width: 1440, height: 875)
  private let clipboardSize = NSSize(width: 560, height: 420)

  func test_atMousePointerPutsTopLeftAtTheMouse() {
    let frame = PanelFrameCalculator.frame(
      for: .atMousePointer, size: clipboardSize, mouse: NSPoint(x: 300, y: 700), visibleFrame: laptopVisibleFrame)

    XCTAssertEqual(frame, NSRect(x: 300, y: 280, width: 560, height: 420))
  }

  func test_atMousePointerClampsAtTheRightEdge() {
    let frame = PanelFrameCalculator.frame(
      for: .atMousePointer, size: clipboardSize, mouse: NSPoint(x: 1400, y: 700), visibleFrame: laptopVisibleFrame)

    XCTAssertEqual(frame.origin.x, 880)
  }

  func test_atMousePointerClampsAtTheBottomEdge() {
    let frame = PanelFrameCalculator.frame(
      for: .atMousePointer, size: clipboardSize, mouse: NSPoint(x: 300, y: 100), visibleFrame: laptopVisibleFrame)

    XCTAssertEqual(frame.origin.y, 0)
  }

  func test_atMousePointerInTheMenuBarOpensJustBelowIt() {
    let frame = PanelFrameCalculator.frame(
      for: .atMousePointer, size: clipboardSize, mouse: NSPoint(x: 300, y: 890), visibleFrame: laptopVisibleFrame)

    XCTAssertEqual(frame.origin.y, 455)
    XCTAssertEqual(frame.maxY, laptopVisibleFrame.maxY)
  }

  func test_panelLargerThanTheScreenStartsAtTheVisibleOrigin() {
    let frame = PanelFrameCalculator.frame(
      for: .atMousePointer, size: NSSize(width: 2000, height: 1000), mouse: NSPoint(x: 300, y: 700),
      visibleFrame: laptopVisibleFrame)

    XCTAssertEqual(frame.origin, NSPoint(x: 0, y: 0))
    XCTAssertEqual(frame.size, NSSize(width: 2000, height: 1000))
  }

  func test_centeredOnMouseScreen() {
    let frame = PanelFrameCalculator.frame(
      for: .centeredOnMouseScreen, size: NSSize(width: 800, height: 600), mouse: NSPoint(x: 10, y: 10),
      visibleFrame: laptopVisibleFrame)

    XCTAssertEqual(frame, NSRect(x: 320, y: 137.5, width: 800, height: 600))
  }

  func test_visibleFrameComesFromTheScreenUnderTheMouse() {
    let laptop = ScreenArea(frame: NSRect(x: 0, y: 0, width: 1440, height: 900), visibleFrame: laptopVisibleFrame)
    let monitorVisibleFrame = NSRect(x: -1920, y: 0, width: 1920, height: 1055)
    let monitor = ScreenArea(frame: NSRect(x: -1920, y: 0, width: 1920, height: 1080), visibleFrame: monitorVisibleFrame)

    let visibleFrame = PanelFrameCalculator.visibleFrame(containing: NSPoint(x: -500, y: 500), screens: [laptop, monitor])

    XCTAssertEqual(visibleFrame, monitorVisibleFrame)
  }

  func test_mouseOnNoScreenFallsBackToTheFirstScreen() {
    let laptop = ScreenArea(frame: NSRect(x: 0, y: 0, width: 1440, height: 900), visibleFrame: laptopVisibleFrame)

    let visibleFrame = PanelFrameCalculator.visibleFrame(containing: NSPoint(x: 5000, y: 5000), screens: [laptop])

    XCTAssertEqual(visibleFrame, laptopVisibleFrame)
  }
}
