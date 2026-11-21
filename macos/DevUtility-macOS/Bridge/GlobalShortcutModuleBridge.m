#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(GlobalShortcutModule, RCTEventEmitter)

// NativeEventEmitter in React Native 0.76 calls these when JS adds or removes listeners.
RCT_EXTERN_METHOD(addListener:(NSString *)eventName)
RCT_EXTERN_METHOD(removeListeners:(double)count)

RCT_EXTERN_METHOD(getShortcut:(NSString *)toolId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetShortcut:(NSString *)toolId)

@end
