/*
Surge：爱奇艺 Cookie 获取 + 青龙同步
作者：llle0x；2026-10-03；GPL-3.0。
BoxJS 配置键：qinglong_iqiyi_url / qinglong_iqiyi_client_id / qinglong_iqiyi_client_secret
兼容 NobyDa 获取脚本的 CookieQY 存储键。可作为 http-request、cron 或手动脚本运行。
*/
'use strict';
const SOURCE_KEY = 'CookieQY';
const ENV_NAME = 'IQIYI_COOKIE';
const REMARK = 'Surge iQIYI';
function read(key) { return $persistentStore.read(key) || ''; }
function validCookie(value) {
  const fields = Object.fromEntries(String(value || '').split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.indexOf('=');
    return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)];
  }));
  return ['P00001', 'P00003', '__dfp'].every(key => Boolean(fields[key]));
}
function call(method, url, token, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const options = { url, headers, timeout: 15, 'auto-redirect': false };
    if (body !== undefined) options.body = JSON.stringify(body);
    $httpClient[method](options, (error, response, data) => {
      if (error || !response) return reject(new Error('无法连接青龙，请检查地址及网络'));
      const status = response.status || response.statusCode;
      if (status < 200 || status >= 300) return reject(new Error(`青龙 HTTP ${status}，请检查配置及应用权限`));
      try {
        const parsed = JSON.parse(data);
        if (parsed.code !== 200) throw new Error();
        resolve(parsed.data);
      } catch (_) { reject(new Error('青龙返回异常，请检查版本、应用凭证和环境变量权限')); }
    });
  });
}
function chooseEnv(rows) {
  if (!Array.isArray(rows)) throw new Error('环境变量列表格式异常');
  const exact = rows.filter(row => row.name === ENV_NAME);
  if (exact.length <= 1) return exact[0];
  const marked = exact.filter(row => row.remarks === REMARK);
  if (marked.length === 1) return marked[0];
  throw new Error('存在多个 IQIYI_COOKIE；请将要更新的一条备注设为 Surge iQIYI');
}
async function sync() {
  console.log('爱奇艺同步脚本 v2026.10.03.2');
  let cookie = read(SOURCE_KEY);
  if (typeof $request !== 'undefined') {
    if (!/^https:\/\/passport\.iqiyi\.com\/apis\/user\//.test($request.url)) throw new Error('捕获地址不匹配');
    const headers = $request.headers || {};
    const key = Object.keys(headers).find(k => k.toLowerCase() === 'cookie');
    cookie = key ? headers[key] : '';
    if (!validCookie(cookie)) throw new Error('捕获数据缺少关键字段，请使用 Safari 密码登录爱奇艺');
    if (!$persistentStore.write(cookie, SOURCE_KEY)) throw new Error('本地 Cookie 保存失败');
  }
  if (!validCookie(cookie)) throw new Error('没有有效的 CookieQY，请先登录爱奇艺获取');
  console.log('本地 CookieQY 的三个必需字段已齐全。');
  const base = read('qinglong_iqiyi_url').trim().replace(/\/+$/, '');
  const id = read('qinglong_iqiyi_client_id').trim();
  const secret = read('qinglong_iqiyi_client_secret').trim();
  if (!base || !id || !secret) throw new Error('Cookie 已保存在本地；请在 BoxJS 填写青龙地址和应用凭证');
  // 不允许地址中包含凭证、查询参数或片段；内网可用 HTTP，远程请用 HTTPS。
  if (!/^https?:\/\/[^\s/?#@]+(?:\/[^\s?#@]*)?$/.test(base)) throw new Error('青龙地址格式不正确，应填写面板根地址');
  console.log('青龙配置已填写，正在获取访问令牌。');
  const auth = await call('get', `${base}/open/auth/token?client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}`);
  if (!auth || !auth.token) throw new Error('未取得青龙访问令牌');
  console.log('已取得访问令牌，正在查询 IQIYI_COOKIE。');
  const rows = await call('get', `${base}/open/envs?searchValue=${ENV_NAME}`, auth.token);
  const existing = chooseEnv(rows);
  if (existing && Number(existing.status) === 1) throw new Error('目标环境变量已禁用，请在青龙中确认后启用');
  if (existing && existing.value === cookie) return 'Cookie 未变化，无需更新';
  if (existing) {
    const envId = existing.id === undefined ? existing._id : existing.id;
    if (envId === undefined) throw new Error('目标环境变量缺少 ID');
    await call('put', `${base}/open/envs`, auth.token, {
      id: envId, name: ENV_NAME, value: cookie, remarks: existing.remarks || REMARK
    });
  } else {
    await call('post', `${base}/open/envs`, auth.token, [{ name: ENV_NAME, value: cookie, remarks: REMARK }]);
  }
  return existing ? '青龙 Cookie 已更新' : '青龙 Cookie 已创建';
}
sync().then(message => {
  console.log(`同步结果：${message}`);
  // 未变化时保持安静，避免每次打开 App 都通知。
  if (message !== 'Cookie 未变化，无需更新') $notification.post('爱奇艺 → 青龙', '同步成功', message);
}).catch(error => {
  console.log(`同步未完成：${error.message}`);
  $notification.post('爱奇艺 → 青龙', '同步未完成', error.message);
}).finally(() => $done({}));
