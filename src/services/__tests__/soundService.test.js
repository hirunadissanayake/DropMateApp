jest.mock('react-native', () => ({Platform: {OS: 'ios'}}));
jest.mock('react-native-sound', () => {
  const Sound = jest.fn();
  Sound.MAIN_BUNDLE = '/App Bundle/DropMate.app';
  Sound.setCategory = jest.fn();
  Sound.setActive = jest.fn();
  return Sound;
});

let Sound;
let service;

beforeEach(() => {
  jest.resetModules();
  Sound = require('react-native-sound');
  Sound.mockImplementation((filename, basePath, onLoad) => {
    let loaded = false;
    return {
      finishLoading(error = null) {
        loaded = !error;
        onLoad(error);
      },
      isLoaded: () => loaded,
      play: jest.fn(),
      stop: jest.fn(),
      release: jest.fn(),
      setVolume: jest.fn(),
      setNumberOfLoops: jest.fn(),
    };
  });
  service = require('../soundService');
});

const latestSound = () => Sound.mock.results[Sound.mock.results.length - 1].value;

test('queues a request until the sound has loaded, then activates iOS playback', () => {
  service.playAlertSound();
  const sound = latestSound();
  expect(sound.play).not.toHaveBeenCalled();
  sound.finishLoading();
  expect(sound.play).toHaveBeenCalledTimes(1);
  expect(sound.setNumberOfLoops).toHaveBeenCalledWith(-1);
  expect(Sound.setActive).toHaveBeenCalledWith(true);
  expect(Sound).toHaveBeenCalledWith(
    'file:///App%20Bundle/DropMate.app/request_alert.caf', '', expect.any(Function),
  );
});

test('cancelling a request while loading prevents a late alert', () => {
  service.playAlertSound();
  const sound = latestSound();
  service.stopAlertSound();
  sound.finishLoading();
  expect(sound.play).not.toHaveBeenCalled();
});

test('a failed load can be retried by the next request', () => {
  service.initSound();
  latestSound().finishLoading(new Error('Load failed'));
  service.playAlertSound();
  const sound = latestSound();
  sound.finishLoading();
  expect(Sound).toHaveBeenCalledTimes(2);
  expect(sound.play).toHaveBeenCalledTimes(1);
});

test('duplicate requests do not restart playback, but a stopped alert can restart', () => {
  service.playAlertSound();
  const sound = latestSound();
  sound.finishLoading();
  service.playAlertSound();
  expect(sound.play).toHaveBeenCalledTimes(1);
  service.stopAlertSound();
  expect(sound.stop).toHaveBeenCalledTimes(1);
  service.playAlertSound();
  expect(sound.play).toHaveBeenCalledTimes(2);
});

test('releasing during loading does not play the discarded sound', () => {
  service.playAlertSound();
  const oldSound = latestSound();
  service.releaseSound();
  service.playAlertSound();
  oldSound.finishLoading();
  expect(oldSound.play).not.toHaveBeenCalled();
  latestSound().finishLoading();
  expect(latestSound().play).toHaveBeenCalledTimes(1);
});

test('Android keeps its existing bundled MP3 lookup', () => {
  require('react-native').Platform.OS = 'android';
  service.playAlertSound();
  latestSound().finishLoading();
  expect(Sound).toHaveBeenCalledWith('request_alert.mp3', Sound.MAIN_BUNDLE, expect.any(Function));
  expect(Sound.setActive).not.toHaveBeenCalled();
});
