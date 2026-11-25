import XCTest

enum Wait {
  static let defaultTimeout: TimeInterval = 5

  static func until(
    _ description: String,
    timeout: TimeInterval = defaultTimeout,
    file: StaticString = #filePath,
    line: UInt = #line,
    condition: @escaping () -> Bool
  ) {
    let predicate = NSPredicate { _, _ in condition() }
    let expectation = XCTNSPredicateExpectation(predicate: predicate, object: nil)
    let result = XCTWaiter().wait(for: [expectation], timeout: timeout)
    XCTAssertEqual(result, .completed, "Timed out waiting until \(description)", file: file, line: line)
  }

  /// Whether `condition` stays true for the whole window, checked every 100 ms. It returns false
  /// as soon as the condition fails. (An inverted XCTNSPredicateExpectation looks only about once a
  /// second, so over a short window it can pass without ever checking.)
  static func holds(for seconds: TimeInterval, _ condition: () -> Bool) -> Bool {
    let deadline = Date().addingTimeInterval(seconds)
    while Date() < deadline {
      if !condition() {
        return false
      }
      RunLoop.current.run(until: Date().addingTimeInterval(0.1))
    }
    return condition()
  }
}
