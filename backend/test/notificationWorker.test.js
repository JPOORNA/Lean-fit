const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shouldRunNotificationWorker } = require('../dist/services/NotificationWorkerPolicy');

test('PM2 enables only instance zero and supports an explicit off switch', () => {
  assert.equal(shouldRunNotificationWorker({ NODE_APP_INSTANCE: '0' }), true);
  assert.equal(shouldRunNotificationWorker({ NODE_APP_INSTANCE: '1' }), false);
  assert.equal(shouldRunNotificationWorker({ NODE_APP_INSTANCE: '2' }), false);
  assert.equal(shouldRunNotificationWorker({ NODE_APP_INSTANCE: 'unexpected' }), false);
  assert.equal(shouldRunNotificationWorker({}), true);
  assert.equal(shouldRunNotificationWorker({ NOTIFICATION_WORKER_ENABLED: 'false' }), false);
  assert.equal(shouldRunNotificationWorker({ NODE_APP_INSTANCE: '0', NOTIFICATION_WORKER_ENABLED: 'false' }), false);
  assert.equal(shouldRunNotificationWorker({ NOTIFICATION_WORKER_INSTANCE_VAR: 'INSTANCE_ID', INSTANCE_ID: '0' }), true);
  assert.equal(shouldRunNotificationWorker({ NOTIFICATION_WORKER_INSTANCE_VAR: 'INSTANCE_ID', INSTANCE_ID: '1' }), false);
});

test('only the PM2 leader starts the actual scheduler and delivery loop', async () => {
  const { env } = require('../dist/config/env');
  const { NotificationService, startNotificationWorker, stopNotificationWorker } = require('../dist/services/NotificationService');
  const original = { enabled: env.notificationsEnabled, schedule: NotificationService.schedule, deliver: NotificationService.deliver };
  const keys = ['NODE_APP_INSTANCE', 'NOTIFICATION_WORKER_ENABLED', 'NOTIFICATION_WORKER_INSTANCE_VAR'];
  const variables = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  let scheduled = 0, delivered = 0;
  NotificationService.schedule = async () => { scheduled++; };
  NotificationService.deliver = async () => { delivered++; };
  env.notificationsEnabled = true;
  delete process.env.NOTIFICATION_WORKER_ENABLED; delete process.env.NOTIFICATION_WORKER_INSTANCE_VAR;
  try {
    process.env.NODE_APP_INSTANCE = '1'; startNotificationWorker();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(scheduled, 0); assert.equal(delivered, 0);
    process.env.NODE_APP_INSTANCE = '0'; startNotificationWorker(); startNotificationWorker();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(scheduled, 1); assert.equal(delivered, 1);
    await stopNotificationWorker();
    startNotificationWorker();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(scheduled, 2); assert.equal(delivered, 2);
    await stopNotificationWorker();
    process.env.NOTIFICATION_WORKER_ENABLED = 'false'; startNotificationWorker();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(scheduled, 2);
  } finally {
    await stopNotificationWorker();
    env.notificationsEnabled = original.enabled;
    NotificationService.schedule = original.schedule; NotificationService.deliver = original.deliver;
    for (const key of keys) { if (variables[key] === undefined) delete process.env[key]; else process.env[key] = variables[key]; }
  }
});
