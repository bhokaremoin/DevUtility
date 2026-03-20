// GlobalShortcutModuleBridge.m
// DevUtility
//
// Description: Obj-C bridge declarations for GlobalShortcutModule (Swift).
// Exposes the Swift class and its methods to the React Native JS bridge.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GlobalShortcutModule, NSObject)

// JS: GlobalShortcutModule.getShortcut()
// Returns a Promise that resolves with {keyCode, modifiers, description} or null.
RCT_EXTERN_METHOD(getShortcut:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// JS: GlobalShortcutModule.resetShortcut()
// Resets the registered shortcut to the factory default (⌃⌥D).
RCT_EXTERN_METHOD(resetShortcut)

@end
