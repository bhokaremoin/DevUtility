import AppKit

struct ScreenArea {
  let frame: NSRect
  /// The screen minus the menu bar and the Dock.
  let visibleFrame: NSRect
}

/// Works in AppKit coordinates, where the origin is the bottom-left corner of the main screen.
enum PanelFrameCalculator {
  static func visibleFrame(containing mouse: NSPoint, screens: [ScreenArea]) -> NSRect {
    let screenUnderMouse = screens.first { NSMouseInRect(mouse, $0.frame, false) } ?? screens.first
    return screenUnderMouse?.visibleFrame ?? .zero
  }

  static func frame(for position: OpeningPosition, size: NSSize, mouse: NSPoint, visibleFrame: NSRect) -> NSRect {
    let preferredOrigin: NSPoint
    switch position {
    case .atMousePointer:
      preferredOrigin = NSPoint(x: mouse.x, y: mouse.y - size.height)
    case .centeredOnMouseScreen:
      preferredOrigin = NSPoint(x: visibleFrame.midX - size.width / 2, y: visibleFrame.midY - size.height / 2)
    }

    let origin = NSPoint(
      x: clamp(preferredOrigin.x, from: visibleFrame.minX, to: visibleFrame.maxX - size.width),
      y: clamp(preferredOrigin.y, from: visibleFrame.minY, to: visibleFrame.maxY - size.height)
    )
    return NSRect(origin: origin, size: size)
  }

  /// A panel larger than the area has no room to move, so it starts at the area's lower bound.
  private static func clamp(_ value: CGFloat, from lowerBound: CGFloat, to upperBound: CGFloat) -> CGFloat {
    guard upperBound > lowerBound else { return lowerBound }
    return min(max(value, lowerBound), upperBound)
  }
}
