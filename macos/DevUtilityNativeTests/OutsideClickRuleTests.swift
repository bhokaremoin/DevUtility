import XCTest

final class OutsideClickRuleTests: XCTestCase {
  private let everyLocation: [ClickLocation] = [
    .ownPanel, .ownStatusItem, .ownSheetOrAlert, .settingsOpenedFromThisPanel, .otherDevUtilityWindow, .otherApp,
  ]

  func test_aPanelThatClosesOnlyExplicitlyIgnoresEveryClick() {
    for location in everyLocation {
      XCTAssertFalse(OutsideClickRule.shouldClose(.closesOnlyExplicitly, after: location), "\(location)")
    }
  }

  func test_aPanelThatClosesOnOutsideClickClosesForAnotherAppOrAnotherDevUtilityWindow() {
    XCTAssertTrue(OutsideClickRule.shouldClose(.closesOnOutsideClick, after: .otherApp))
    XCTAssertTrue(OutsideClickRule.shouldClose(.closesOnOutsideClick, after: .otherDevUtilityWindow))
  }

  func test_aPanelThatClosesOnOutsideClickStaysForItsOwnPartsAndSettingsItOpened() {
    for location: ClickLocation in [.ownPanel, .ownStatusItem, .ownSheetOrAlert, .settingsOpenedFromThisPanel] {
      XCTAssertFalse(OutsideClickRule.shouldClose(.closesOnOutsideClick, after: location), "\(location)")
    }
  }
}
