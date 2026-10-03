/*
new Env("爱奇艺会员签到")
name: 爱奇艺会员签到
爱奇艺会员签到 — 青龙 / Node.js 适配版
原作者：NobyDa；上游：https://github.com/NobyDa/Script/blob/master/iQIYI-DailyBonus/iQIYI.js
修改日期：2026-10-03。改用内置网络和 MD5，严格校验 Cookie，禁止凭证日志。
许可证：GPL-3.0，见 LICENSE。原签到、抽奖和任务接口逻辑保留。
cron: 10 9 * * *
环境变量：IQIYI_COOKIE（多账号每行一个）；IQIYI_WEB_TASKS=1 启用网页版任务。无需额外依赖，Node.js >= 18。
*/
'use strict';
const https = require('node:https');
const crypto = require('node:crypto');
const LogDetails = false;
let P00001, P00003, DFP;
const pushMsg = [];
function md5(value) { return crypto.createHash('md5').update(value).digest('hex'); }
function inputError(message) {
  const error = new Error(message);
  error.safeMessage = message;
  return error;
}
function parseCookie(value) {
  if (!String(value || '').trim()) throw inputError('未读取到 IQIYI_COOKIE，请确认青龙环境变量已创建并启用，且名称完全一致');
  const fields = Object.fromEntries(String(value || '').split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.indexOf('=');
    return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)];
  }));
  fields.P00003 = fields.P00003 || fields.P00010;
  fields.__dfp = fields.__dfp || fields.dfp || '';
  const missing = ['P00001', 'P00003'].filter(k => !fields[k]);
  if (missing.length) throw inputError(`IQIYI_COOKIE 缺少字段：${missing.join('、')}；请重新获取完整 Cookie`);
  if (['P00001', 'P00003', '__dfp'].some(k => /[\x00-\x1f\x7f]/.test(fields[k] || ''))) throw inputError('Cookie 关键字段包含控制字符，请重新获取完整 Cookie');
  return fields;
}
function request(options, callback, method = 'GET') {
  const opts = typeof options === 'string' ? { url: options } : options;
  let settled = false;
  const finish = (err, response, body) => {
    if (settled) return;
    settled = true;
    callback(err, response, body);
  };
  try {
    const url = new URL(opts.url);
    if (url.protocol !== 'https:' || !(url.hostname === 'iqiyi.com' || url.hostname.endsWith('.iqiyi.com'))) throw new Error('拒绝非爱奇艺 HTTPS 地址');
    const req = https.request(url, { method, headers: opts.headers || {} }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
        if (body.length > 2 * 1024 * 1024) req.destroy(new Error('响应过大'));
      });
      res.on('error', () => finish(new Error('响应读取失败'), null, null));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) finish(new Error('接口 HTTP 状态异常'), null, null);
        else finish(null, { status: res.statusCode, statusCode: res.statusCode }, body);
      });
    });
    req.on('error', () => finish(new Error('接口请求失败'), null, null));
    const deadline = setTimeout(() => req.destroy(new Error('请求超时')), 20000);
    req.on('close', () => clearTimeout(deadline));
    req.end(opts.body || undefined);
  } catch (_) { finish(new Error('请求配置错误'), null, null); }
}
const $nobyda = {
  get: (opts, cb) => request(opts, cb),
  post: (opts, cb) => request(opts, cb, 'POST')
};
function parseAccounts(value) {
  if (!String(value || '').trim()) return [String(value || '')];
  return String(value).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}
function redact(text, cookies) {
  let result = String(text);
  const secrets = new Set();
  for (const cookie of cookies) {
    if (cookie) secrets.add(cookie);
    for (const item of cookie.split(';')) {
      const at = item.indexOf('=');
      if (at >= 0) {
        const value = item.slice(at + 1).trim();
        if (value) { secrets.add(value); secrets.add(encodeURIComponent(value)); }
      }
    }
  }
  for (const secret of [...secrets].sort((a, b) => b.length - a.length)) result = result.split(secret).join('[已隐藏]');
  return result;
}
async function sendSummary(title, body, failed, cookies, loader = require) {
  const mode = process.env.IQIYI_NOTIFY || 'all';
  if (mode === 'off' || (mode === 'errors' && !failed)) return;
  let notify;
  for (const path of ['./sendNotify.js', '../sendNotify.js', '/ql/data/scripts/sendNotify.js', '/ql/scripts/sendNotify.js']) {
    try {
      const resolved = loader.resolve(path);
      const helper = loader(resolved);
      if (typeof helper.sendNotify === 'function') { notify = helper.sendNotify; break; }
    } catch (_) { /* 某些青龙安装未提供该路径，继续尝试标准位置。 */ }
  }
  if (!notify) {
    console.warn('未找到青龙 sendNotify.js；签到结果已保留在日志。请配置通知渠道并提供青龙通知文件。');
    return;
  }
  try {
    await notify(title, redact(body, cookies));
    console.log('已调用青龙通知模块；送达结果请查看通知模块日志。');
  } catch (_) {
    console.warn('青龙通知调用失败，请检查通知渠道配置。');
  }
}
async function main({ runner = runAccount, notifier = sendSummary } = {}) {
  console.log('爱奇艺青龙脚本 v2026.10.03.6');
  const cookies = parseAccounts(process.env.IQIYI_COOKIE);
  const summaries = [];
  let failed = false;
  for (const [index, cookie] of cookies.entries()) {
    try {
      const result = await runner(cookie);
      summaries.push(`账号 ${index + 1}\n${result.text}`);
      failed = failed || result.failed;
    } catch (error) {
      const reason = error.safeMessage || '执行异常，请检查日志中的网络及接口状态';
      console.error(`账号 ${index + 1} 任务失败：${reason}`);
      summaries.push(`账号 ${index + 1}\n任务失败：${reason}`);
      failed = true;
    }
  }
  await notifier('爱奇艺签到', summaries.join('\n\n────────\n\n'), failed, cookies);
  if (failed) process.exitCode = 1;
  console.log('爱奇艺任务执行结束，请查看各接口结果。');
}
async function runAccount(cookie) {
  pushMsg.length = 0;
  delete $nobyda.stop;
  delete $nobyda.expire;
  const fields = parseCookie(cookie);
  P00001 = fields.P00001;
  P00003 = fields.P00003;
  DFP = fields.__dfp;
  console.log('Cookie 必需字段已读取，开始请求爱奇艺接口。');
  await login();
  await Checkin();
  if (process.env.IQIYI_WEB_TASKS === '1') {
    if (DFP) {
      await webCheckin();
      await new Promise(r => setTimeout(r, 1000));
      await webtask();
    } else {
      report('网页版任务跳过：Cookie 缺少 dfp / __dfp');
    }
  }
  for (let i = 0; i < 3; i++) {
    if (!await Lottery(i)) break;
    await new Promise(r => setTimeout(r, 1000));
  }
  for (const task of await getTaskList()) {
    if ([1, 4].includes(task.status)) continue;
    await joinTask(task);
    await notifyTask(task);
    await new Promise(r => setTimeout(r, 1000));
    await getTaskRewards(task);
  }
  const text = [`会员到期：${$nobyda.expire || '查询未成功'}`, ...pushMsg].join('\n');
  return { text, failed: /❌|⚠️|失败|无效|出错/.test(text) };
}
function apiStatus(obj, cookie = `P00001=${P00001 || ''};P00003=${P00003 || ''};__dfp=${DFP || ''};`) {
  const fields = [
    ['code', obj?.code], ['子code', obj?.data?.code],
    ['msg', obj?.msg || obj?.message], ['子msg', obj?.data?.msg || obj?.data?.message]
  ];
  const summary = fields.filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .map(([key, value]) => `${key}=${String(value).replace(/https?:\/\/\S+/g, '[链接]').slice(0, 160)}`).join('，');
  return redact(summary || '未提供状态码或错误消息', [cookie]);
}
function report(message) { pushMsg.push(message); console.log(message); }
function jsonGet(url) {
  return new Promise((resolve, reject) => request(url, (error, response, body) => {
    if (error) return reject(error);
    try { resolve(JSON.parse(body)); } catch (_) { reject(new Error('接口数据解析失败')); }
  }));
}
async function webCheckin() {
  const params = webParams('sign_pcw');
  try {
    const sign = k('UKobMjDMsDoScuWOfp6F', params, { split: '|', sort: true, splitSecretKey: true });
    const obj = await jsonGet(`https://community.iqiyi.com/openApi/score/add?${w(params)}&sign=${sign}`);
    if (obj.code === 'A00000' && obj.data?.[0]?.code === 'A0000') {
      report(`网页签到：积分+${obj.data[0].score}，累计 ${obj.data[0].continuousValue} 天`);
    } else report('网页签到失败：接口未返回成功状态');
  } catch (_) { report('网页签到失败：网络或响应数据异常'); }
}
function webParams(channelCode) {
  return {
    agenttype: '1', agentversion: '0', appKey: 'basic_pca', appver: '0',
    authCookie: P00001, channelCode, dfp: DFP, scoreType: '1', srcplatform: '1',
    typeCode: 'point', userId: P00003,
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    verticalCode: 'iQIYI'
  };
}
async function webtask() {
  const params = webParams('paopao_pcw');
  const sign = k('UKobMjDMsDoScuWOfp6F', params, { split: '|', sort: true, splitSecretKey: true });
  const query = `${w(params)}&sign=${sign}`;
  try {
    const obj = await jsonGet(`https://community.iqiyi.com/openApi/task/complete?${query}`);
    if (obj.code !== 'A00000') { report('网页热点任务失败：接口未返回成功状态'); return; }
    const reward = await jsonGet(`https://community.iqiyi.com/openApi/score/getReward?${query}`);
    if (reward.code === 'A00000') report(`网页热点任务：积分+${reward.data?.score || 0}`);
    else report('网页热点奖励领取失败');
  } catch (_) { report('网页热点任务失败：网络或响应数据异常'); }
}
function login() {
  return new Promise(resolve => {
    var URL = {
      url: 'https://cards.iqiyi.com/views_category/3.0/vip_home?secure_p=iPhone&scrn_scale=0&dev_os=0&ouid=0&layout_v=6&psp_cki=' + encodeURIComponent(P00001) + '&page_st=suggest&app_k=8e48946f144759d86a50075555fd5862&dev_ua=iPhone8%2C2&net_sts=1&cupid_uid=0&xas=1&init_type=6&app_v=11.4.5&idfa=0&app_t=0&platform_id=0&layout_name=0&req_sn=0&api_v=0&psp_status=0&psp_uid=451953037415627&qyid=0&secure_v=0&req_times=0',
      headers: {
        sign: '7fd8aadd90f4cfc99a858a4b087bcc3a',
        t: '479112291'
      }
    }
    $nobyda.get(URL, function (error, response, data) {
      const Details = LogDetails ? data ? `response:\n${data}` : '' : ''
      if (!error && data.match(/\"text\":\"\d.+?\u5230\u671f\"/)) {
        $nobyda.expire = data.match(/\"text\":\"(\d.+?\u5230\u671f)\"/)[1]
        console.log(`爱奇艺-查询成功: ${$nobyda.expire} ${Details}`)
      } else {
        console.log(`爱奇艺-查询失败${error || ': 无到期数据 ⚠️'} ${Details}`)
      }
      resolve()
    })
  })
}

function Checkin() {
  const timestamp = new Date().getTime();
  const stringRandom = (length) => {
    var rdm62, ret = '';
    while (length--) {
      rdm62 = 0 | Math.random() * 62;
      ret += String.fromCharCode(rdm62 + (rdm62 < 10 ? 48 : rdm62 < 36 ? 55 : 61))
    }
    return ret;
  };
  return new Promise(resolve => {
    const sign_date = {
      task_code: 'natural_month_sign',
      timestamp: timestamp,
      appKey: 'lequ_rn',
      userId: P00003,
      authCookie: P00001,
      agenttype: 20,
      agentversion: '15.4.6',
      srcplatform: 20,
      appver: '15.4.6',
      qyid: md5(stringRandom(16))
    };

    const post_date = {
      "natural_month_sign": {
        "verticalCode": "iQIYI",
        "agentVersion": "15.4.6",
        "authCookie": P00001,
        "taskCode": "iQIYI_mofhr",
        "dfp": DFP,
        "qyid": md5(stringRandom(16)),
        "agentType": 20,
        "signFrom": 1
      }
    };
    const sign = k("cRcFakm9KSPSjFEufg3W", sign_date, {
      split: "|",
      sort: !0,
      splitSecretKey: !0
    });
    var URL = {
      url: 'https://community.iqiyi.com/openApi/task/execute?' + w(sign_date) + "&sign=" + sign,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(post_date)
    }
    $nobyda.post(URL, function (error, response, data) {
      let CheckinMsg, rewards = [];
      const Details = LogDetails ? `msg:\n${data || error}` : '';
      try {
        if (error) throw new Error(`接口请求出错 ‼️`);
        const obj = JSON.parse(data)
        if (obj.code === "A00000") {
          if (obj.data.code === "A0000") {
            for (let i = 0; i < obj.data.data.rewards.length; i++) {
              if (obj.data.data.rewards[i].rewardType == 1) {
                rewards.push(`成长值+${obj.data.data.rewards[i].rewardCount}`)
              } else if (obj.data.data.rewards[i].rewardType == 2) {
                rewards.push(`VIP天+${obj.data.data.rewards[i].rewardCount}`)
              } else if (obj.data.data.rewards[i].rewardType == 3) {
                rewards.push(`积分+${obj.data.data.rewards[i].rewardCount}`)
              }
            }
            var continued = obj.data.data.signDays;
            CheckinMsg = `应用签到: ${rewards.length ? `${rewards.join(", ")}${rewards.length < 3 ? `, 累计签到${continued}天` : ``}` : '无奖励'} 🎉`;
          } else {
            CheckinMsg = `应用签到失败: ${apiStatus(obj)} ⚠️`;
          }
        } else {
          CheckinMsg = `应用签到失败: ${apiStatus(obj)} ⚠️`;
        }
      } catch (e) {
        CheckinMsg = '应用签到失败：请求或响应数据异常';
      }
      pushMsg.push(CheckinMsg);
      console.log(`爱奇艺-${CheckinMsg} ${Details}`);
      resolve()
    })
  })
}

function Lottery(s) {
  return new Promise(resolve => {
    const URL = {
      url: 'https://iface2.iqiyi.com/aggregate/3.0/lottery_activity?app_k=0&app_v=0&platform_id=0&dev_os=0&dev_ua=0&net_sts=0&qyid=0&psp_uid=0&psp_cki=' + encodeURIComponent(P00001) + '&psp_status=0&secure_p=0&secure_v=0&req_sn=0'
    }
    $nobyda.get(URL, async function (error, response, data) {
      const Details = LogDetails ? `msg:\n${data || error}` : ''
      let LotteryMsg;
      try {
        if (error) throw new Error("接口请求出错 ‼️");
        const obj = JSON.parse(data);
        if (obj.title) {
          LotteryMsg = `应用抽奖: ${obj.title != '影片推荐' && obj.awardName || '未中奖'} 🎉`;
          LotteryMsg = obj.kv.code == 'Q00702' && `应用抽奖: 今日抽奖次数已用完` || LotteryMsg;
          $nobyda.stop = obj.kv.code == 'Q00702';
        } else if (obj.kv.code == 'Q00304') {
          LotteryMsg = `应用抽奖: Cookie无效 ⚠️`;
          $nobyda.stop = 1;
        } else {
          LotteryMsg = `应用抽奖: 未知错误 ⚠️`
        }
      } catch (e) {
        LotteryMsg = `应用抽奖: ${e.message || e}`;
      }
      console.log(`爱奇艺-${LotteryMsg} (${s + 1}) ${Details}`)
      pushMsg.push(LotteryMsg)
      resolve(!$nobyda.stop)
    })
  })
}

function getTaskList(task) {
  return new Promise(resolve => {
    $nobyda.get(`https://tc.vip.iqiyi.com/taskCenter/task/queryUserTask?P00001=${encodeURIComponent(P00001)}`, function (error, response, data) {
      let taskListMsg, taskList = [];
      const Details = LogDetails ? `msg:\n${data || error}` : '';
      try {
        if (error) throw new Error(`请求失败`);
        const obj = JSON.parse(data);
        if (obj.code == 'A00000' && obj.data && obj.data.tasks) {
          Object.keys(obj.data.tasks).map((group) => {
            const items = obj.data.tasks[group];
            if (!Array.isArray(items)) return;
            items.map((item) => {
              taskList.push({
                name: item.taskTitle || item.name,
                taskCode: item.taskCode || item.code,
                status: item.status
              })
            })
          })
          taskListMsg = `获取成功!`;
        } else {
          taskListMsg = `获取失败：${apiStatus(obj)}；未取得任务列表`;
        }
      } catch (e) {
        taskListMsg = '获取失败：请求或响应数据异常';
      }
      report(`爱奇艺-任务列表: ${taskListMsg}`);
      resolve(taskList)
    })
  })
}

function joinTask(task) {
  return new Promise(resolve => {
    $nobyda.get('https://tc.vip.iqiyi.com/taskCenter/task/joinTask?taskCode=' + encodeURIComponent(task.taskCode) + '&lang=zh_CN&platform=0000000000000000&P00001=' + encodeURIComponent(P00001), function (error, response, data) {
      let joinTaskMsg, Details = LogDetails ? `msg:\n${data || error}` : '';
      try {
        if (error) throw new Error(`请求失败`);
        const obj = JSON.parse(data);
        joinTaskMsg = obj.code || '领取失败';
      } catch (e) {
        joinTaskMsg = `错误 ${e.message || e}`;
      }
      console.log(`爱奇艺-领取任务: ${task.name} => ${joinTaskMsg} ${Details}`)
      resolve()
    })
  })
}

function notifyTask(task) {
  return new Promise(resolve => {
    $nobyda.get('https://tc.vip.iqiyi.com/taskCenter/task/notify?taskCode=' + encodeURIComponent(task.taskCode) + '&lang=zh_CN&platform=0000000000000000&P00001=' + encodeURIComponent(P00001), function (error, response, data) {
      let notifyTaskMsg, Details = LogDetails ? `msg:\n${data || error}` : '';
      try {
        if (error) throw new Error(`请求失败`);
        const obj = JSON.parse(data);
        notifyTaskMsg = obj.code || '失败';
      } catch (e) {
        notifyTaskMsg = e.message || e;
      }
      console.log(`爱奇艺-开始任务: ${task.name} => ${notifyTaskMsg} ${Details}`)
      resolve()
    })
  })
}

function getTaskRewards(task) {
  return new Promise(resolve => {
    $nobyda.get('https://tc.vip.iqiyi.com/taskCenter/task/getTaskRewards?taskCode=' + encodeURIComponent(task.taskCode) + '&lang=zh_CN&platform=0000000000000000&P00001=' + encodeURIComponent(P00001), function (error, response, data) {
      let RewardsMsg;
      const Details = LogDetails ? `msg:\n${data || error}` : ''
      try {
        if (error) throw new Error(`接口请求出错 ‼️`);
        const obj = JSON.parse(data)
        if (obj.msg === "成功" && obj.code === "A00000" && obj.dataNew[0] !== undefined) {
          RewardsMsg = `任务奖励: ${task.name} => ${obj.dataNew[0].name + obj.dataNew[0].value} 🎉`
        } else {
          RewardsMsg = `任务奖励: ${task.name} => ${obj.msg !== `成功` && obj.msg || `未完成`} ⚠️`
        }
      } catch (e) {
        RewardsMsg = `任务奖励: ${e.message || e}`;
      }
      pushMsg.push(RewardsMsg)
      console.log(`爱奇艺-${RewardsMsg} ${Details}`)
      resolve()
    })
  })
}

function k(e, t) {
  var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}
    , n = a.split
    , c = void 0 === n ? "|" : n
    , r = a.sort
    , s = void 0 === r || r
    , o = a.splitSecretKey
    , i = void 0 !== o && o
    , l = s ? Object.keys(t).sort() : Object.keys(t)
    , u = l.map((function (e) {
      return "".concat(e, "=").concat(t[e])
    }
    )).join(c) + (i ? c : "") + e;
  return md5(u)
}

function w() {
  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}
    , t = [];
  return Object.keys(e).forEach((function (a) {
    t.push(`${encodeURIComponent(a)}=${encodeURIComponent(e[a])}`)
  }
  )),
    t.join("&")
}

module.exports = { parseCookie, parseAccounts, redact, sendSummary, request, main, apiStatus, encodeQuery: w };
if (require.main === module) main().catch(error => {
  console.error('任务执行或通知汇总异常，请查看上方日志。');
  process.exitCode = 1;
});
