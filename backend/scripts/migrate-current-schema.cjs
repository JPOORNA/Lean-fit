#!/usr/bin/env node
'use strict';
// Uses the raw driver: importing application models could create indexes during an audit.
const { MongoClient } = require('mongoose').mongo;
const fs = require('node:fs/promises');
const MIGRATION_ID = '2026-11-notifications-contact-identities-v1';
const EVENTS = ['bookingConfirmation', 'bookingReminder', 'subscriptionExpiry', 'mealUpload'];
const preferences = { email: true, whatsapp: true, bookingConfirmation: true, bookingReminder: true, subscriptionExpiry: true, mealUpload: true, bookingReminderMinutes: 60, subscriptionReminderDays: 3 };
const routing = { events: Object.fromEntries(EVENTS.map(event => [event, { enabled: false, emails: [], whatsappNumbers: [] }])), bookingReminderMinutes: 60, subscriptionReminderDays: 3 };
const BACKFILLS = [
  ['users', 'authVersion', 0], ['users', 'isGuest', false], ['users', 'notificationPreferences', preferences],
  ['doctorsettings', 'whatsappTemplates', { otp: '', bookingConfirmation: '', bookingReminder: '', subscriptionExpiry: '', mealUpload: '' }],
  ['doctorsettings', 'notificationRouting', routing]
];
const INDEXES = [
  ['users', { email: 1 }, { name: 'email_1', unique: true }],
  ['users', { whatsappNumber: 1 }, { name: 'unique_whatsapp_identity', unique: true, partialFilterExpression: { contactIdentityVersion: 1, whatsappNumber: { $type: 'string' } } }],
  ['notifications', { key: 1 }, { name: 'key_1', unique: true }],
  ['notifications', { status: 1, nextAttemptAt: 1 }, { name: 'status_1_nextAttemptAt_1' }],
  ['notifications', { deliveryKey: 1 }, { name: 'deliveryKey_1', unique: true, sparse: true }],
  ['otpchallenges', { contactKey: 1 }, { name: 'contactKey_1', unique: true }],
  ['otpchallenges', { challengeId: 1 }, { name: 'challengeId_1', unique: true }],
  ['otpchallenges', { expiresAt: 1 }, { name: 'expiresAt_1', expireAfterSeconds: 0 }]
];
class MigrationError extends Error {}
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
const sameOptions = (existing, wanted) => ['unique', 'sparse', 'partialFilterExpression', 'expireAfterSeconds'].every(key => JSON.stringify(ordered(existing[key] ?? (key === 'unique' || key === 'sparse' ? false : null))) === JSON.stringify(ordered(wanted[key] ?? (key === 'unique' || key === 'sparse' ? false : null))));
const sameKey = (first, second) => JSON.stringify(first) === JSON.stringify(second);
async function collectionNames(db) { return (await db.listCollections({}, { nameOnly: true }).toArray()).map(item => item.name); }
async function duplicateGroups(collection, field, filter = {}) {
  const result = await collection.aggregate([{ $match: filter }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }, { $count: 'groups' }]).toArray();
  return result[0]?.groups ?? 0;
}
function addToMap(map, value) { map.set(value, (map.get(value) || 0) + 1); }
async function auditDatabase(db) {
  const names = await collectionNames(db);
  const counts = {};
  for (const name of names.filter(name => !name.startsWith('system.'))) counts[name] = await db.collection(name).countDocuments();
  const blockers = [], warnings = [], backfills = [], indexes = [];
  const emails = new Map(), phones = new Map();
  let nonCanonicalEmails = 0, nonCanonicalPhones = 0, missingPhones = 0, invalidPhones = 0;
  if (names.includes('users')) {
    for await (const user of db.collection('users').find({}, { projection: { email: 1, whatsappNumber: 1 } })) {
      if (typeof user.email === 'string') {
        const email = user.email.trim().toLowerCase();
        addToMap(emails, email);
        if (email !== user.email) nonCanonicalEmails++;
      }
      if (typeof user.whatsappNumber !== 'string' || !user.whatsappNumber.trim()) { missingPhones++; continue; }
      const phone = user.whatsappNumber.trim().replace(/[\s()-]/g, '');
      addToMap(phones, phone);
      if (phone !== user.whatsappNumber) nonCanonicalPhones++;
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) invalidPhones++;
    }
  }
  const duplicateEmails = [...emails.values()].filter(count => count > 1).length;
  const duplicatePhones = [...phones.values()].filter(count => count > 1).length;
  if (duplicateEmails) blockers.push(`${duplicateEmails} normalized email groups contain multiple accounts. Resolve explicitly before deployment.`);
  if (nonCanonicalEmails || nonCanonicalPhones) blockers.push('Non-canonical contact values need a separately reviewed normalization migration; this migration does not rewrite contact details.');
  if (duplicatePhones) warnings.push(`${duplicatePhones} legacy phone groups contain multiple accounts. They remain separate; ambiguous booking/linking is blocked by the app.`);
  if (missingPhones || invalidPhones) warnings.push(`${missingPhones} accounts have no phone and ${invalidPhones} have invalid phone formatting. Existing account data is preserved; affected contacts need manual review.`);
  if ((counts.doctorsettings || 0) > 1) blockers.push('Multiple DoctorSettings documents exist; selecting an active configuration needs explicit review.');
  const uniqueness = [
    ['users', 'email', {}],
    ['users', 'whatsappNumber', { contactIdentityVersion: 1, whatsappNumber: { $type: 'string' } }],
    ['notifications', 'key', {}], ['notifications', 'deliveryKey', { deliveryKey: { $exists: true } }],
    ['otpchallenges', 'contactKey', {}], ['otpchallenges', 'challengeId', {}]
  ];
  for (const [collection, field, filter] of uniqueness) {
    if (names.includes(collection) && await duplicateGroups(db.collection(collection), field, filter)) blockers.push(`Duplicate indexed values in ${collection}.${field}; no index will be forced and no documents will be removed.`);
  }
  for (const [collection, field] of BACKFILLS) backfills.push({ collection, field, missing: names.includes(collection) ? await db.collection(collection).countDocuments({ [field]: { $exists: false } }) : 0 });
  for (const [collection, key, options] of INDEXES) {
    const existing = names.includes(collection) ? await db.collection(collection).listIndexes().toArray() : [];
    const matching = existing.find(index => sameKey(index.key, key) && sameOptions(index, options));
    const conflicting = existing.find(index => index.name === options.name && (!sameKey(index.key, key) || !sameOptions(index, options)));
    if (conflicting) blockers.push(`Index ${collection}.${options.name} exists with different options. It will not be dropped automatically.`);
    indexes.push({ collection, name: options.name, action: matching ? 'keep' : conflicting ? 'blocked' : 'create' });
  }
  return { migration: MIGRATION_ID, database: db.databaseName, counts, contacts: { duplicateEmailGroups: duplicateEmails, duplicatePhoneGroups: duplicatePhones, nonCanonicalEmails, nonCanonicalPhones, missingPhones, invalidPhones }, backfills, indexes, warnings, blockers };
}
async function applyMigration(db, audit) {
  // Caller must enforce backup/maintenance checks. Re-audit immediately before any write.
  const current = await auditDatabase(db);
  if (current.blockers.length) throw new MigrationError('Audit has blockers; production was not migrated.');
  if (audit && audit.database !== current.database) throw new MigrationError('Audit database does not match.');
  const modified = [];
  for (const [collection, field, value] of BACKFILLS) {
    if (!(collection in current.counts)) continue;
    const result = await db.collection(collection).updateMany({ [field]: { $exists: false } }, { $set: { [field]: value } });
    modified.push({ collection, field, modified: result.modifiedCount });
  }
  // createIndex adds required indexes; syncIndexes/dropIndex/dropDatabase are never used.
  for (const [collection, key, options] of INDEXES) {
    const plan = current.indexes.find(index => index.collection === collection && index.name === options.name);
    if (plan.action === 'create') await db.collection(collection).createIndex(key, options);
  }
  const after = await auditDatabase(db);
  for (const [collection, count] of Object.entries(current.counts)) {
    if (collection === '_schema_migrations') continue;
    if (after.counts[collection] !== count) throw new MigrationError(`Record count changed in ${collection}. Keep the app stopped and investigate before reopening traffic.`);
  }
  if (after.blockers.length || after.indexes.some(index => index.action !== 'keep')) throw new MigrationError('Post-migration checks did not pass. Keep the app stopped and re-run the audit.');
  await db.collection('_schema_migrations').updateOne({ _id: MIGRATION_ID }, { $set: { completedAt: new Date(), modified, counts: after.counts }, $setOnInsert: { firstAppliedAt: new Date() } }, { upsert: true });
  return { ...after, modified, verification: 'Existing collection counts unchanged; required indexes present.' };
}
async function main() {
  const args = process.argv.slice(2);
  const value = flag => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
  const apply = args.includes('--apply');
  const allowed = new Set(['--audit', '--apply', '--confirm-db', '--backup-file', '--maintenance-confirmed']);
  for (let index = 0; index < args.length; index++) {
    if (!allowed.has(args[index])) throw new MigrationError('Unknown argument. Use --audit or --apply --confirm-db NAME --backup-file PATH --maintenance-confirmed.');
    if (args[index] === '--confirm-db' || args[index] === '--backup-file') index++;
  }
  const uri = process.env.MIGRATION_MONGO_URI;
  if (!uri) throw new MigrationError('Set MIGRATION_MONGO_URI explicitly. This tool never loads the app or development .env file.');
  const parsed = new URL(uri);
  const name = decodeURIComponent(parsed.pathname.slice(1));
  if (!name || name.includes('/') || ['admin', 'config', 'local'].includes(name)) throw new MigrationError('The URI must name the application database explicitly.');
  if (apply) {
    if (value('--confirm-db') !== name) throw new MigrationError('Apply requires --confirm-db with the exact database name.');
    if (!args.includes('--maintenance-confirmed')) throw new MigrationError('Stop all API instances, workers and other database writers, then pass --maintenance-confirmed.');
    const backup = value('--backup-file');
    const stat = backup && await fs.stat(backup).catch(() => null);
    if (!stat?.isFile() || stat.size === 0) throw new MigrationError('Apply requires --backup-file pointing to a nonempty backup archive that you have test-restored.');
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, appName: 'LeanfitSchemaAudit' });
  try {
    await client.connect();
    const db = client.db(name);
    const audit = await auditDatabase(db);
    console.log(JSON.stringify(apply ? await applyMigration(db, audit) : audit, null, 2));
    if (!apply && audit.blockers.length) process.exitCode = 2;
  } finally { await client.close(); }
}
module.exports = { auditDatabase, applyMigration, MIGRATION_ID };
if (require.main === module) main().catch(error => {
  console.error(JSON.stringify({ error: error instanceof MigrationError ? error.message : 'Migration/audit failed. Check connectivity and permissions; no application error/URI is printed to protect credentials.', code: typeof error.code === 'number' ? error.code : error.name }));
  process.exitCode = 1;
});
