# Local testing

The root `.env` points at the requested Atlas cluster's **leanfit_test** database. The source database was read only during the copy. All 15 collections were copied with their indexes, with source/destination record counts checked. Existing images and PDFs retain their URLs; new development uploads go to `.local-uploads/`. Development deletion never removes production R2 objects. Local JWT and bootstrap secrets are independent from production.

Run in separate terminals from this repository:

```sh
cd backend
npm run dev
```

```sh
cd frontend
npm run dev
```

- Website: http://localhost:3000
- Direct booking: http://localhost:3000/book
- Password recovery: http://localhost:3000/forgot-password
- API: http://localhost:4000/api
- API documentation: http://localhost:4000/docs

The backend reads the repository-root `.env` even when started inside `backend/`. Next.js reads `frontend/.env.local`. Both files are ignored by Git. See the checked-in `.env.example` files for configuration names. Local cookies use `SameSite=Lax`; production secure cookies retain `SameSite=None`.

## Payments

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the root `.env`, and the same public key in `frontend/.env.local`. Both test and live keys are supported in development. The public checkout receives its public key from the server. Live keys process real payments and refunds. Automated integration tests mock Razorpay and do not make real transactions.

## SMTP and Meta WhatsApp

Notifications are currently disabled (`NOTIFICATIONS_ENABLED=false`) so copied users cannot receive accidental test messages. Configure providers before enabling delivery. OTP requests return an explicit unavailable error while delivery is disabled; codes are never returned to the browser or written to logs.

SMTP needs `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, and `EMAIL_MESSAGE_DOMAIN`. For port 465 use `SMTP_SECURE=true`; port 587 uses mandatory STARTTLS. TLS certificates are verified. One shared Nodemailer transport reuses up to three connections, recycles after 100 messages per connection, and has connection/greeting/socket timeouts. Startup checks the configured transport and warns if email configuration is incomplete or unavailable; the API and WhatsApp remain available. Graceful shutdown stops the worker, waits for active delivery, and closes the pool. `EMAIL_MESSAGE_DOMAIN` supplies the domain in stable message IDs; use your sender's domain.

Meta needs `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, a supported `WHATSAPP_API_VERSION`, the notification language in `WHATSAPP_TEMPLATE_LANGUAGE` (`en`), and the verification-code language in `WHATSAPP_OTP_TEMPLATE_LANGUAGE` (`en_US`). Create and approve templates, then set their exact names:

| Variable | Template shape |
| --- | --- |
| `WHATSAPP_OTP_TEMPLATE` | Authentication template: one body parameter (the OTP), and one URL button parameter with the same code, button index 0 |
| `WHATSAPP_TEMPLATE_BOOKINGCONFIRMATION` | Utility template: one body parameter (the booking message) |
| `WHATSAPP_TEMPLATE_BOOKINGREMINDER` | Utility template: one body parameter (the reminder message) |
| `WHATSAPP_TEMPLATE_SUBSCRIPTIONEXPIRY` | Utility template: one body parameter (the expiry message) |
| `WHATSAPP_TEMPLATE_MEALUPLOAD` | Utility template: one body parameter (the meal-upload message) |

Template names are customizable in the root `.env`:

```env
WHATSAPP_OTP_TEMPLATE=leanfit_verification_code
WHATSAPP_TEMPLATE_BOOKINGCONFIRMATION=leanfit_booking_confirmation
WHATSAPP_TEMPLATE_BOOKINGREMINDER=leanfit_booking_reminder
WHATSAPP_TEMPLATE_SUBSCRIPTIONEXPIRY=leanfit_subscription_expiry
WHATSAPP_TEMPLATE_MEALUPLOAD=leanfit_meal_upload
```

Replace any value with the exact name approved in your Meta account, then restart the backend. These are environment defaults: a nonempty doctor dashboard template override takes precedence. Clear that override to use the `.env` value.

An example utility body is `Leanfit update: {{1}}`. Approval and classification remain controlled by Meta. Use test recipients/a test WhatsApp sender while validating delivery. SMTP and Meta delivery still need real credentials and an end-to-end provider check.

Reference: [Nodemailer pooled SMTP](https://nodemailer.com/smtp/pooled), [Meta template messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates).

## Notification behavior

A worker runs once a minute while the API is running. In a PM2 application only instance `0` polls the queue; the other instances still enqueue jobs through API requests. Standalone Node also runs the worker. Set `NOTIFICATION_WORKER_ENABLED=false` to disable polling on an API deployment, or `NOTIFICATION_WORKER_INSTANCE_VAR` when PM2 uses a custom instance variable. Paid future one-to-one appointments and group bookings notify both the doctor and attendee. Subscription reminders use the expiry date regardless of the user's current role, including users downgraded after expiry. A meal upload queues doctor notifications. Reminder time defaults to 60 minutes before a booking and 3 days before expiry.

Clients and users choose their email/WhatsApp channels, event types and reminder timing under **Profile → Notification settings**. Doctor alert recipients and timing are managed separately under **Doctor → Settings**. OTP requests use the explicitly selected channel regardless of these preferences. Accounts missing legacy WhatsApp numbers are prompted to complete their profile; new registrations and direct bookings require a valid email and international WhatsApp number.

The MongoDB `notifications` collection stores independent jobs per event, recipient and channel. Jobs have unique deduplication keys, atomic delivery leases, up to five attempts, and exponential backoff. The worker rechecks preferences, account status, cancellations, reschedules and renewed subscriptions before delivery. Failed jobs retain a bounded error message for diagnosis. SMTP or Meta acceptance is recorded as sent; this is not proof the recipient read the message. A process crash after provider acceptance but before saving the result can cause a retry; SMTP message IDs stay stable.

## Doctor notification recipients

Doctor alerts use **Doctor Settings → Doctor notification recipients**, independently of the doctor's profile contacts and personal preferences. Each event (booking confirmation, booking reminder, subscription expiry, meal upload) has an on/off switch and separate email/WhatsApp recipient lists. Empty channel lists send nothing through that channel. New or unconfigured rules default to off; no profile contacts are copied automatically. Reminder timing is set in the same section. Client notification preferences and OTP delivery are unchanged.

Recipients are normalized and deduplicated per event/channel. Each queued doctor notification records its intended address. Shared meal/subscription alerts are enqueued once per configured destination, regardless of the number of active doctor accounts. All event types claim a unique event/channel/address delivery key before contacting a provider, preventing duplicate doctor/client copies and concurrent worker sends. Legacy duplicate shared alerts are skipped. Delivery rechecks the current rules, so removing an address or switching an event off skips queued messages to that address. Legacy queued doctor jobs without an explicit recipient are skipped. Use **Refresh delivery status** in Doctor Settings to inspect the latest email/WhatsApp attempts. Provider failures identify missing or unavailable WhatsApp templates and their configured language; a failed WhatsApp attempt does not automatically add or email another recipient. Client subscription expiry notices to the doctor track the client's current expiry date.

## Guest identity and passwords

Public `/book` does not require an account or password. Registration and direct bookings require a WhatsApp verification code sent to the entered international phone number; email verification is not used for these flows. Email remains the stable account identity: existing accounts keep their identity and profile; a new guest gets an internal contact record. Linking previous bookings requires verifying the WhatsApp number already stored on that email’s guest account before setting its password, retaining the same user ID, appointments and payments. Merely typing someone else's email/WhatsApp cannot claim their history. Use the same email for future bookings and registration; WhatsApp numbers cannot be reused for another email. Existing duplicate phone numbers are blocked from booking and guest linking until corrected; their accounts and histories are not merged. New contacts also have a database uniqueness constraint to prevent concurrent duplicate creation.

Password recovery accepts an account email or an international WhatsApp number. The independent OTP choice sends a 6-digit code to the email or WhatsApp number already stored on that account. Shared legacy phone numbers do not select an account, and email/phone aliases share the same resend cooldown. Codes last 10 minutes, allow five attempts, are single use, are bound to their purpose and contact, and are HMAC-hashed in MongoDB. Sends have a one-minute per-contact cooldown and an IP rate limit. Password updates require the current password. Both update/reset revoke existing access and refresh sessions and require signing in again.

## Verification

```sh
cd backend
npm run test:integration
```

The integration suite refuses any MongoDB hostname except the designated test cluster and a `leanfit_test` configuration. It creates its own randomly named database, mocks payment/email/WhatsApp providers, and removes only that disposable database afterward. It never changes the copied `leanfit_test` records.

```sh
cd frontend
npm run build
```

Next.js needs network access on a cold build to fetch the configured Google Fonts. The pre-existing duplicated About page with committed merge-conflict markers was resolved; its two copies differed only by trailing whitespace.

## Links in notifications

Meal-upload notifications link to the client’s review page; subscription-expiry messages link to the contact page. Booking confirmations and reminders include a `Join meeting:` link for the doctor and attendee, for both individual and group sessions. Email contains HTML links plus a plain-text fallback; WhatsApp includes the URL in the existing template body parameter, so no additional template variables or URL buttons are required. Pending jobs also have their meeting link refreshed at delivery; cancelled or rescheduled bookings still fail the existing validity checks.

Set `FRONTEND_URL` in the root `.env` to the public website address when deploying (for example, `https://lean-fit.in`). Local development uses `http://localhost:3000`; localhost links can only be opened on the development machine. The setting falls back to `CORS_ORIGIN` when omitted.
