This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

## iOS parcel alert sound

Foreground iOS requests use the louder bundled `request_alert.caf` through
`soundService`; Android keeps `request_alert.mp3`. Other foreground iOS messages
use system notification sounds, while parcel popups use only the looping player.
Rebuild and install the app after changing native resources or signing settings.

For background/locked-screen delivery alerts, the server must send an APNs alert
with `aps.sound` set to `request_alert.caf` (the bundled 20-second PCM clip).
Example Firebase Admin SDK message fragment; keep the existing Android config:

```js
{
  token: iosFcmToken,
  data: { type: 'DELIVERY_REQUEST', matchId: '...' },
  apns: {
    headers: { 'apns-push-type': 'alert', 'apns-priority': '10' },
    payload: {
      aps: {
        alert: { title: 'New parcel request', body: 'Open DropMate to respond.' },
        sound: 'request_alert.caf',
      },
    },
  },
}
```

The signing profile must include `aps-environment` and Firebase must have valid
APNs credentials for `com.dropmate`. The project declares Push Notifications and
remote-notification background mode; regenerate the profile through Xcode signing
if the existing profile does not support Push Notifications. Allow notifications
and Sounds in iPhone settings. Ordinary notification sounds respect Silent Mode
and Focus settings; suspended JavaScript cannot provide an infinite alert loop.

Verify a new request while the app is open, while locked, and after accepting,
rejecting, or cancelling a request. In-app looping audio should stop when the
request is dismissed. The short background notification sound does not loop.

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
