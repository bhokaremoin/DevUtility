import AppKit

// The menu-bar screen's geometry in the coordinates XCUIElement.frame and CGEvent use: global,
// with the origin at the top-left of the menu-bar screen and y growing downwards.
enum Screen {
  private static var menuBarScreen: NSScreen { NSScreen.screens[0] }

  static var frame: CGRect { menuBarScreen.frame }

  /// The screen minus the menu bar and the Dock.
  static var visibleFrame: CGRect {
    let full = menuBarScreen.frame
    let visible = menuBarScreen.visibleFrame
    return CGRect(x: visible.minX, y: full.maxY - visible.maxY, width: visible.width, height: visible.height)
  }

  static var menuBarHeight: CGFloat { visibleFrame.minY }
}
