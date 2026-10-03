'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const runtime = require('../lib/aliyun-runtime.js');

test('Aliyun accepts raw Cookies, newline accounts and original BoxJS JSON', () => {
  assert.deepEqual(runtime.parseAccounts('a=1;\nb=2;').map(a => a.token), ['a=1;', 'b=2;']);
  assert.equal(runtime.parseAccounts('[{"token":"session=test;","userId":"123"}]')[0].userId, '123');
  assert.equal(runtime.parseAccounts('{"token":"session=test;"}').length, 1);
  assert.deepEqual(runtime.parseAccounts(''), []);
  assert.throws(() => runtime.parseAccounts('[{"token":""}]'), /Cookie/);
});
test('Aliyun validates phase hour and optional task switches', () => {
  runtime.validateSettings({ aliyunWeb_time: '12', aliyunWeb_scene: 'false' });
  assert.throws(() => runtime.validateSettings({ aliyunWeb_time: '24' }), /1–23/);
  assert.throws(() => runtime.validateSettings({ aliyunWeb_video: 'yes' }), /true/);
});
test('Aliyun encodes form body, preserves Cookie and blocks redirects', async () => {
  let seen;
  const result = await runtime.request({ url: 'https://developer.aliyun.com/developer/api/test', params: { q: 'a&b' }, body: { comment: '中文&a=b' }, headers: { Cookie: 'session=test;' } }, async (url, opts) => {
    seen = { url, opts };
    return { ok: true, status: 200, text: async () => '{"code":200,"data":1}' };
  });
  assert.equal(result.data, 1);
  assert.equal(seen.url.searchParams.get('q'), 'a&b');
  assert.equal(new URLSearchParams(seen.opts.body).get('comment'), '中文&a=b');
  assert.equal(seen.opts.headers.Cookie, 'session=test;');
  assert.equal(seen.opts.redirect, 'manual');
});
test('Aliyun transport returns HTML for Cheerio and rejects unexpected hosts', async () => {
  const text = await runtime.request('https://developer.aliyun.com/article/', async () => ({ ok: true, status: 200, text: async () => '<div class="test">文章</div>' }));
  const cheerio = require('cheerio');
  assert.equal(cheerio.load(text)('.test').text(), '文章');
  await assert.rejects(runtime.request('https://other.example.com', () => { throw new Error('must not send'); }), /拒绝/);
});
test('Aliyun errors do not expose Cookie through network diagnostics', async () => {
  await assert.rejects(runtime.request('https://developer.aliyun.com', async () => { throw new Error('session=private;'); }), error => error.message === '阿里云接口网络请求失败');
});
test('Aliyun system notification uses existing panel settings with redaction', async () => {
  const envBefore = process.env.aliyunWeb_data;
  const apiBefore = globalThis.QLAPI;
  let delivered;
  process.env.aliyunWeb_data = 'session=private-token;';
  globalThis.QLAPI = { systemNotify: async payload => { delivered = payload; return { code: 200 }; } };
  try {
    await runtime.notify('阿里云社区', '测试 private-token');
    assert.equal(delivered.title, '阿里云社区');
    assert.ok(!delivered.content.includes('private-token'));
  } finally {
    if (envBefore === undefined) delete process.env.aliyunWeb_data; else process.env.aliyunWeb_data = envBefore;
    globalThis.QLAPI = apiBefore;
  }
});
test('Aliyun full afternoon run collects points and exits normally without remote code', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const calls = [], notices = [];
  class MockEnv extends runtime.Env { wait() { return Promise.resolve(); } log() {} }
  const fakeRuntime = { ...runtime, Env: MockEnv,
    notify: async (title, body) => notices.push({ title, body }),
    request: async opts => {
      calls.push(opts);
      if (opts.url.includes('getUserSpaceSignInDetail')) return { data: { taskGroupId: 'group' } };
      if (opts.url.includes('assessSignInBonusQualification')) return { data: false };
      if (opts.url.includes('listUserFavor')) return { data: { list: [] } };
      return { code: '200', data: 5 };
    }
  };
  class MockDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-03T13:00:00+08:00'])); } static now() { return new Date('2026-10-03T13:00:00+08:00').getTime(); } }
  const fakeProcess = { env: { aliyunWeb_data: 'session=test;', aliyunWeb_time: '1', aliyunWeb_scene: 'false', aliyunWeb_video: 'false', aliyunWeb_stock: 'false' } };
  const context = { module: { exports: {} }, process: fakeProcess, Date: MockDate,
    console: { log() {}, error() {}, warn() {} },
    require: name => name === './lib/aliyun-runtime.js' ? fakeRuntime : require(name)
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../aliyun_web.js'), 'utf8'), context);
  await context.module.exports.run();
  assert.ok(calls.some(call => call.url.includes('receiveAllPendingScore')));
  assert.equal(notices.length, 1);
  assert.match(notices[0].body, /领取积分/);
  assert.ok(calls.every(call => !call.url.includes('github') && call.headers.Cookie === 'session=test;'));
  assert.equal(fakeProcess.exitCode, undefined);
});
