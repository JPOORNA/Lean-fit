const { test } = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../dist/app');
const db = require('../dist/config/db');
const { env } = require('../dist/config/env');
const { DeliveryService } = require('../dist/services/DeliveryService');
const worker = require('../dist/services/NotificationService');

test('API starts when optional SMTP configuration is incomplete', async () => {
  const original = { connect: db.connectDb, listen: app.listen, verify: DeliveryService.verify,
    close: DeliveryService.close, worker: worker.startNotificationWorker, warn: console.warn, log: console.log,
    smtpHost: env.smtpHost, emailFrom: env.emailFrom };
  const handlers = new Map(['SIGINT', 'SIGTERM'].map(signal => [signal, process.listeners(signal)]));
  const warnings = [];
  let connected = false, listening = false, startedWorker = false, closedTransport = false;
  db.connectDb = async () => { connected = true; };
  env.smtpHost = 'smtp.example.test'; env.emailFrom = '';
  DeliveryService.verify = async () => { throw Object.assign(new Error('SMTP is not configured'), { code: 'DELIVERY_UNAVAILABLE' }); };
  DeliveryService.close = () => { closedTransport = true; };
  worker.startNotificationWorker = () => { startedWorker = true; };
  app.listen = (port, callback) => { listening = true; callback(); return { close: callback => callback() }; };
  console.warn = message => warnings.push(message);
  console.log = () => {};
  try {
    require('../dist/server');
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(connected); assert.ok(listening); assert.ok(startedWorker); assert.ok(closedTransport);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Configure EMAIL_FROM/);
    assert.match(warnings[0], /The API will start/);
  } finally {
    db.connectDb = original.connect; app.listen = original.listen;
    DeliveryService.verify = original.verify; DeliveryService.close = original.close;
    worker.startNotificationWorker = original.worker; console.warn = original.warn; console.log = original.log;
    env.smtpHost = original.smtpHost; env.emailFrom = original.emailFrom;
    for (const [signal, previous] of handlers) {
      for (const handler of process.listeners(signal)) if (!previous.includes(handler)) process.removeListener(signal, handler);
    }
  }
});
