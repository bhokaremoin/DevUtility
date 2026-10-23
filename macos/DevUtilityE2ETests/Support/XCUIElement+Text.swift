import XCTest

extension XCUIElement {
  var displayedText: String {
    if let value = value as? String, !value.isEmpty {
      return value
    }
    return label
  }

  // The spike showed the first keystroke after a click can be dropped, and keys sent to a
  // programmatically focused React Native field are lost until it is clicked (spec: "Focus bug").
  func focus() {
    click()
    Wait.until("\(identifier) has keyboard focus") {
      (self.value(forKey: "hasKeyboardFocus") as? Bool) == true
    }
  }

  func typeAfterFocusing(_ text: String) {
    focus()
    typeText(text)
  }
}
