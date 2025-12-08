//
//  AppGroupStorage.m
//  braise
//
//  Created for sharing data with share extension
//

#import "AppGroupStorage.h"
#import <React/RCTLog.h>

@implementation AppGroupStorage

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setItem:(NSString *)key
                  value:(NSString *)value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.braise.recipe"];
    if (sharedDefaults) {
        [sharedDefaults setObject:value forKey:key];
        [sharedDefaults synchronize];
        resolve(@(YES));
    } else {
        reject(@"STORAGE_ERROR", @"Failed to access App Group UserDefaults", nil);
    }
}

RCT_EXPORT_METHOD(getItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.braise.recipe"];
    if (sharedDefaults) {
        NSString *value = [sharedDefaults stringForKey:key];
        resolve(value ?: [NSNull null]);
    } else {
        reject(@"STORAGE_ERROR", @"Failed to access App Group UserDefaults", nil);
    }
}

RCT_EXPORT_METHOD(removeItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.braise.recipe"];
    if (sharedDefaults) {
        [sharedDefaults removeObjectForKey:key];
        [sharedDefaults synchronize];
        resolve(@(YES));
    } else {
        reject(@"STORAGE_ERROR", @"Failed to access App Group UserDefaults", nil);
    }
}

@end
