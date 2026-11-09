import CoreGraphics
import XCTest

// Posts key events at the HID level, as a physical keyboard does. macOS routes them to whatever
// would get a real keypress. XCUITest's typeKey/typeText instead activate the target app first and
// wait for it to go idle after every key (10-20s per key on CI), which hides focus and timing bugs.
enum Keyboard {
  enum Key: CGKeyCode {
    case returnKey = 36
    case escape = 53
    case downArrow = 125
    case upArrow = 126
  }

  // Virtual key codes of the US ANSI layout, the CI runner's layout.
  private static let keyCodes: [Character: CGKeyCode] = [
    "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7, "c": 8, "v": 9,
    "b": 11, "q": 12, "w": 13, "e": 14, "r": 15, "y": 16, "t": 17, "o": 31, "u": 32,
    "i": 34, "p": 35, "l": 37, "j": 38, "k": 40, "n": 45, "m": 46,
    "1": 18, "2": 19, "3": 20, "4": 21, "5": 23, "6": 22, "7": 26, "8": 28, "9": 25, "0": 29,
    ",": 43,
  ]

  // Without this permission macOS drops posted events silently, and every spec would fail as if keys were lost.
  static func requirePermissionToPostEvents(file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertTrue(
      CGPreflightPostEventAccess(),
      "The test runner may not post key events; allow it under Privacy & Security > Accessibility",
      file: file,
      line: line
    )
  }

  static func type(_ text: String) {
    for character in text {
      press(character)
    }
  }

  static func press(_ character: Character, modifiers: CGEventFlags = []) {
    guard let keyCode = keyCodes[character] else {
      preconditionFailure("No key code for \"\(character)\"; add it to Keyboard.keyCodes")
    }
    post(keyCode, modifiers: modifiers)
  }

  static func press(_ key: Key, modifiers: CGEventFlags = []) {
    post(key.rawValue, modifiers: modifiers)
  }

  private static func post(_ keyCode: CGKeyCode, modifiers: CGEventFlags) {
    for isKeyDown in [true, false] {
      let event = CGEvent(keyboardEventSource: nil, virtualKey: keyCode, keyDown: isKeyDown)
      event?.flags = modifiers
      event?.post(tap: .cghidEventTap)
    }
  }
}
