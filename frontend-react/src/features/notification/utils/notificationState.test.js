import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countUnread,
  markNotificationRead,
  toastReducer,
} from './notificationState.js';

test('adds and removes toasts without mutating previous queues', () => {
  const initial = Object.freeze([{ id: 'existing', message: 'Saved', type: 'success' }]);

  const added = toastReducer(initial, {
    type: 'add',
    toast: { id: 'new', message: 'Updated', type: 'info' },
  });
  const removed = toastReducer(added, { type: 'remove', id: 'existing' });

  assert.deepEqual(initial, [{ id: 'existing', message: 'Saved', type: 'success' }]);
  assert.deepEqual(added.map(({ id }) => id), ['existing', 'new']);
  assert.deepEqual(removed.map(({ id }) => id), ['new']);
  assert.notEqual(added, initial);
  assert.notEqual(removed, added);
});

test('marks only the selected notification read using immutable copies', () => {
  const first = Object.freeze({ id: 'first', read: false, message: 'Order created' });
  const second = Object.freeze({ id: 'second', read: false, message: 'Payment received' });
  const notifications = Object.freeze([first, second]);

  const updated = markNotificationRead(notifications, 'first');

  assert.equal(updated[0].read, true);
  assert.equal(updated[1], second);
  assert.equal(first.read, false);
  assert.notEqual(updated, notifications);
  assert.notEqual(updated[0], first);
});

test('counts unread notifications defensively', () => {
  assert.equal(countUnread([{ read: false }, { read: true }, { read: false }]), 2);
  assert.equal(countUnread(undefined), 0);
});