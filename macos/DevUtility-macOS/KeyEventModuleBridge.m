// KeyEventModuleBridge.m
// DevUtility
//
// Description: Obj-C bridge declarations for KeyEventModule (Swift).
// Exposes the Swift RCTEventEmitter subclass and its callable methods to JS.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(KeyEventModule, RCTEventEmitter)

// Required stub by NativeEventEmitter in RN 0.76 — called automatically by RN
// when JS adds an event listener via `emitter.addListener(...)`.
RCT_EXTERN_METHOD(addListener:(NSString *)eventName)

// Required stub by NativeEventEmitter in RN 0.76 — called automatically by RN
// when JS removes listeners via `subscription.remove()`.
RCT_EXTERN_METHOD(removeListeners:(double)count)

// JS: KeyEventModule.hidePanel()
// Hides the floating panel. Used by App.tsx Escape handler as a final fallback.
RCT_EXTERN_METHOD(hidePanel)

@end
