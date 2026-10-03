'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { parseCookie, request } = require('../iQIYI.js');
const cookie = 'P00001=test-token; P00003=12345; __dfp=device_123;';
const source = fs.readFileSync(require.resolve('../surge/iqiyi-sync.js'), 'utf8');
async function runSync({ rows = [], capture, credentials = true, status = 200, disabled = false } = {}) {
  const store = new Map([['CookieQY', cookie]]);
  if (credentials) {
    store.set('qinglong_iqiyi_url', 'https://ql.example.com/');
    store.set('qinglong_iqiyi_client_id', 'example-id');
    store.set('qinglong_iqiyi_client_secret', 'example-secret');
  }
  const calls = [], notices = [], logs = [];
  let doneCount = 0;
  await new Promise((resolve, reject) => {
    const http = {};
    for (const method of ['get', 'put', 'post']) http[method] = (opts, cb) => {
      calls.push({ method, ...opts });
      let data = {};
      if (opts.url.includes('/auth/token')) data = { token: 'example-token' };
      else if (method === 'get') data = rows;
      cb(null, { status }, JSON.stringify({ code: 200, data }));
    };
    const context = {
      console: { log: message => logs.push(message) },
      $persistentStore: { read: key => store.get(key), write: (value, key) => { store.set(key, value); return true; } },
      $httpClient: http,
      $notification: { post: (...args) => notices.push(args) },
      $done: () => { doneCount++; resolve(); }
    };
    if (capture) context.$request = capture;
    try { vm.runInNewContext(source, context); } catch (err) { reject(err); }
  });
  assert.equal(doneCount, 1);
  assert.ok(!JSON.stringify(notices).includes('example-secret'));
  assert.ok(!JSON.stringify(notices).includes(cookie));
  assert.ok(!JSON.stringify(logs).includes('example-secret'));
  assert.ok(!JSON.stringify(logs).includes(cookie));
  assert.ok(calls.every(c => c['auto-redirect'] === false));
  return { calls, notices, store, logs };
}
test('Cookie handles trailing/no trailing semicolon and missing fields', () => {
  assert.equal(parseCookie(cookie).__dfp, 'device_123');
  assert.equal(parseCookie(cookie.slice(0, -1)).P00003, '12345');
  assert.throws(() => parseCookie('P00001=token;'), /缺少/);
});
test('Node transport rejects unapproved destinations without network', async () => {
  for (const url of ['https://iqiyi.com.attacker.test', 'http://iqiyi.com']) {
    await new Promise(resolve => request(url, (err, response) => {
      assert.ok(err); assert.equal(response, null); resolve();
    }));
  }
});
test('new account creates an environment variable using array payload', async () => {
  const { calls } = await runSync();
  assert.equal(calls.length, 3);
  assert.equal(calls[2].method, 'post');
  assert.deepEqual(JSON.parse(calls[2].body), [{ name: 'IQIYI_COOKIE', value: cookie, remarks: 'Surge iQIYI' }]);
});
test('existing account updates by ID and preserves remarks', async () => {
  const { calls } = await runSync({ rows: [{ id: 42, name: 'IQIYI_COOKIE', value: 'old', remarks: '我的账号' }] });
  assert.equal(calls[2].method, 'put');
  assert.equal(JSON.parse(calls[2].body).id, 42);
  assert.equal(JSON.parse(calls[2].body).remarks, '我的账号');
});
test('unchanged Cookie skips upload and notifications', async () => {
  const result = await runSync({ rows: [{ id: 42, name: 'IQIYI_COOKIE', value: cookie }] });
  assert.equal(result.calls.length, 2);
  assert.equal(result.notices.length, 0);
});
test('ambiguous duplicate variables cannot be overwritten', async () => {
  const result = await runSync({ rows: [1, 2].map(id => ({ id, name: 'IQIYI_COOKIE', value: 'old' })) });
  assert.equal(result.calls.length, 2);
  assert.match(result.notices[0][2], /多个/);
});
test('duplicate variables select exactly one marked account', async () => {
  const result = await runSync({ rows: [{ id: 1, name: 'IQIYI_COOKIE', value: 'old' }, { id: 2, name: 'IQIYI_COOKIE', value: 'old', remarks: 'Surge iQIYI' }] });
  assert.equal(JSON.parse(result.calls[2].body).id, 2);
});
test('disabled environment variable remains untouched', async () => {
  const result = await runSync({ rows: [{ id: 1, name: 'IQIYI_COOKIE', value: 'old', status: 1 }] });
  assert.equal(result.calls.length, 2);
  assert.match(result.notices[0][2], /禁用/);
});
test('captured Cookie is saved even before Qinglong configuration', async () => {
  const updated = cookie.replace('test-token', 'new-token');
  const result = await runSync({ credentials: false, capture: { url: 'https://passport.iqiyi.com/apis/user/info.action', headers: { cOoKiE: updated } } });
  assert.equal(result.calls.length, 0);
  assert.equal(result.store.get('CookieQY'), updated);
});
test('HTTP errors stop synchronization without secret disclosures', async () => {
  const result = await runSync({ status: 401 });
  assert.equal(result.calls.length, 1);
  assert.match(result.notices[0][2], /401/);
});

test('empty Qinglong environment reports a specific reason without credentials', () => {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, [require.resolve('../iQIYI.js')], {
    env: { ...process.env, IQIYI_COOKIE: '' }, encoding: 'utf8'
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /未读取到 IQIYI_COOKIE/);
});
test('manual Surge run writes actionable diagnostic to console', async () => {
  const result = await runSync({ credentials: false });
  assert.ok(result.logs.some(line => line.includes('请在 BoxJS 填写')));
});

test('manual run with placeholder request synchronizes stored Cookie', async () => {
  for (const capture of [{}, { url: '' }, { url: 'https://example.com', headers: { Cookie: 'unrelated=private' } }]) {
    const result = await runSync({ capture });
    assert.equal(result.calls.length, 3);
    assert.equal(JSON.parse(result.calls[2].body)[0].value, cookie);
    assert.equal(result.store.get('CookieQY'), cookie);
    assert.ok(!JSON.stringify(result.logs).includes('unrelated=private'));
  }
});

test('Cookie accepts punctuation without imposing undocumented token formats', () => {
  const fields = parseCookie('P00001=token.with+symbols/and=padding&x; P00003=user-123; __dfp=device-id@version;');
  assert.equal(fields.P00001, 'token.with+symbols/and=padding&x');
  assert.equal(fields.P00003, 'user-123');
  assert.equal(fields.__dfp, 'device-id@version');
  assert.throws(() => parseCookie('P00001=bad\r\nvalue; P00003=123; __dfp=device;'), /控制字符/);
});
test('query encoding preserves special characters without adding parameters', () => {
  const { encodeQuery } = require('../iQIYI.js');
  const params = { authCookie: 'token+/.=&injected=true', userId: 'user-123' };
  const result = new URLSearchParams(encodeQuery(params));
  assert.deepEqual(Object.fromEntries(result), params);
  assert.equal(result.has('injected'), false);
});

test('Cookie accepts P00010 fallback and either fingerprint field', () => {
  assert.equal(parseCookie('P00001=token; P00010=123; dfp=device;').P00003, '123');
  assert.equal(parseCookie('P00001=token; P00003=123; dfp=device;').__dfp, 'device');
  assert.equal(parseCookie('P00001=token; P00003=123;').__dfp, '');
});
test('notification uses Qinglong helper and redacts credentials', async () => {
  const { sendSummary } = require('../iQIYI.js');
  const delivered = [];
  const loader = () => ({ sendNotify: async (...args) => delivered.push(args) });
  loader.resolve = path => path;
  await sendSummary('测试', `结果包含 ${cookie} 和 test-token`, false, [cookie], loader);
  assert.equal(delivered.length, 1);
  assert.ok(!delivered[0][1].includes(cookie));
  assert.ok(!delivered[0][1].includes('test-token'));
});
test('notification modes support all, errors and off', async () => {
  const { sendSummary } = require('../iQIYI.js');
  const previous = process.env.IQIYI_NOTIFY;
  let delivered = 0;
  const loader = () => ({ sendNotify: async () => delivered++ });
  loader.resolve = path => path;
  try {
    process.env.IQIYI_NOTIFY = 'errors';
    await sendSummary('测试', '成功', false, [], loader);
    assert.equal(delivered, 0);
    await sendSummary('测试', '失败', true, [], loader);
    assert.equal(delivered, 1);
    process.env.IQIYI_NOTIFY = 'off';
    await sendSummary('测试', '失败', true, [], loader);
    assert.equal(delivered, 1);
  } finally {
    if (previous === undefined) delete process.env.IQIYI_NOTIFY;
    else process.env.IQIYI_NOTIFY = previous;
  }
});
test('multi-account runs continue after failure and send one combined notification', async () => {
  const { main } = require('../iQIYI.js');
  const before = process.env.IQIYI_COOKIE;
  const beforeExit = process.exitCode;
  const seen = [], notifications = [];
  process.env.IQIYI_COOKIE = 'first-cookie\nsecond-cookie';
  try {
    await main({
      runner: async value => {
        seen.push(value);
        if (value === 'first-cookie') throw new Error('private details');
        return { text: '签到成功', failed: false };
      },
      notifier: async (...args) => notifications.push(args)
    });
    assert.deepEqual(seen, ['first-cookie', 'second-cookie']);
    assert.equal(notifications.length, 1);
    assert.match(notifications[0][1], /账号 1/);
    assert.match(notifications[0][1], /账号 2/);
    assert.ok(!notifications[0][1].includes('private details'));
    assert.equal(notifications[0][2], true);
  } finally {
    if (before === undefined) delete process.env.IQIYI_COOKIE;
    else process.env.IQIYI_COOKIE = before;
    process.exitCode = beforeExit;
  }
});

test('Surge refuses to replace a multiline multi-account variable', async () => {
  const result = await runSync({ rows: [{ id: 1, name: 'IQIYI_COOKIE', value: `${cookie}\n${cookie}` }] });
  assert.equal(result.calls.length, 2);
  assert.match(result.notices[0][2], /多账号/);
});

test('mocked full run isolates accounts and signs encoded web/API requests', async () => {
  const { EventEmitter } = require('node:events');
  const calls = [], pushes = [];
  const httpsMock = { request(url, options, callback) {
    const req = new EventEmitter();
    req.destroy = error => { req.emit('error', error); req.emit('close'); };
    req.end = body => {
      calls.push({ url, options, body });
      queueMicrotask(() => {
        const res = new EventEmitter();
        res.statusCode = 200;
        res.setEncoding = () => {};
        let data = {};
        if (url.hostname === 'cards.iqiyi.com') data = { text: '2027年1月1日到期' };
        else if (url.pathname === '/openApi/task/execute') data = { code: 'A00000', data: { code: 'A0000', data: { rewards: [{ rewardType: 1, rewardCount: 1 }], signDays: 2 } } };
        else if (url.pathname === '/openApi/score/add') data = { code: 'A00000', data: [{ code: 'A0000', score: 1, continuousValue: 2 }] };
        else if (url.pathname === '/openApi/task/complete') data = { code: 'A00000' };
        else if (url.pathname === '/openApi/score/getReward') data = { code: 'A00000', data: { score: 1 } };
        else if (url.hostname === 'iface2.iqiyi.com') data = { title: '抽奖', kv: { code: 'Q00702' } };
        else if (url.pathname.endsWith('queryUserTask')) data = { code: 'A00000', data: { tasks: {} } };
        callback(res);
        res.emit('data', JSON.stringify(data));
        res.emit('end');
        req.emit('close');
      });
    };
    return req;
  } };
  const environment = { IQIYI_COOKIE: 'P00001=first+token;P00003=1;dfp=first-device;\nP00001=second/token;P00010=2;__dfp=second-device;', IQIYI_WEB_TASKS: '1' };
  const context = {
    require: name => name === 'node:https' ? httpsMock : require(name),
    module: { exports: {} }, process: { env: environment }, URL,
    console: { log() {}, error() {}, warn() {} },
    setTimeout: (fn, delay) => setTimeout(fn, delay >= 20000 ? delay : 0), clearTimeout
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../iQIYI.js'), 'utf8'), context);
  await context.module.exports.main({ notifier: async (...args) => pushes.push(args) });
  const signins = calls.filter(call => call.url.pathname === '/openApi/task/execute');
  assert.equal(signins.length, 2);
  assert.deepEqual(signins.map(call => call.url.searchParams.get('authCookie')), ['first+token', 'second/token']);
  assert.deepEqual(signins.map(call => JSON.parse(call.body).natural_month_sign.dfp), ['first-device', 'second-device']);
  const web = calls.filter(call => call.url.pathname === '/openApi/score/add');
  assert.equal(web.length, 2);
  assert.deepEqual(web.map(call => call.url.searchParams.get('dfp')), ['first-device', 'second-device']);
  assert.ok([...web, ...signins].every(call => /^[a-f0-9]{32}$/.test(call.url.searchParams.get('sign'))));
  assert.equal(calls.filter(call => call.url.hostname === 'iface2.iqiyi.com').length, 2);
  assert.equal(pushes.length, 1);
  assert.equal(pushes[0][2], false);
});
