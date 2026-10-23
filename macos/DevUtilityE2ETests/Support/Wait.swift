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
}
