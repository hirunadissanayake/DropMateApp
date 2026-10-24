#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>
#if DEBUG
#import <AudioToolbox/AudioToolbox.h>
#endif

// Forward Firebase's callbacks while choosing which foreground sounds iOS plays.
@interface DropMateNotificationDelegate : NSObject <UNUserNotificationCenterDelegate>
@property(nonatomic, strong) id<UNUserNotificationCenterDelegate> firebaseDelegate;
@end

@implementation DropMateNotificationDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
      willPresentNotification:(UNNotification *)notification
        withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([self.firebaseDelegate respondsToSelector:_cmd]) {
    // Firebase must still dispatch onMessage to JS. Its completion is consumed
    // here so the system's completion handler is called exactly once below.
    [self.firebaseDelegate userNotificationCenter:center
                         willPresentNotification:notification
                           withCompletionHandler:^(UNNotificationPresentationOptions options) {}];
  }

  NSString *type = notification.request.content.userInfo[@"type"];
  BOOL parcelRequest = [type isEqualToString:@"DELIVERY_REQUEST"] || [type isEqualToString:@"match_request"];
  UNNotificationPresentationOptions options = UNNotificationPresentationOptionBadge;
  if (!parcelRequest) options |= UNNotificationPresentationOptionSound;
  // Parcel requests use the app's looping player; other messages use the
  // system sound and the user's haptics settings. JS continues showing toasts.
  completionHandler(options);
}

- (BOOL)respondsToSelector:(SEL)selector
{
  return [super respondsToSelector:selector] || [self.firebaseDelegate respondsToSelector:selector];
}

- (id)forwardingTargetForSelector:(SEL)selector
{
  if ([self.firebaseDelegate respondsToSelector:selector]) return self.firebaseDelegate;
  return [super forwardingTargetForSelector:selector];
}

@end

@interface AppDelegate ()
@property(nonatomic, strong) DropMateNotificationDelegate *notificationPresentationDelegate;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  self.moduleName = @"DropMate";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  BOOL launched = [super application:application didFinishLaunchingWithOptions:launchOptions];
  // RNFirebase installs its delegate on UIApplicationDidFinishLaunchingNotification.
  // The next main-queue turn runs after that synchronous notification is posted.
  dispatch_async(dispatch_get_main_queue(), ^{
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    DropMateNotificationDelegate *delegate = [DropMateNotificationDelegate new];
    delegate.firebaseDelegate = center.delegate;
    self.notificationPresentationDelegate = delegate;
    center.delegate = delegate;
  });
  return launched;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

#if DEBUG
- (void)applicationDidBecomeActive:(UIApplication *)application
{
  NSURL *soundURL = [[NSBundle mainBundle] URLForResource:@"request_alert" withExtension:@"caf"];
  SystemSoundID soundID = 0;
  OSStatus soundStatus = soundURL
      ? AudioServicesCreateSystemSoundID((__bridge CFURLRef)soundURL, &soundID)
      : -50;
  NSLog(@"[ParcelSound] bundledCAF=%@ systemSoundStatus=%d (0 means valid)",
        soundURL ? @"YES" : @"NO", (int)soundStatus);
  if (soundStatus == 0) AudioServicesDisposeSystemSoundID(soundID);

  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    NSLog(@"[ParcelSound] authorization=%ld sounds=%ld alerts=%ld (settings: 0=unsupported, 1=disabled, 2=enabled)",
          (long)settings.authorizationStatus, (long)settings.soundSetting, (long)settings.alertSetting);
  }];
  [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *notifications) {
    for (UNNotification *notification in notifications) {
      NSDictionary *payload = notification.request.content.userInfo;
      NSString *type = payload[@"type"];
      if ([type isEqualToString:@"DELIVERY_REQUEST"] || [type isEqualToString:@"match_request"]) {
        NSLog(@"[ParcelSound] delivered type=%@ aps.sound=%@",
              type, payload[@"aps"][@"sound"] ?: @"MISSING");
      }
    }
  }];
}
#endif

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
