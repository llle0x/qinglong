/* Surge：阿里云社区 Cookie 捕获与青龙同步。2026-10-03，llle0x。
使用已有 qinglong_iqiyi_url / client_id / client_secret 配置，仅需要环境变量权限。
捕获 getUser 响应，从请求头取 Cookie，从响应体取账号标识，保存为 aliyunWeb_data JSON 数组。
*/
'use strict';
const SOURCE_KEY = 'aliyunWeb_data';
const ENV_NAME = 'aliyunWeb_data';
const REMARK = 'Surge Aliyun';
function read(key) { return $persistentStore.read(key) || ''; }
function accountKey(account) { return String(account.userId || account.userName || ''); }
function parseAccounts(value) {
  let parsed;
  try { parsed = JSON.parse(value || '[]'); } catch (_) { throw new Error('aliyunWeb_data 必须为账号 JSON 数组；请使用此模块重新捕获'); }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (rows.some(a => !a || typeof a.token !== 'string' || !a.token.trim() || !accountKey(a))) throw new Error('账号数据缺少 Cookie 或账号标识');
  return rows;
}
function mergeAccounts(existing, incoming) {
  const result = existing.map(a => ({ ...a }));
  for (const account of incoming) {
    const matches = result.map((a, i) => (accountKey(a) === accountKey(account) || (a.userName && account.userName && a.userName === account.userName)) ? i : -1).filter(i => i >= 0);
    if (matches.length > 1) throw new Error('存在重复账号标识，请先整理 aliyunWeb_data');
    if (matches.length === 1) result[matches[0]] = { ...result[matches[0]], ...account };
    else result.push({ ...account });
  }
  return result;
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
  throw new Error('存在多个 aliyunWeb_data；请将要更新的一条备注设为 Surge Aliyun');
}
async function sync() {
  console.log('阿里云 Cookie 同步 v2026.10.03.1');
  const isCapture = typeof $request !== 'undefined' && $request &&
    /^https:\/\/developer\.aliyun\.com\/developer\/api\/my\/user\/getUser(?:[/?]|$)/.test($request.url || '');
  if (isCapture) {
    const headers = $request.headers || {};
    const key = Object.keys(headers).find(k => k.toLowerCase() === 'cookie');
    const token = key ? headers[key] : '';
    if (!token || /[\r\n\x00]/.test(token)) throw new Error('未获取到有效 Cookie，请打开阿里云 App 积分商城');
    let response;
    try { response = JSON.parse($response.body); } catch (_) { throw new Error('未获取到用户响应，请确认模块为 http-response 且 requires-body=true'); }
    const user = response && response.data;
    const identity = user && (user.userId || user.uid || user.nickname);
    if (!identity) throw new Error('用户响应没有账号标识；未写入 Cookie，请重新登录积分商城');
    const incoming = { userId: String(identity), userName: String(user.nickname || identity), avatar: user.avatar || '', token };
    const merged = mergeAccounts(parseAccounts(read(SOURCE_KEY)), [incoming]);
    if (!$persistentStore.write(JSON.stringify(merged), SOURCE_KEY)) throw new Error('本地账号数据保存失败');
  }
  const local = parseAccounts(read(SOURCE_KEY));
  if (!local.length) throw new Error('尚未捕获阿里云账号，请打开阿里云 App → 首页 → 积分商城');
  const base = read('qinglong_iqiyi_url').trim().replace(/\/+$/, '');
  const id = read('qinglong_iqiyi_client_id').trim();
  const secret = read('qinglong_iqiyi_client_secret').trim();
  if (!base || !id || !secret) throw new Error('Cookie 已保存；请在 BoxJS 填写共用的青龙地址和应用凭证');
  if (!/^https?:\/\/[^\s/?#@]+(?:\/[^\s?#@]*)?$/.test(base)) throw new Error('青龙地址格式不正确');
  const auth = await call('get', `${base}/open/auth/token?client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}`);
  if (!auth || !auth.token) throw new Error('未取得青龙访问令牌');
  const rows = await call('get', `${base}/open/envs?searchValue=${ENV_NAME}`, auth.token);
  const existing = chooseEnv(rows);
  if (existing && Number(existing.status) === 1) throw new Error('青龙目标变量已禁用，请确认后启用');
  const remote = existing ? parseAccounts(existing.value) : [];
  const value = JSON.stringify(mergeAccounts(remote, local));
  if (existing && JSON.stringify(remote) === value) return 'Cookie 未变化，无需更新';
  if (existing) {
    const id = existing.id === undefined ? existing._id : existing.id;
    if (id === undefined) throw new Error('青龙目标变量缺少 ID');
    await call('put', `${base}/open/envs`, auth.token, { id, name: ENV_NAME, value, remarks: existing.remarks || REMARK });
  } else {
    await call('post', `${base}/open/envs`, auth.token, [{ name: ENV_NAME, value, remarks: REMARK }]);
  }
  return '青龙 aliyunWeb_data 已更新；任务按青龙定时规则运行';
}
sync().then(message => {
  console.log(message);
  if (message !== 'Cookie 未变化，无需更新') $notification.post('阿里云 → 青龙', '同步成功', message);
}).catch(error => {
  console.log(`同步未完成：${error.message}`);
  $notification.post('阿里云 → 青龙', '同步未完成', error.message);
}).finally(() => $done({}));
