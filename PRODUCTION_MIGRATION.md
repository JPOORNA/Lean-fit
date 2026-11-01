# Production rollout: current Leanfit schema

Production was audited read-only on 1 November 2026 against the last committed application version (`c8b7383`). No production migration or data writes were performed.

The read-only audit found legacy contact conflicts that must remain separate. The migration reports current counts, duplicate contacts and index blockers without printing credentials or contact values. Re-run the audit during rollout because production remains live; audit-specific account/payment totals are not stored in this guide.

## What changes

The migration fills only missing `users.authVersion`, `users.isGuest`, `users.notificationPreferences`, `doctorsettings.whatsappTemplates`, and `doctorsettings.notificationRouting` fields. Existing values, IDs, passwords, roles, contact details, expiry dates, availability, prices, bookings, payments, plan assignments, and file URLs are preserved. It creates the new notification/OTP collections through their required indexes and records completion in `_schema_migrations`.

Legacy accounts are not marked with `contactIdentityVersion: 1`. This lets existing duplicate phone records remain separate while the current app rejects ambiguous contact linking. The partial unique index protects new/contact-modified accounts. Resolve legacy duplicates individually after confirming ownership; do not bulk merge or delete them.

New doctor routing starts **off with empty recipient lists**. Template names use production environment values when a saved override is blank. No development data, contacts, credentials, or pending notifications are copied to production.

## 1. Prepare the release and connection

Build the exact reviewed release and keep its previous release available for rollback. The migration tool is `backend/scripts/migrate-current-schema.cjs`; it uses the raw driver and never imports application models or loads the development `.env` file. Audit mode makes no writes or index changes.

From `backend/`, enter the production URI privately (zsh syntax):

```sh
read -rs 'MIGRATION_MONGO_URI?Production MongoDB URI: '
export MIGRATION_MONGO_URI
npm run db:audit
```

The report prints counts and conflict summaries, not credentials or contact values. Resolve any `blockers` before applying. The known legacy duplicate-phone warnings alone do not require deleting any data.

## 2. Stop writes and take a verified backup

Put the production site/API in maintenance mode. Stop **every API instance, notification worker, scheduled writer, and other application writing this database**. Keep them stopped through backup, migration, and verification. A database-wide dump without an oplog is not a consistent cross-collection snapshot if writes continue.

Install the MongoDB Database Tools first; `mongodump`/`mongorestore` were not installed in the development environment when this guide was prepared. Check their versions and compatibility with the Atlas cluster.

The following stores the URI in a private configuration file outside the repository so it does not appear as a command-line argument:

```sh
umask 077
export MIGRATION_BACKUP_DIR="$HOME/leanfit-production-backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$MIGRATION_BACKUP_DIR"
node - <<'NODE'
const fs = require('node:fs');
fs.writeFileSync(`${process.env.MIGRATION_BACKUP_DIR}/production.yml`,
  `uri: ${JSON.stringify(process.env.MIGRATION_MONGO_URI)}\n`,
  { mode: 0o600, flag: 'wx' });
NODE
mongodump --config="$MIGRATION_BACKUP_DIR/production.yml" \
  --gzip --archive="$MIGRATION_BACKUP_DIR/before.dump.gz"
sha256sum "$MIGRATION_BACKUP_DIR/before.dump.gz" > "$MIGRATION_BACKUP_DIR/before.dump.gz.sha256"
```

Confirm a zero exit status and a nonempty archive. Keep the archive, checksum, and audit report securely. Do not commit database backups or connection files.

## 3. Rehearse on an isolated restore

Restore the archive into a **fresh, disposable database** on the test/staging cluster, named `leanfit_migration_rehearsal`. Never restore staging data over production or an existing working development database. Match source and destination MongoDB major/feature compatibility versions.

Enter a staging URI privately and create a private Tools configuration:

```sh
read -rs 'MIGRATION_STAGING_URI?Staging URI ending in /leanfit_migration_rehearsal: '
export MIGRATION_STAGING_URI
node - <<'NODE'
const fs = require('node:fs');
fs.writeFileSync(`${process.env.MIGRATION_BACKUP_DIR}/staging.yml`,
  `uri: ${JSON.stringify(process.env.MIGRATION_STAGING_URI)}\n`,
  { mode: 0o600, flag: 'wx' });
NODE
mongorestore --config="$MIGRATION_BACKUP_DIR/staging.yml" \
  --gzip --archive="$MIGRATION_BACKUP_DIR/before.dump.gz" \
  --nsInclude='lean-fit.*' \
  --nsFrom='lean-fit.*' --nsTo='leanfit_migration_rehearsal.*'
```

Require a successful restore with no failed documents. Use a new empty rehearsal database if repeating the exercise. Compare all restored collection counts with the production audit.

Run the migration against that restored copy:

```sh
MIGRATION_MONGO_URI="$MIGRATION_STAGING_URI" npm run db:audit
MIGRATION_MONGO_URI="$MIGRATION_STAGING_URI" npm run db:migrate -- \
  --apply --confirm-db leanfit_migration_rehearsal \
  --backup-file "$MIGRATION_BACKUP_DIR/before.dump.gz" --maintenance-confirmed
```

Verify login, client histories, appointments, payments, plan/file access, and subscription dates on the rehearsal deployment with `NOTIFICATIONS_ENABLED=false` and no live payment calls. Use mocked providers for automated tests. Confirm the counts and required indexes, then run the migration again to verify zero additional backfills.

## 4. Apply to production

While production writers are still stopped, re-run the audit and use the explicit database/backup guards:

```sh
npm run db:audit
npm run db:migrate -- --apply --confirm-db lean-fit \
  --backup-file "$MIGRATION_BACKUP_DIR/before.dump.gz" --maintenance-confirmed
npm run db:audit
```

The shell's `MIGRATION_MONGO_URI` still points to production: the rehearsal commands used one-command overrides. Verify the reported database name before applying.

The tool fills only missing fields, adds required indexes, checks that existing collection counts are unchanged, and records completion. It never calls `dropDatabase`, `dropIndex`, `syncIndexes`, or an account merge. On failure, keep writers stopped; inspect the audit and rerun the idempotent migration after correcting the cause. Some additive steps may have completed before a failure.

`--backup-file` checks that a nonempty file exists. It does **not** prove that the archive is complete or restorable; step 3 is required. `--maintenance-confirmed` is an operator assertion, not a deployment shutdown command. There is no safe claim of guaranteed zero data loss without a verified backup and controlled cutover.

## 5. Deploy and configure production

Use the **production** URI and credentials in the deployment environment. Do not replace production `.env` with the development file. Set `NODE_ENV=production`; automatic Mongoose index builds are disabled there, so the migration must run before starting the new release.

Start with `NOTIFICATIONS_ENABLED=false`. Check existing accounts and histories first. Configure the intended doctor recipients per type in Doctor Settings, and verify production SMTP, WhatsApp sender/token/template names and Razorpay configuration. For the approved languages confirmed in this chat:

```env
WHATSAPP_OTP_TEMPLATE_LANGUAGE=en_US
WHATSAPP_TEMPLATE_LANGUAGE=en
```

Enable notifications only when recipient preferences and provider configuration are reviewed. Starting the worker can queue confirmations/reminders for existing future paid appointments; use controlled test recipients to validate delivery before full release. The migration itself sends no emails, WhatsApp messages, or payments.

## PM2 with two forks

The current notification implementation uses an atomic MongoDB `findOneAndUpdate` to claim a pending job, then a unique delivery-key index to arbitrate copies of the same event/channel/address. Those database safeguards remain in place if workers temporarily overlap. The current worker policy runs the scheduler and delivery poller only in PM2 instance `0`; the other instances still serve HTTP and enqueue jobs. Standalone Node without a PM2 instance variable also runs the worker. Set `NOTIFICATION_WORKER_ENABLED=false` on any deployment that must serve HTTP without polling the queue. Apply the notification indexes before deploying this implementation.

For migration, `pm2 stop <your-api-app-name>` must stop all instances of that API. Confirm both are stopped with `pm2 status` and also stop any other worker/deployment writing this database. A rolling `pm2 reload` leaves another fork serving requests, so it does not satisfy the migration maintenance requirement. Restart/reload the application after migration and verification, not during the migration.

A claimed notification has a two-minute lease. After a process crash, another worker can reclaim an expired lease (subject to the retry limit). As with most external-provider queues, this is not a guarantee of exactly-once delivery: if the provider accepts a message and the process crashes before recording success, a retry can send it again. The migration cannot make a provider call and a database update one atomic transaction. The worker gate uses `NODE_APP_INSTANCE` by default. If PM2 uses a custom `instance_var`, set `NOTIFICATION_WORKER_INSTANCE_VAR` to that name. This gate selects one worker within a PM2 application; it is not a distributed leader election across multiple servers. A crashed instance `0` must be restarted by PM2 for polling to resume.

References: [PM2 instance variables](https://pm2.keymetrics.io/docs/usage/environment/), [MongoDB atomic writes](https://www.mongodb.com/docs/v8.0/core/write-operations-atomicity/).

## Rollback

If application checks fail before reopening writes, stop the new release and roll back to the previous application release with notification delivery disabled. The added fields and new collections may remain; old code ignores them. Existing indexes are not dropped by this migration.

For database recovery, restore the verified archive to a **fresh recovery database**, verify it, and perform a controlled connection-string cutover. Do not blindly restore an old backup over a live database after new writes have resumed: that can lose new appointments, payments, or uploads. Reconcile any post-cutover writes first.

The URI shared in chat contains a production password. Rotate that database credential before the actual rollout and update the deployment's secret store.

References: [MongoDB mongodump](https://www.mongodb.com/docs/database-tools/mongodump/), [MongoDB mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/), [MongoDB unique indexes](https://www.mongodb.com/docs/v8.0/core/index-unique/), [Mongoose 8 production indexes](https://mongoosejs.com/docs/8.x/docs/guide.html#autoIndex).
