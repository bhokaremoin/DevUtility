import AppKit
import XCTest

// The desktop belongs to Finder, so clicking it is the simplest way to put a second app in front
// without opening any window.
enum Desktop {
  static var isFinderFrontmost: Bool {
    NSWorkspace.shared.frontmostApplication?.bundleIdentifier == "com.apple.finder"
  }

  // Bottom-left of the main screen above the Dock: the panel opens centered and Calculator
  // opens near the top, so nothing else covers it on a fresh runner.
  static func click() {
    let screen = NSScreen.main ?? NSScreen.screens[0]
    let visibleFrame = screen.visibleFrame
    // NSScreen uses a bottom-left origin, CGEvent a top-left one.
    let point = CGPoint(x: visibleFrame.minX + 20, y: screen.frame.height - (visibleFrame.minY + 20))
    Mouse.click(at: point)
  }
}
