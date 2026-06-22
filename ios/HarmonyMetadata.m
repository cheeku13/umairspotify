#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HarmonyMetadata, NSObject)

RCT_EXTERN_METHOD(extractMetadata:(NSString *)filePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
