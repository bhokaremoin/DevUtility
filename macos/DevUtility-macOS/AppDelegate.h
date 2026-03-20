// AppDelegate.h
// DevUtility
//
// Description: Application delegate header for the DevUtility macOS target.
// Architecture Role: Declares the AppDelegate class which subclasses RCTAppDelegate
//   to receive React Native lifecycle callbacks alongside the standard macOS
//   application delegate methods.

#import <RCTAppDelegate.h>
#import <Cocoa/Cocoa.h>

/// Application delegate. Bootstraps the React Native bridge via `RCTAppDelegate`
/// and hands the root view to `PanelManager` for floating-panel display.
@interface AppDelegate : RCTAppDelegate

@end
