import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import {AppState, Platform} from 'react-native';
import {playAlertSound, stopAlertSound} from '../soundService';
import {useIOSParcelAlertSound} from '../useIOSParcelAlertSound';

jest.mock('react-native', () => ({
  Platform: {OS: 'ios'},
  AppState: {currentState: 'active', addEventListener: jest.fn()},
}));
jest.mock('../soundService', () => ({
  playAlertSound: jest.fn(),
  stopAlertSound: jest.fn(),
}));

const Harness = ({visible}) => {
  useIOSParcelAlertSound(visible);
  return null;
};

let renderer;
let onAppStateChange;
const removeListener = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'ios';
  AppState.currentState = 'active';
  AppState.addEventListener.mockImplementation((event, listener) => {
    onAppStateChange = listener;
    return {remove: removeListener};
  });
});

afterEach(() => {
  if (renderer) act(() => renderer.unmount());
  renderer = null;
});

test('rings when a fetched or opened request displays its popup without a push playback call', () => {
  act(() => {renderer = TestRenderer.create(<Harness visible={false} />);});
  expect(playAlertSound).not.toHaveBeenCalled();
  act(() => {renderer.update(<Harness visible />);});
  expect(playAlertSound).toHaveBeenCalledTimes(1);
});

test('stops when a visible request is dismissed', () => {
  act(() => {renderer = TestRenderer.create(<Harness visible />);});
  stopAlertSound.mockClear();
  act(() => {renderer.update(<Harness visible={false} />);});
  expect(stopAlertSound).toHaveBeenCalled();
});

test('defers playback until iOS becomes active and stops when backgrounded', () => {
  AppState.currentState = 'background';
  act(() => {renderer = TestRenderer.create(<Harness visible />);});
  expect(playAlertSound).not.toHaveBeenCalled();
  act(() => onAppStateChange('active'));
  expect(playAlertSound).toHaveBeenCalledTimes(1);
  stopAlertSound.mockClear();
  act(() => onAppStateChange('background'));
  expect(stopAlertSound).toHaveBeenCalledTimes(1);
});

test('removes the listener and stops playback when leaving the screen', () => {
  act(() => {renderer = TestRenderer.create(<Harness visible />);});
  act(() => renderer.unmount());
  renderer = null;
  expect(removeListener).toHaveBeenCalledTimes(1);
  expect(stopAlertSound).toHaveBeenCalled();
});

test('leaves existing Android playback in control', () => {
  Platform.OS = 'android';
  act(() => {renderer = TestRenderer.create(<Harness visible />);});
  expect(playAlertSound).not.toHaveBeenCalled();
  expect(stopAlertSound).not.toHaveBeenCalled();
  expect(AppState.addEventListener).not.toHaveBeenCalled();
});
