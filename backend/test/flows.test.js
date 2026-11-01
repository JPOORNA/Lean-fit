// Uses a disposable database on the configured TEST cluster. SMTP and payments are mocked.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { env } = require('../dist/config/env');
const { app } = require('../dist/app');
const { User } = require('../dist/models/User');
const { DoctorSettings } = require('../dist/models/DoctorSettings');
const { Appointment } = require('../dist/models/Appointment');
const { MealLog } = require('../dist/models/MealLog');
const { DietPlan } = require('../dist/models/DietPlan');
const { Notification } = require('../dist/models/Notification');
const { OtpChallenge } = require('../dist/models/OtpChallenge');
const { OtpService } = require('../dist/services/OtpService');
const { AuthService } = require('../dist/services/AuthService');
const { PlanService } = require('../dist/services/PlanService');
const { NotificationService } = require('../dist/services/NotificationService');
const { DeliveryService } = require('../dist/services/DeliveryService');
const { razorpayClient } = require('../dist/config/razorpay');
const { TokenService } = require('../dist/services/TokenService');
let server, base, doctor, guest, session;
const deliveries = [];
let orderCounter = 0;
const originalSend = DeliveryService.send;
const originalOrder = razorpayClient.orders.create;
const request = async (path, body, token, method = 'POST') => {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json(), headers: response.headers };
};
const codeFor = challengeId => deliveries.find(d => d.key === `otp:${challengeId}`).otp;
before(async () => {
  const uri = new URL(env.mongoUri);
  if (uri.hostname !== 'cluster0.j6wvpkw.mongodb.net' || !uri.pathname.startsWith('/leanfit_test')) throw Error('Tests require the explicitly configured test cluster and database');
  await mongoose.connect(env.mongoUri, { dbName: `leanfit_test_run_${crypto.randomBytes(8).toString('hex')}`, serverSelectionTimeoutMS: 15000 });
  await Promise.all([User.init(), Appointment.init(), Notification.init(), OtpChallenge.init(), DietPlan.init()]);
  env.notificationsEnabled = true; env.razorpayKeyId = 'rzp_test_local'; env.turnstileSecretKey = '';
  DeliveryService.send = async (channel, to, subject, text, key, otp, event) => { deliveries.push({ channel, to, subject, text, key, otp, event }); };
  razorpayClient.orders.create = async data => ({ id: `order_test_${++orderCounter}`, amount: data.amount, currency: 'INR' });
  doctor = await User.create({ name: 'Test Doctor', email: 'doctor@example.test', whatsappNumber: '+919111111111', role: 'doctor', passwordHash: 'unused', timezone: 'UTC' });
  await DoctorSettings.create({ timezone: 'UTC', weeklyAvailability: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, workingHours: [{ start: '00:00', end: '23:59' }] })), defaultSlotDurationMinutes: 30, appointmentFeePaise: 50000, notificationRouting: { events: Object.fromEntries(['bookingConfirmation', 'bookingReminder', 'subscriptionExpiry', 'mealUpload'].map(event => [event, { enabled: true, emails: ['doctor@example.test'], whatsappNumbers: ['+919111111111'] }])) } });
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  DeliveryService.send = originalSend; razorpayClient.orders.create = originalOrder;
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.db && mongoose.connection.name.startsWith('leanfit_test_run_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('guest booking requires contacts, verifies ownership, pays, then links to registration', async () => {
  const settings = await request('/booking/settings', undefined, undefined, 'GET');
  assert.equal(settings.status, 200); assert.deepEqual(Object.keys(settings.body.settings).sort(), ['appointmentFeePaise', 'timezone']);
  const now = new Date(); now.setUTCDate(now.getUTCDate() + 2); now.setUTCHours(10, 0, 0, 0);
  const end = new Date(now.getTime() + 30 * 60000);
  const details = { name: 'Guest Client', email: 'guest@example.test', whatsappNumber: '+919222222222', timezone: 'UTC', startTime: now.toISOString(), endTime: end.toISOString(), acceptedPolicies: true };
  assert.equal((await request('/booking', details)).status, 400);
  const challenge = await OtpService.request(details.whatsappNumber, 'whatsapp', 'booking');
  assert.equal((await request('/booking', { ...details, whatsappNumber: '', challengeId: challenge.challengeId, code: codeFor(challenge.challengeId) })).status, 400);
  assert.equal((await request('/booking', { ...details, whatsappNumber: '+919555555555', challengeId: challenge.challengeId, code: codeFor(challenge.challengeId) })).status, 400);
  const result = await request('/booking', { ...details, challengeId: challenge.challengeId, code: codeFor(challenge.challengeId) });
  assert.equal(result.status, 201, JSON.stringify(result.body)); session = result.body;
  guest = await User.findOne({ email: details.email }); assert.equal(guest.isGuest, true);
  const appointment = await Appointment.findOne({ userId: guest._id }); assert.equal(appointment.paymentStatus, 'pending');
  assert.equal((await request('/appointments/me', undefined, session.bookingToken, 'GET')).status, 401);
  assert.equal((await request('/booking/verify', { bookingToken: session.bookingToken, orderId: session.order.id, paymentId: 'pay_test_1', signature: '0'.repeat(64) })).status, 400);
  const signature = crypto.createHmac('sha256', env.razorpayKeySecret).update(`${session.order.id}|pay_test_1`).digest('hex');
  const payment = await request('/booking/verify', { bookingToken: session.bookingToken, orderId: session.order.id, paymentId: 'pay_test_1', signature });
  assert.equal(payment.status, 200); assert.equal((await Appointment.findById(appointment._id)).paymentStatus, 'paid');
  await assert.rejects(() => AuthService.register({ ...details, password: 'newpassword123', role: 'user' }), /Verify your WhatsApp/);
  const registration = await OtpService.request(details.whatsappNumber, 'whatsapp', 'register');
  await assert.rejects(() => AuthService.register({ ...details, whatsappNumber: '+919555555555', password: 'newpassword123', role: 'user', challengeId: registration.challengeId, code: codeFor(registration.challengeId) }), /WhatsApp number from your previous bookings/);
  const registered = await AuthService.register({ ...details, password: 'newpassword123', role: 'user', challengeId: registration.challengeId, code: codeFor(registration.challengeId) });
  assert.equal(registered._id.toString(), guest.id); assert.equal(await User.countDocuments({ email: details.email }), 1);
  assert.equal(await Appointment.countDocuments({ userId: registered._id }), 1);
});

test('existing account guest bookings keep the same identity and do not overwrite details', async () => {
  const challenge = await OtpService.request('+919222222222', 'whatsapp', 'booking').catch(async () => {
    await OtpChallenge.updateOne({ identifier: '+919222222222', purpose: 'booking' }, { $set: { createdAt: new Date(Date.now() - 61000) } });
    return OtpService.request('+919222222222', 'whatsapp', 'booking');
  });
  const start = new Date(); start.setUTCDate(start.getUTCDate() + 3); start.setUTCHours(11, 0, 0, 0);
  const result = await request('/booking', { name: 'Changed name', email: 'Guest@Example.Test', whatsappNumber: '+919222222222', timezone: 'UTC', startTime: start.toISOString(), endTime: new Date(start.getTime() + 1800000).toISOString(), acceptedPolicies: true, challengeId: challenge.challengeId, code: codeFor(challenge.challengeId) });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  assert.equal(await User.countDocuments({ email: 'guest@example.test' }), 1);
  assert.equal((await User.findById(guest._id)).name, 'Guest Client');
  assert.equal(await Appointment.countDocuments({ userId: guest._id }), 2);
});

test('registration requires WhatsApp ownership for new accounts and refuses email codes', async () => {
  const details = { name: 'New Client', email: 'new@example.test', whatsappNumber: '+919666666666', password: 'newpassword123', role: 'user' };
  await assert.rejects(() => AuthService.register(details), /Verify your WhatsApp/);
  assert.equal((await request('/auth/otp/request', { identifier: details.email, channel: 'email', purpose: 'register' })).status, 400);
  assert.equal((await request('/auth/otp/request', { identifier: details.email, channel: 'email', purpose: 'booking' })).status, 400);
  const result = await request('/auth/otp/request', { identifier: details.whatsappNumber, channel: 'whatsapp', purpose: 'register' });
  assert.equal(result.status, 200);
  const delivery = deliveries.find(d => d.key === `otp:${result.body.challengeId}`);
  assert.equal(delivery.channel, 'whatsapp'); assert.equal(delivery.to, details.whatsappNumber);
  await assert.rejects(() => AuthService.register({ ...details, whatsappNumber: '+919777777777', challengeId: result.body.challengeId, code: delivery.otp }), /Invalid or expired/);
  const registered = await AuthService.register({ ...details, challengeId: result.body.challengeId, code: delivery.otp });
  assert.equal(registered.whatsappNumber, details.whatsappNumber);
  await assert.rejects(() => OtpService.consume(result.body.challengeId, delivery.otp, 'register', details.whatsappNumber, 'whatsapp'), /Invalid or expired/);
});

test('diet plans support more than four active plans', async () => {
  for (let i = 0; i < 7; i++) await PlanService.assignDietPlan(doctor.id, guest.id, { name: `Plan ${i}`, fileUrl: 'http://localhost:4000/uploads/test.pdf' });
  assert.equal((await PlanService.listDietPlansForUser(guest.id)).length, 7);
});

test('OTP expiry, attempt limits, single use and purpose binding', async () => {
  const phone = '+919444444444';
  let challenge = await OtpService.request(phone, 'whatsapp', 'booking');
  await assert.rejects(() => OtpService.consume(challenge.challengeId, codeFor(challenge.challengeId), 'register'));
  await OtpChallenge.updateOne({ challengeId: challenge.challengeId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  await assert.rejects(() => OtpService.consume(challenge.challengeId, codeFor(challenge.challengeId), 'booking'));
  await OtpChallenge.deleteMany({ identifier: phone });
  challenge = await OtpService.request(phone, 'whatsapp', 'booking');
  for (let i = 0; i < 5; i++) await assert.rejects(() => OtpService.consume(challenge.challengeId, '000000', 'booking'));
  await assert.rejects(() => OtpService.consume(challenge.challengeId, codeFor(challenge.challengeId), 'booking'));
  await OtpChallenge.deleteMany({ identifier: phone });
  challenge = await OtpService.request(phone, 'whatsapp', 'booking');
  await OtpService.consume(challenge.challengeId, codeFor(challenge.challengeId), 'booking');
  await assert.rejects(() => OtpService.consume(challenge.challengeId, codeFor(challenge.challengeId), 'booking'));
});

test('notifications reach doctor and client, deduplicate, respect preferences and retry', async () => {
  const now = new Date();
  await Appointment.updateOne({ userId: guest._id, paymentStatus: 'paid' }, { $set: { startTime: new Date(now.getTime() + 30 * 60000), endTime: new Date(now.getTime() + 60 * 60000) } });
  await User.updateOne({ _id: guest._id }, { $set: { clientExpiresAt: new Date(now.getTime() + 86400000) } });
  await NotificationService.schedule(now); const count = await Notification.countDocuments();
  await NotificationService.schedule(now); assert.equal(await Notification.countDocuments(), count);
  for (const id of [guest._id, doctor._id]) {
    assert.equal(await Notification.countDocuments({ userId: id, event: 'bookingConfirmation' }), 2);
    assert.equal(await Notification.countDocuments({ userId: id, event: 'bookingReminder' }), 2);
  }
  assert.equal(await Notification.countDocuments({ userId: guest._id, event: 'subscriptionExpiry' }), 2);
  await NotificationService.mealUploaded(guest.id, 'test-meal-1');
  assert.equal(await Notification.countDocuments({ userId: doctor._id, event: 'mealUpload' }), 2);
  assert.ok((await Notification.findOne({ userId: doctor._id, event: 'mealUpload' })).text.includes(`/doctor/clients/${guest.id}`));
  assert.ok((await Notification.findOne({ userId: guest._id, event: 'subscriptionExpiry' })).text.includes('/contact'));
  const doctorToken = TokenService.signAccessToken(doctor.id);
  const preferences = { email: true, whatsapp: false, bookingConfirmation: true, bookingReminder: true, subscriptionExpiry: true, mealUpload: false, bookingReminderMinutes: 30, subscriptionReminderDays: 2 };
  assert.equal((await request('/profile/notifications', preferences, doctorToken, 'PUT')).status, 200);
  const routing = (await request('/doctor-settings/notification-recipients', undefined, doctorToken, 'GET')).body.routing;
  for (const rule of Object.values(routing.events)) rule.whatsappNumbers = [];
  routing.events.mealUpload.enabled = false;
  assert.equal((await request('/doctor-settings/notification-recipients', routing, doctorToken, 'PUT')).status, 200);
  DeliveryService.send = async () => { throw Error('Simulated provider failure'); };
  await NotificationService.deliver();
  assert.ok(await Notification.countDocuments({ status: 'pending', attempts: 1 }));
  assert.ok(await Notification.countDocuments({ status: 'skipped', userId: doctor._id }));
  DeliveryService.send = async (...args) => deliveries.push(args);
  await Notification.updateMany({ status: 'pending' }, { $set: { nextAttemptAt: new Date(0) } });
  await NotificationService.deliver();
  assert.ok(await Notification.countDocuments({ status: 'sent' }));
  DeliveryService.send = async (channel, to, subject, text, key, otp, event) => deliveries.push({ channel, to, subject, text, key, otp, event });
});

test('password update requires current password and revokes old access and refresh tokens', async () => {
  const login = await AuthService.login('guest@example.test', 'newpassword123');
  assert.equal((await request('/profile/password', { password: 'updatedpassword123', currentPassword: 'wrong' }, login.accessToken, 'PUT')).status, 400);
  assert.equal((await request('/profile/password', { password: 'updatedpassword123', currentPassword: 'newpassword123' }, login.accessToken, 'PUT')).status, 200);
  assert.equal((await request('/profile/notifications', undefined, login.accessToken, 'GET')).status, 401);
  assert.equal(await AuthService.refresh(login.refreshToken), null);
  assert.ok(await AuthService.login('guest@example.test', 'updatedpassword123'));
});

test('password reset can use WhatsApp, revokes sessions and cannot reuse code', async () => {
  const challenge = await OtpService.request('guest@example.test', 'whatsapp', 'reset');
  assert.equal(deliveries.find(d => d.key === `otp:${challenge.challengeId}`).to, '+919222222222');
  const result = await request('/auth/reset-password', { challengeId: challenge.challengeId, code: codeFor(challenge.challengeId), password: 'resetpassword123' });
  assert.equal(result.status, 200);
  assert.ok(await AuthService.login('guest@example.test', 'resetpassword123'));
  assert.equal((await request('/auth/reset-password', { challengeId: challenge.challengeId, code: codeFor(challenge.challengeId), password: 'badpassword123' })).status, 400);
});

test('doctor meal review includes uploaded photos for the selected day and restricts access', async () => {
  const client = await User.create({ name: 'Meal Client', email: 'meal@example.test', whatsappNumber: '+919888888888', role: 'client', passwordHash: 'unused', timezone: 'UTC' });
  const meal = await MealLog.create({ userId: client._id, imageUrl: 'https://example.test/meal.jpg', notes: 'Lunch', takenAt: new Date() });
  const date = new Date().toISOString().slice(0, 10);
  const path = `/dashboard/clients-daily-status?date=${date}`;
  const result = await request(path, undefined, TokenService.signAccessToken(doctor.id), 'GET');
  assert.equal(result.status, 200);
  assert.equal(result.body.mealStatus[client.id], true);
  const uploaded = result.body.meals.find(item => item._id === meal.id);
  assert.equal(uploaded.imageUrl, meal.imageUrl); assert.equal(uploaded.notes, 'Lunch');
  const otherDay = new Date(); otherDay.setUTCDate(otherDay.getUTCDate() - 2);
  const other = await request(`/dashboard/clients-daily-status?date=${otherDay.toISOString().slice(0, 10)}`, undefined, TokenService.signAccessToken(doctor.id), 'GET');
  assert.ok(!other.body.meals.some(item => item._id === meal.id));
  assert.equal((await request(path, undefined, TokenService.signAccessToken(client.id), 'GET')).status, 403);
});

test('contacts cannot be duplicated or linked across different accounts', async () => {
  const details = { name: 'Duplicate Contact', email: 'another@example.test', whatsappNumber: '+919222222222', password: 'password123', role: 'user', challengeId: crypto.randomUUID(), code: '123456' };
  await assert.rejects(() => AuthService.register(details), error => error.code === 'WHATSAPP_EXISTS');
  const start = new Date(Date.now() + 4 * 86400000);
  const booking = await request('/booking', { ...details, timezone: 'UTC', startTime: start.toISOString(), endTime: new Date(start.getTime() + 1800000).toISOString(), acceptedPolicies: true });
  assert.equal(booking.status, 409); assert.equal(booking.body.code, 'WHATSAPP_EXISTS');
  assert.equal(await User.countDocuments({ email: details.email }), 0);
  const client = await User.findOne({ email: 'meal@example.test' });
  const profile = await request('/profile', { whatsappNumber: '+91 92222 22222' }, TokenService.signAccessToken(client.id), 'PATCH');
  assert.equal(profile.status, 409); assert.equal(profile.body.code, 'WHATSAPP_EXISTS');
  assert.equal((await User.findById(client._id)).whatsappNumber, '+919888888888');
  await assert.rejects(() => User.create({ name: 'Duplicate Email', email: ' GUEST@EXAMPLE.TEST ', whatsappNumber: '+919999999991', passwordHash: 'unused' }), error => error.code === 'EMAIL_EXISTS');
  const concurrent = await Promise.allSettled(['race-a@example.test', 'race-b@example.test'].map(email => User.create({ name: 'Race Client', email, whatsappNumber: '+919999999992', passwordHash: 'unused' })));
  assert.equal(concurrent.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(await User.countDocuments({ whatsappNumber: '+919999999992' }), 1);
});

test('legacy duplicate WhatsApp numbers stay separate and cannot be linked', async () => {
  const phone = '+919999999993';
  await User.collection.insertMany(['legacy-a@example.test', 'legacy-b@example.test'].map(email => ({ name: 'Legacy Client', email, whatsappNumber: phone, passwordHash: 'unused', role: 'user', isGuest: true, isActive: true })));
  await assert.rejects(() => AuthService.register({ name: 'Legacy Client', email: 'legacy-a@example.test', whatsappNumber: phone, password: 'password123', role: 'user', challengeId: crypto.randomUUID(), code: '123456' }), error => error.code === 'WHATSAPP_EXISTS');
  const start = new Date(Date.now() + 5 * 86400000);
  const booking = await request('/booking', { name: 'Legacy Client', email: 'legacy-a@example.test', whatsappNumber: phone, timezone: 'UTC', startTime: start.toISOString(), endTime: new Date(start.getTime() + 1800000).toISOString(), challengeId: crypto.randomUUID(), code: '123456', acceptedPolicies: true });
  assert.equal(booking.status, 409); assert.equal(booking.body.code, 'WHATSAPP_EXISTS');
  assert.equal(await User.countDocuments({ whatsappNumber: phone, isGuest: true }), 2);
});

test('SMTP reuses one bounded TLS pool and closes it on shutdown', async () => {
  const nodemailer = require('nodemailer'); const create = nodemailer.createTransport;
  let created = 0, closed = 0, sent = 0, verified = 0;
  const sentMessages = [];
  const previous = { smtpHost: env.smtpHost, emailFrom: env.emailFrom, smtpUser: env.smtpUser, smtpPassword: env.smtpPassword };
  env.smtpHost = 'smtp.example.test'; env.emailFrom = 'Leanfit <notify@example.test>'; env.smtpUser = 'test'; env.smtpPassword = 'test';
  nodemailer.createTransport = options => {
    created++; assert.equal(options.pool, true); assert.equal(options.maxConnections, 3);
    assert.equal(options.tls.rejectUnauthorized, true); assert.equal(options.requireTLS, true);
    return { verify: async () => { verified++; }, sendMail: async message => { sent++; sentMessages.push(message); return { accepted: [message.to] }; }, close: () => { closed++; } };
  };
  try {
    await DeliveryService.verify();
    await Promise.all(Array.from({ length: 5 }, (_, i) => originalSend('email', 'test@example.test', 'Booking <test>', `Join meeting: https://leanfit.example.test/meeting/room-${i}`, `smtp-${i}`)));
    assert.equal(created, 1); assert.equal(verified, 1); assert.equal(sent, 5);
    assert.ok(sentMessages.every(message => message.html.includes('<a href="https://leanfit.example.test/meeting/room-')));
    assert.ok(sentMessages.every(message => message.html.includes('Booking &lt;test&gt;')));
    assert.ok(sentMessages.every(message => message.text.startsWith('Join meeting: https://')));
    DeliveryService.close(); assert.equal(closed, 1);
  } finally { nodemailer.createTransport = create; Object.assign(env, previous); }
});

test('WhatsApp sends event and authentication templates with bounded requests', async () => {
  const previousFetch = global.fetch;
  const previous = { whatsappToken: env.whatsappToken, whatsappPhoneId: env.whatsappPhoneId, whatsappLanguage: env.whatsappLanguage, whatsappOtpLanguage: env.whatsappOtpLanguage };
  env.whatsappToken = 'test-token'; env.whatsappPhoneId = '123'; env.whatsappLanguage = 'en'; env.whatsappOtpLanguage = 'en_US';
  process.env.WHATSAPP_OTP_TEMPLATE = 'test_auth'; process.env.WHATSAPP_TEMPLATE_MEALUPLOAD = 'test_meal';
  process.env.WHATSAPP_TEMPLATE_BOOKINGREMINDER = 'test_reminder';
  const requests = [];
  global.fetch = async (url, options) => { requests.push({ url, ...options, body: JSON.parse(options.body) }); return { ok: true }; };
  try {
    await originalSend('whatsapp', '+919222222222', 'Code', 'Code text', 'otp-test', '123456');
    await originalSend('whatsapp', '+919111111111', 'Meal', 'A client uploaded a meal.', 'meal-test', undefined, 'mealUpload');
    await originalSend('whatsapp', '+919222222222', 'Reminder', 'Join meeting: https://leanfit.example.test/meeting/room-1', 'reminder-test', undefined, 'bookingReminder');
    assert.equal(requests[2].body.template.name, 'test_reminder');
    assert.match(requests[2].body.template.components[0].parameters[0].text, /Join meeting: https:\/\/leanfit.example.test\/meeting\/room-1/);
    assert.match(requests[0].url, /graph.facebook.com\/v\d+\.\d+\/123\/messages$/);
    assert.equal(requests[0].body.to, '919222222222'); assert.ok(requests[0].signal);
    assert.equal(requests[0].body.template.name, 'test_auth');
    assert.equal(requests[0].body.template.language.code, 'en_US');
    assert.equal(requests[0].body.template.components[1].type, 'button');
    assert.equal(requests[1].body.template.name, 'test_meal');
    assert.equal(requests[1].body.template.language.code, 'en');
    assert.equal(requests[1].body.template.components[0].parameters[0].text, 'A client uploaded a meal.');
  } finally { global.fetch = previousFetch; Object.assign(env, previous); delete process.env.WHATSAPP_OTP_TEMPLATE; delete process.env.WHATSAPP_TEMPLATE_MEALUPLOAD; delete process.env.WHATSAPP_TEMPLATE_BOOKINGREMINDER; }
});

test('development uploads stay local and can load across localhost ports', async () => {
  const { uploadToR2, deleteFromR2, deleteMultipleFromR2 } = require('../dist/utils/r2Upload');
  const { r2Client } = require('../dist/config/r2');
  const fs = require('node:fs/promises'); const path = require('node:path');
  const send = r2Client.send; let remoteCalls = 0;
  r2Client.send = async () => { remoteCalls++; throw Error('Production storage must not be touched'); };
  env.localUploads = true;
  let filename;
  try {
    const url = await uploadToR2({ buffer: Buffer.from('local test file'), mimetype: 'application/pdf', originalname: 'integration.pdf' }, 'plans');
    filename = path.basename(url);
    assert.equal(await fs.readFile(path.join(env.localUploadDir, filename), 'utf8'), 'local test file');
    const response = await fetch(base.replace('/api', '') + '/uploads/' + filename);
    assert.equal(response.status, 200); assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin');
    await deleteFromR2('https://cdn.lean-fit.in/existing.pdf');
    await deleteMultipleFromR2(['https://cdn.lean-fit.in/existing.pdf']);
    assert.equal(remoteCalls, 0);
  } finally { r2Client.send = send; if (filename) await fs.unlink(path.join(env.localUploadDir, filename)); }
});

test('password recovery accepts email or phone independently of the OTP delivery channel', async () => {
  const { otpRequestSchema } = require('../dist/validators/auth');
  for (const [index, [lookup, channel]] of [['email', 'email'], ['email', 'whatsapp'], ['phone', 'email'], ['phone', 'whatsapp']].entries()) {
    const email = `recovery-${index}@example.test`, phone = `+91988888888${index}`;
    const user = await User.create({ name: 'Recovery Test', email, whatsappNumber: phone, passwordHash: 'unused', role: 'user', isActive: true });
    const identifier = lookup === 'email' ? `  ${email.toUpperCase()}  ` : `+91 (${phone.slice(3, 8)}) ${phone.slice(8)}`;
    const { body } = otpRequestSchema.parse({ body: { identifier, channel, purpose: 'reset' } });
    const challenge = await OtpService.request(body.identifier, body.channel, body.purpose);
    const delivery = deliveries.find(item => item.key === `otp:${challenge.challengeId}`);
    assert.equal(delivery.channel, channel);
    assert.equal(delivery.to, channel === 'email' ? email : phone);
    assert.equal((await OtpChallenge.findOne({ challengeId: challenge.challengeId })).userId.toString(), user.id);
    const reset = await request('/auth/reset-password', { challengeId: challenge.challengeId, code: delivery.otp, password: 'recoveredpassword123' });
    assert.equal(reset.status, 200);
    assert.ok(await AuthService.login(email, 'recoveredpassword123'));
    await assert.rejects(() => OtpService.request(lookup === 'email' ? phone : email, channel, 'reset'), error => error.code === 'OTP_RATE_LIMIT');
  }
});

test('recovery does not select unknown or shared phone accounts and rejects invalid identifiers', async () => {
  const { otpRequestSchema } = require('../dist/validators/auth');
  const beforeCount = deliveries.length;
  for (const identifier of ['+919999999993', '+919000000000']) {
    const result = await OtpService.request(identifier, 'email', 'reset');
    assert.ok(result.challengeId);
  }
  assert.equal(deliveries.length, beforeCount);
  assert.throws(() => otpRequestSchema.parse({ body: { identifier: 'not a contact', channel: 'whatsapp', purpose: 'reset' } }));
});

test('individual and group reminders include meeting links for both recipients and channels, including pending jobs', async () => {
  await DoctorSettings.updateOne({}, { $set: { 'notificationRouting.events.bookingReminder.whatsappNumbers': ['+919111111111'] } });
  const { GroupSessionSlot } = require('../dist/models/GroupSessionSlot');
  const { appointmentMeetingLink, groupMeetingLink } = require('../dist/utils/notificationLinks');
  await User.updateMany({ _id: { $in: [doctor._id, guest._id] } }, { $set: {
    'notificationPreferences.email': true, 'notificationPreferences.whatsapp': true,
    'notificationPreferences.bookingReminder': true, 'notificationPreferences.bookingReminderMinutes': 60
  } });
  const now = new Date();
  const slot = await GroupSessionSlot.create({ doctorId: doctor._id, startTime: new Date(now.getTime() + 45 * 60000), endTime: new Date(now.getTime() + 75 * 60000), pricePaise: 10000, maxPeople: 5, bookedUserIds: [guest._id] });
  await NotificationService.schedule(now);
  const groupJobs = await Notification.find({ groupSessionId: slot._id, event: 'bookingReminder' });
  assert.equal(groupJobs.length, 4);
  assert.ok(groupJobs.every(job => job.text.includes(`Join meeting: ${groupMeetingLink(slot.id)}`)));
  const appointment = await Appointment.findOne({ userId: guest._id, paymentStatus: 'paid' });
  const individualJobs = await Notification.find({ appointmentId: appointment._id, event: 'bookingReminder' });
  assert.equal(individualJobs.length, 4);
  assert.ok(individualJobs.every(job => job.text.includes(`Join meeting: ${appointmentMeetingLink(appointment)}`)));
  await Notification.updateMany({ groupSessionId: slot._id, event: 'bookingReminder' }, { $set: { text: 'Previously queued reminder.', status: 'pending', nextAttemptAt: new Date(0), attempts: 0 } });
  const original = DeliveryService.send, sent = [];
  DeliveryService.send = async (channel, to, subject, text, key) => sent.push({ channel, to, text, key });
  try {
    await NotificationService.deliver();
    const reminders = sent.filter(message => groupJobs.some(job => job.key === message.key));
    assert.equal(reminders.length, 4);
    assert.ok(reminders.every(message => message.text.includes(`Join meeting: ${groupMeetingLink(slot.id)}`)));
    const replacement = await User.create({ name: 'Replacement Doctor', email: 'replacement@example.test', whatsappNumber: '+919777777777', passwordHash: 'unused', role: 'doctor' });
    await Appointment.updateOne({ _id: appointment._id }, { $set: { doctorId: replacement._id } });
    await Notification.updateMany({ appointmentId: appointment._id, userId: doctor._id, event: 'bookingReminder' }, { $set: { status: 'pending', attempts: 0, nextAttemptAt: new Date(0) } });
    sent.length = 0;
    await NotificationService.deliver();
    assert.equal(await Notification.countDocuments({ appointmentId: appointment._id, userId: doctor._id, event: 'bookingReminder', status: 'skipped' }), 2);
    assert.ok(!sent.some(message => individualJobs.some(job => job.userId.toString() === doctor.id && job.key === message.key)));
  } finally { DeliveryService.send = original; }
});

test('doctor routing supports independent recipient lists, disables queued delivery and never falls back to profile contacts', async () => {
  const { doctorNotificationDefaults } = require('../dist/models/DoctorSettings');
  const doctorToken = TokenService.signAccessToken(doctor.id);
  const clientToken = TokenService.signAccessToken(guest.id, (await User.findById(guest._id)).authVersion || 0);
  const path = '/doctor-settings/notification-recipients';
  const settings = await DoctorSettings.findOne();
  const originalRouting = settings.notificationRouting;
  const originalPreferences = (await User.findById(doctor._id)).notificationPreferences;
  const sent = [];
  const send = DeliveryService.send;
  DeliveryService.send = async (channel, to) => sent.push({ channel, to });
  try {
    await DoctorSettings.updateOne({}, { $unset: { notificationRouting: 1 } });
    let result = await request(path, undefined, doctorToken, 'GET');
    assert.equal(result.status, 200);
    for (const rule of Object.values(result.body.routing.events)) assert.deepEqual(rule, { enabled: false, emails: [], whatsappNumbers: [] });
    await NotificationService.enqueue(doctor, 'mealUpload', 'disabled-meal', 'Meal', 'Photo uploaded');
    assert.equal(await Notification.countDocuments({ key: /^disabled-meal/ }), 0);
    assert.equal((await request(path, undefined, clientToken, 'GET')).status, 403);
    assert.equal((await request(path, doctorNotificationDefaults(), clientToken, 'PUT')).status, 403);
    await User.updateOne({ _id: doctor._id }, { $set: { 'notificationPreferences.email': false, 'notificationPreferences.whatsapp': false, 'notificationPreferences.mealUpload': false } });
    const routing = doctorNotificationDefaults();
    routing.events.mealUpload = { enabled: true, emails: ['OPS@example.test', ' ops@example.test ', 'backup@example.test'], whatsappNumbers: ['+919123456781', '+91 91234 56781', '+919123456782'] };
    result = await request(path, routing, doctorToken, 'PUT');
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.deepEqual(result.body.routing.events.mealUpload.emails, ['ops@example.test', 'backup@example.test']);
    assert.deepEqual(result.body.routing.events.mealUpload.whatsappNumbers, ['+919123456781', '+919123456782']);
    const currentDoctor = await User.findById(doctor._id);
    await NotificationService.enqueue(currentDoctor, 'mealUpload', 'routed-meal', 'Meal', 'Photo uploaded');
    await NotificationService.enqueue(currentDoctor, 'mealUpload', 'routed-meal', 'Meal', 'Photo uploaded');
    assert.equal(await Notification.countDocuments({ key: /^routed-meal/ }), 4);
    // Old queued doctor jobs must never use the doctor's profile contacts.
    const legacy = await Notification.create({ key: 'legacy-doctor-profile', userId: doctor._id, event: 'mealUpload', channel: 'email', subject: 'Legacy', text: 'Old notification' });
    const changed = result.body.routing;
    changed.events.mealUpload.emails = ['ops@example.test']; changed.events.mealUpload.whatsappNumbers = ['+919123456781'];
    assert.equal((await request(path, changed, doctorToken, 'PUT')).status, 200);
    await NotificationService.deliver();
    assert.equal((await Notification.findById(legacy._id)).status, 'skipped');
    assert.equal(await Notification.countDocuments({ key: /^routed-meal/, status: 'sent' }), 2);
    assert.equal(await Notification.countDocuments({ key: /^routed-meal/, status: 'skipped' }), 2);
    assert.deepEqual(sent.map(item => item.to).sort(), ['+919123456781', 'ops@example.test'].sort());
    await NotificationService.enqueue(currentDoctor, 'mealUpload', 'turned-off-meal', 'Meal', 'Photo uploaded');
    changed.events.mealUpload.enabled = false;
    assert.equal((await request(path, changed, doctorToken, 'PUT')).status, 200);
    await NotificationService.deliver();
    assert.equal(await Notification.countDocuments({ key: /^turned-off-meal/, status: 'skipped' }), 2);
    const status = await request(path, undefined, doctorToken, 'GET');
    assert.ok(status.body.deliveryStatus.some(item => item.event === 'mealUpload' && item.channel === 'whatsapp'));
    assert.ok(status.body.deliveryStatus.every(item => !('recipientAddress' in item) && !('userId' in item)));
    assert.equal(sent.length, 2);
    changed.events.mealUpload = { enabled: true, emails: [], whatsappNumbers: [] };
    assert.equal((await request(path, changed, doctorToken, 'PUT')).status, 400);
    changed.events.mealUpload.emails = ['invalid-email'];
    assert.equal((await request(path, changed, doctorToken, 'PUT')).status, 400);
    changed.events.mealUpload.emails = ['ops@example.test']; changed.events.mealUpload.whatsappNumbers = ['9123456781'];
    assert.equal((await request(path, changed, doctorToken, 'PUT')).status, 400);
    const subscriber = await User.findById(guest._id);
    const expiryRouting = doctorNotificationDefaults();
    expiryRouting.events.subscriptionExpiry = { enabled: true, emails: ['renewals@example.test'], whatsappNumbers: [] };
    assert.equal((await request(path, expiryRouting, doctorToken, 'PUT')).status, 200);
    await NotificationService.enqueue(currentDoctor, 'subscriptionExpiry', 'routed-expiry', 'Expiry', 'Client subscription expiring', { subscriptionUserId: guest._id, subscriptionExpiryAt: subscriber.clientExpiresAt });
    await NotificationService.deliver();
    assert.equal((await Notification.findOne({ key: /^routed-expiry/ })).status, 'sent');
    assert.equal(sent.at(-1).to, 'renewals@example.test');
  } finally {
    DeliveryService.send = send;
    await DoctorSettings.updateOne({}, { $set: { notificationRouting: originalRouting } });
    await User.updateOne({ _id: doctor._id }, { $set: { notificationPreferences: originalPreferences } });
  }
});

test('WhatsApp template failures report the template and language without exposing credentials', async () => {
  const previousFetch = global.fetch;
  const previous = { whatsappToken: env.whatsappToken, whatsappPhoneId: env.whatsappPhoneId, whatsappLanguage: env.whatsappLanguage };
  const template = process.env.WHATSAPP_TEMPLATE_MEALUPLOAD;
  env.whatsappToken = 'private-test-token'; env.whatsappPhoneId = '123'; env.whatsappLanguage = 'en_US';
  process.env.WHATSAPP_TEMPLATE_MEALUPLOAD = 'test_meal';
  global.fetch = async () => ({ ok: false, status: 404, json: async () => ({ error: { code: 132001, message: 'Untrusted provider detail' } }) });
  try {
    await assert.rejects(() => originalSend('whatsapp', '+919123456781', 'Meal', 'Meal uploaded', 'template-error-test', undefined, 'mealUpload'), error => {
      assert.equal(error.code, 'WHATSAPP_DELIVERY_FAILED');
      assert.match(error.message, /Meta 132001/);
      assert.match(error.message, /test_meal/); assert.match(error.message, /en_US/);
      assert.ok(!error.message.includes(env.whatsappToken));
      return true;
    });
  } finally {
    global.fetch = previousFetch; Object.assign(env, previous);
    if (template === undefined) delete process.env.WHATSAPP_TEMPLATE_MEALUPLOAD;
    else process.env.WHATSAPP_TEMPLATE_MEALUPLOAD = template;
  }
});

test('shared doctor recipients receive one meal alert even with multiple active doctors and old duplicate jobs', async () => {
  const { doctorNotificationDefaults } = require('../dist/models/DoctorSettings');
  const saved = (await DoctorSettings.findOne()).notificationRouting;
  const routing = doctorNotificationDefaults();
  routing.events.mealUpload = { enabled: true, emails: [], whatsappNumbers: ['+919111111111', '+919777777777'] };
  const original = DeliveryService.send, sent = [];
  DeliveryService.send = async (channel, to, subject, text, key) => sent.push({ channel, to, key });
  try {
    await DoctorSettings.updateOne({}, { $set: { notificationRouting: routing } });
    assert.ok(await User.countDocuments({ role: 'doctor', isActive: true }) >= 2);
    await Promise.all([NotificationService.mealUploaded(guest.id, 'multi-doctor-meal'), NotificationService.mealUploaded(guest.id, 'multi-doctor-meal')]);
    assert.equal(await Notification.countDocuments({ key: /^meal:multi-doctor-meal:/ }), 2);
    await NotificationService.deliver();
    const mealSent = sent.filter(item => item.key.startsWith('meal:multi-doctor-meal:'));
    assert.equal(mealSent.length, 2); assert.equal(new Set(mealSent.map(item => item.to)).size, 2);
    const doctors = await User.find({ role: 'doctor', isActive: true }).limit(2);
    for (const person of doctors) for (const number of routing.events.mealUpload.whatsappNumbers) {
      const hash = crypto.createHash('sha256').update(number).digest('hex');
      await Notification.create({ key: `meal:legacy-duplicate-meal:${person.id}:whatsapp:${hash}`, userId: person._id, doctorRecipient: true, recipientAddress: number, event: 'mealUpload', channel: 'whatsapp', subject: 'Meal', text: 'Uploaded' });
    }
    await NotificationService.deliver();
    const legacySent = sent.filter(item => item.key.startsWith('meal:legacy-duplicate-meal:'));
    assert.equal(legacySent.length, 2); assert.equal(new Set(legacySent.map(item => item.to)).size, 2);
    assert.equal(await Notification.countDocuments({ key: /^meal:legacy-duplicate-meal:/, status: 'skipped' }), 2);
  } finally { DeliveryService.send = original; await DoctorSettings.updateOne({}, { $set: { notificationRouting: saved } }); }
});

test('all notification events deduplicate the same destination across doctor and client copies', async () => {
  const { doctorNotificationDefaults } = require('../dist/models/DoctorSettings');
  const saved = (await DoctorSettings.findOne()).notificationRouting;
  const client = await User.findById(guest._id);
  const profilePreferences = client.notificationPreferences;
  const routing = doctorNotificationDefaults();
  for (const rule of Object.values(routing.events)) Object.assign(rule, { enabled: true, emails: [client.email], whatsappNumbers: [client.whatsappNumber] });
  const original = DeliveryService.send, sent = [];
  DeliveryService.send = async (channel, to, subject, text, key) => sent.push({ channel, to, key });
  try {
    await DoctorSettings.updateOne({}, { $set: { notificationRouting: routing } });
    client.notificationPreferences = { ...client.notificationPreferences, email: true, whatsapp: true, bookingConfirmation: true, bookingReminder: true, subscriptionExpiry: true, mealUpload: true };
    await client.save();
    for (const event of ['bookingConfirmation', 'bookingReminder', 'subscriptionExpiry', 'mealUpload']) {
      const key = `cross-role:${event}`;
      // Separate queue copies intentionally target the same addresses for the same event.
      await NotificationService.enqueue(doctor, event, key, 'Alert', 'Notification');
      await NotificationService.enqueue(client, event, key, 'Alert', 'Notification');
      assert.equal(await Notification.countDocuments({ eventKey: key }), 4);
      await NotificationService.deliver();
      const delivered = sent.filter(item => item.key.startsWith(`${key}:`));
      assert.equal(delivered.length, 2, event);
      assert.equal(delivered.filter(item => item.channel === 'email').length, 1, event);
      assert.equal(delivered.filter(item => item.channel === 'whatsapp').length, 1, event);
      assert.equal(await Notification.countDocuments({ eventKey: key, status: 'skipped' }), 2, event);
    }
  } finally {
    DeliveryService.send = original;
    await DoctorSettings.updateOne({}, { $set: { notificationRouting: saved } });
    await User.updateOne({ _id: client._id }, { $set: { notificationPreferences: profilePreferences } });
  }
});
