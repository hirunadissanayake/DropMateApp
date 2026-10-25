jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
}));
jest.mock('react-native', () => ({Platform: {OS: 'ios'}, PermissionsAndroid: {}}));
jest.mock('../notificationService', () => ({updateFcmToken: jest.fn()}));
jest.mock('../../navigation/navigationRef', () => ({navigate: jest.fn()}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
jest.mock('../soundService', () => ({stopAlertSound: jest.fn()}));
jest.mock('../../store/announcementStore', () => ({
  useAnnouncementStore: {getState: () => ({addAnnouncement: jest.fn()})},
}));

let lifecycle;
let fcm;
let messaging;
let onMessage;

beforeEach(() => {
  jest.resetModules();
  lifecycle = require('../parcelRequestLifecycle');
  fcm = require('../fcmService');
  messaging = require('@react-native-firebase/messaging');
  fcm.setupFcmListeners();
  onMessage = messaging.onMessage.mock.calls[0][1];
});

test('withdrawal delivered by push closes the matching request, and delayed reminders cannot reopen it', async () => {
  const closed = jest.fn();
  const showRequest = jest.fn();
  lifecycle.subscribeParcelRequestClosed(closed);
  fcm.setDeliveryRequestListener(showRequest);
  await onMessage({data: {type: 'MATCH_CANCELLED', matchId: 'withdrawn'}});
  expect(closed).toHaveBeenCalledWith('withdrawn');
  await onMessage({data: {type: 'DELIVERY_REQUEST', matchId: 'withdrawn'}});
  expect(showRequest).not.toHaveBeenCalled();
  await onMessage({data: {type: 'DELIVERY_REQUEST', matchId: 'different-order'}});
  expect(showRequest).toHaveBeenCalledWith(expect.objectContaining({matchId: 'different-order'}));
});

test('background cancellation updates mounted listeners before the app returns to active', () => {
  const closeModal = jest.fn();
  const remove = lifecycle.subscribeParcelRequestClosed(closeModal);
  lifecycle.closeParcelRequest('background-order');
  expect(closeModal).toHaveBeenCalledWith('background-order');
  expect(lifecycle.isParcelRequestClosed('background-order')).toBe(true);
  remove();
  lifecycle.closeParcelRequest('other-order');
  expect(closeModal).toHaveBeenCalledTimes(1);
});

test('closed queued requests remain blocked when no screen was mounted at cancellation', () => {
  lifecycle.closeParcelRequest('queued');
  expect(lifecycle.isParcelRequestClosed('queued')).toBe(true);
  expect(lifecycle.isParcelRequestClosed('new')).toBe(false);
});

test('accept and decline mark requests closed without emitting a withdrawal message', async () => {
  const closed = jest.fn();
  const showRequest = jest.fn();
  lifecycle.subscribeParcelRequestClosed(closed);
  fcm.setDeliveryRequestListener(showRequest);
  lifecycle.rememberClosedParcelRequest('accepted');
  lifecycle.rememberClosedParcelRequest('declined');
  await onMessage({data: {type: 'DELIVERY_REQUEST', matchId: 'accepted'}});
  await onMessage({data: {type: 'DELIVERY_REQUEST', matchId: 'declined'}});
  expect(closed).not.toHaveBeenCalled();
  expect(showRequest).not.toHaveBeenCalled();
});

test('opening a withdrawal notification also closes a previously shown request', () => {
  const closed = jest.fn();
  lifecycle.subscribeParcelRequestClosed(closed);
  const onOpen = messaging.onNotificationOpenedApp.mock.calls[0][1];
  onOpen({data: {type: 'MATCH_CANCELLED', matchId: 'opened'}});
  expect(closed).toHaveBeenCalledWith('opened');
});

test('expiry blocks delayed alerts just like withdrawal', async () => {
  const showRequest = jest.fn();
  fcm.setDeliveryRequestListener(showRequest);
  await onMessage({data: {type: 'MATCH_EXPIRED', matchId: 'expired'}});
  await onMessage({data: {type: 'DELIVERY_REQUEST', matchId: 'expired'}});
  expect(showRequest).not.toHaveBeenCalled();
});
