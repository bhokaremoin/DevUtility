#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(KeyEventModule, RCTEventEmitter)
// Required by NativeEventEmitter in RN 0.76
RCT_EXTERN_METHOD(addListener:(NSString *)eventName)
RCT_EXTERN_METHOD(removeListeners:(double)count)
RCT_EXTERN_METHOD(hidePanel)
@end
