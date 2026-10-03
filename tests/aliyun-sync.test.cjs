'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm'), fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../surge/aliyun-sync.js'), 'utf8');
const account = { userId: '123', userName: '测试用户', avatar: '', token: 'session=private-cookie;' };
async function run({ remote = [], local = [account], capture = false, configured = true } = {}) {
  const store = new Map([['aliyunWeb_data', JSON.stringify(local)]]);
  if (configured) for (const [key, value] of Object.entries({ qinglong_iqiyi_url: 'https://ql.example.com', qinglong_iqiyi_client_id: 'fake-id', qinglong_iqiyi_client_secret: 'private-secret' })) store.set(key, value);
  const calls = [], logs = [], notifications = [];
  let doneCount = 0;
  await new Promise(resolve => {
    const http = {};
    for (const method of ['get', 'post', 'put']) http[method] = (opts, callback) => {
      calls.push({ method, ...opts });
      const data = opts.url.includes('/auth/token') ? { token: 'access-token' } : method === 'get' ? remote : {};
      callback(null, { status: 200 }, JSON.stringify({ code: 200, data }));
    };
    const context = {
      console: { log: value => logs.push(value) },
      $persistentStore: { read: key => store.get(key), write: (value, key) => { store.set(key, value); return true; } },
      $httpClient: http, $notification: { post: (...args) => notifications.push(args) },
      $done: () => { doneCount++; resolve(); }
    };
    if (capture) {
      context.$request = { url: 'https://developer.aliyun.com/developer/api/my/user/getUser', headers: { cookie: account.token } };
      context.$response = { body: JSON.stringify({ data: { userId: '123', nickname: '测试用户', avatar: '' } }) };
    } else context.$request = {};
    vm.runInNewContext(source, context);
  });
  assert.equal(doneCount, 1);
  const output = JSON.stringify({ logs, notifications });
  assert.ok(!output.includes('private-cookie'));
  assert.ok(!output.includes('private-secret'));
  return { calls, store, notifications };
}
test('Aliyun capture creates Qinglong JSON variable with shared credentials', async () => {
  const result = await run({ local: [], capture: true });
  const payload = JSON.parse(result.calls[2].body)[0];
  assert.equal(payload.name, 'aliyunWeb_data');
  assert.equal(JSON.parse(payload.value)[0].token, account.token);
});
test('Aliyun sync preserves other remote accounts and updates matching nickname', async () => {
  const remoteAccounts = [{ userId: '测试用户', userName: '测试用户', token: 'old;' }, { userId: '456', token: 'other;' }];
  const result = await run({ remote: [{ id: 8, name: 'aliyunWeb_data', value: JSON.stringify(remoteAccounts) }] });
  const updated = JSON.parse(JSON.parse(result.calls[2].body).value);
  assert.equal(updated.length, 2);
  assert.equal(updated[0].token, account.token);
  assert.equal(updated[1].token, 'other;');
});
test('Aliyun capture saves locally before configuration is provided', async () => {
  const result = await run({ local: [], capture: true, configured: false });
  assert.equal(result.calls.length, 0);
  assert.equal(JSON.parse(result.store.get('aliyunWeb_data'))[0].token, account.token);
});
test('Aliyun sync refuses ambiguous target variables', async () => {
  const result = await run({ remote: [1, 2].map(id => ({ id, name: 'aliyunWeb_data', value: '[]' })) });
  assert.equal(result.calls.length, 2);
  assert.match(result.notifications[0][2], /多个/);
});
