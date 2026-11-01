const { test } = require('node:test');
const assert = require('node:assert/strict');
const { notificationEmailHtml, includeMeetingLink } = require('../dist/utils/notificationLinks');

test('notification email links are clickable while user content is escaped', () => {
  const html = notificationEmailHtml('<Reminder>', 'Client <img src=x onerror=alert(1)> Join meeting: https://example.test/meeting/room?a=1&b=2');
  assert.match(html, /<a href="https:\/\/example.test\/meeting\/room\?a=1&amp;b=2"/);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;Reminder&gt;'));
  const unsafe = notificationEmailHtml('Reminder', 'javascript:alert(1)');
  assert.ok(!unsafe.includes('<a'));
});
test('refreshing a queued reminder does not duplicate its meeting URL', () => {
  const url = 'https://example.test/meeting/group-123';
  assert.equal(includeMeetingLink(includeMeetingLink('Reminder.', url), url), `Reminder. Join meeting: ${url}`);
});
