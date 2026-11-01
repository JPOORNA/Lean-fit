const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { MongoClient, ObjectId } = require('mongoose').mongo;
const { env } = require('../dist/config/env');
const { auditDatabase, applyMigration } = require('../scripts/migrate-current-schema.cjs');
let client, mainDb, conflictDb;
const prefix = `leanfit_test_m_${crypto.randomBytes(6).toString('hex')}`;
before(async () => {
  const uri = new URL(env.mongoUri);
  if (uri.hostname !== 'cluster0.j6wvpkw.mongodb.net' || !uri.pathname.startsWith('/leanfit_test')) throw Error('Migration tests require the designated disposable test database configuration');
  client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
  await client.connect(); mainDb = client.db(prefix); conflictDb = client.db(`${prefix}_conflict`);
});
after(async () => {
  try { if (client) for (const db of [mainDb, conflictDb]) if (db && [prefix, `${prefix}_conflict`].includes(db.databaseName)) await db.dropDatabase(); }
  finally { await client?.close(); }
});

test('migration audit is read-only and apply preserves existing accounts, data and duplicate legacy phones', async () => {
  const users = [
    { _id: new ObjectId(), email: 'owner@example.test', whatsappNumber: '+919111111111', passwordHash: 'preserved', role: 'client', authVersion: 7, isGuest: true, notificationPreferences: { email: false }, refreshTokens: ['preserved-token-hash'] },
    { _id: new ObjectId(), email: 'a@example.test', whatsappNumber: '+919222222222', passwordHash: 'keep-a', role: 'user' },
    { _id: new ObjectId(), email: 'b@example.test', whatsappNumber: '+919222222222', passwordHash: 'keep-b', role: 'user' },
    { _id: new ObjectId(), email: 'missing-phone@example.test', passwordHash: 'keep-c', role: 'doctor' }
  ];
  await mainDb.collection('users').insertMany(users);
  const settings = { _id: new ObjectId(), timezone: 'Asia/Kolkata', appointmentFeePaise: 12345, weeklyAvailability: [{ dayOfWeek: 1, workingHours: [{ start: '09:00', end: '10:00' }] }] };
  await mainDb.collection('doctorsettings').insertOne(settings);
  const protectedCollections = ['appointments', 'payments', 'meallogs', 'dietplans', 'workoutplans', 'bodymetrics'];
  for (const collection of protectedCollections) await mainDb.collection(collection).insertOne({ _id: new ObjectId(), userId: users[0]._id, value: 'unchanged', createdAt: new Date() });
  const snapshots = Object.fromEntries(await Promise.all(protectedCollections.map(async collection => [collection, await mainDb.collection(collection).find().toArray()])));
  const namesBefore = await mainDb.listCollections({}, { nameOnly: true }).toArray();
  const indexesBefore = await mainDb.collection('users').listIndexes().toArray();
  const audit = await auditDatabase(mainDb);
  assert.equal(audit.contacts.duplicatePhoneGroups, 1); assert.equal(audit.blockers.length, 0);
  assert.deepEqual(await mainDb.listCollections({}, { nameOnly: true }).toArray(), namesBefore);
  assert.deepEqual(await mainDb.collection('users').listIndexes().toArray(), indexesBefore);
  assert.equal((await mainDb.collection('users').findOne({ _id: users[1]._id })).authVersion, undefined);
  const applied = await applyMigration(mainDb, audit);
  assert.equal(applied.blockers.length, 0); assert.ok(applied.indexes.every(index => index.action === 'keep'));
  for (const original of users) {
    const migrated = await mainDb.collection('users').findOne({ _id: original._id });
    for (const [key, value] of Object.entries(original)) assert.deepEqual(migrated[key], value, key);
    assert.equal(migrated.contactIdentityVersion, undefined);
  }
  const migratedSettings = await mainDb.collection('doctorsettings').findOne({ _id: settings._id });
  for (const [key, value] of Object.entries(settings)) assert.deepEqual(migratedSettings[key], value, key);
  for (const rule of Object.values(migratedSettings.notificationRouting.events)) assert.equal(rule.enabled, false);
  for (const collection of protectedCollections) assert.deepEqual(await mainDb.collection(collection).find().toArray(), snapshots[collection]);
  const second = await applyMigration(mainDb);
  assert.ok(second.modified.every(change => change.modified === 0));
  assert.equal(await mainDb.collection('users').countDocuments({ whatsappNumber: '+919222222222' }), 2);
  assert.equal(await mainDb.collection('_schema_migrations').countDocuments(), 1);
});

test('migration refuses conflicting contact/index data before changing documents', async () => {
  await conflictDb.collection('users').insertMany([
    { email: 'collision@example.test', whatsappNumber: '+919333333333', contactIdentityVersion: 1 },
    { email: ' COLLISION@example.test ', whatsappNumber: '+919333333333', contactIdentityVersion: 1 }
  ]);
  await conflictDb.collection('notifications').createIndex({ deliveryKey: 1 }, { name: 'deliveryKey_1' });
  const before = await conflictDb.collection('users').find().toArray();
  const audit = await auditDatabase(conflictDb);
  assert.ok(audit.blockers.some(message => message.includes('normalized email')));
  assert.ok(audit.blockers.some(message => message.includes('users.whatsappNumber')));
  assert.ok(audit.blockers.some(message => message.includes('deliveryKey_1')));
  await assert.rejects(() => applyMigration(conflictDb), /Audit has blockers/);
  assert.deepEqual(await conflictDb.collection('users').find().toArray(), before);
});

test('production startup leaves index creation to the reviewed migration', async () => {
  const mongoose = require('mongoose');
  const { connectDb } = require('../dist/config/db');
  const original = mongoose.connect, nodeEnv = env.nodeEnv;
  const observed = [];
  mongoose.connect = async (_uri, options) => { observed.push(options.autoIndex); return mongoose; };
  try {
    env.nodeEnv = 'production'; await connectDb();
    env.nodeEnv = 'development'; await connectDb();
    assert.deepEqual(observed, [false, true]);
  } finally { mongoose.connect = original; env.nodeEnv = nodeEnv; }
});

test('two worker processes cannot claim one pending job or reserve duplicate delivery identities', async () => {
  const queue = mainDb.collection('notifications');
  await queue.insertOne({ key: 'pm2-one-job', status: 'pending', attempts: 0, nextAttemptAt: new Date(0) });
  const claim = () => queue.findOneAndUpdate({ key: 'pm2-one-job', status: 'pending', attempts: { $lt: 5 }, nextAttemptAt: { $lte: new Date() } }, { $set: { status: 'sending', lockedUntil: new Date(Date.now() + 120000) }, $inc: { attempts: 1 } }, { returnDocument: 'after' });
  const claims = await Promise.all([claim(), claim()]);
  assert.equal(claims.filter(Boolean).length, 1);
  assert.equal((await queue.findOne({ key: 'pm2-one-job' })).attempts, 1);
  await queue.insertMany([{ key: 'pm2-copy-a', status: 'sending' }, { key: 'pm2-copy-b', status: 'sending' }]);
  const results = await Promise.allSettled(['pm2-copy-a', 'pm2-copy-b'].map(key => queue.updateOne({ key }, { $set: { deliveryKey: 'same-event-channel-recipient' } })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 11000);
  assert.equal(await queue.countDocuments({ deliveryKey: 'same-event-channel-recipient' }), 1);
});
