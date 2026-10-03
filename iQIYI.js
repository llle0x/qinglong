/*
爱奇艺会员签到 — 青龙 / Node.js 适配版
原作者：NobyDa；上游：https://github.com/NobyDa/Script/blob/master/iQIYI-DailyBonus/iQIYI.js
修改日期：2026-10-03。改用内置网络和 MD5，严格校验 Cookie，禁止凭证日志。
许可证：GPL-3.0，见 LICENSE。原签到、抽奖和任务接口逻辑保留。
cron: 10 9 * * *
环境变量：IQIYI_COOKIE（单账号）。无需额外依赖，Node.js >= 18。
*/
'use strict';
const https = require('node:https');
const crypto = require('node:crypto');
const LogDetails = false;
let P00001, P00003, DFP;
const pushMsg = [];
function md5(value) { return crypto.createHash('md5').update(value).digest('hex'); }
function parseCookie(value) {
  const fields = Object.fromEntries(String(value || '').split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.indexOf('=');
    return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)];
  }));
  if (['P00001', 'P00003', '__dfp'].some(k => !fields[k])) throw new Error('IQIYI_COOKIE 缺少 P00001、P00003 或 __dfp，请重新获取');
  if (!/^[A-Za-z0-9_-]+$/.test(fields.P00001) || !/^\d+$/.test(fields.P00003) || !/^\w+$/.test(fields.__dfp)) throw new Error('Cookie 关键字段格式不正确');
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
async function main() {
  const fields = parseCookie(process.env.IQIYI_COOKIE);
  P00001 = fields.P00001;
  P00003 = fields.P00003;
  DFP = fields.__dfp;
  await login();
  await Checkin();
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
  console.log('爱奇艺任务执行结束，请查看各接口结果。');
}
function login() {
  return new Promise(resolve => {
    var URL = {
      url: 'https://cards.iqiyi.com/views_category/3.0/vip_home?secure_p=iPhone&scrn_scale=0&dev_os=0&ouid=0&layout_v=6&psp_cki=' + P00001 + '&page_st=suggest&app_k=8e48946f144759d86a50075555fd5862&dev_ua=iPhone8%2C2&net_sts=1&cupid_uid=0&xas=1&init_type=6&app_v=11.4.5&idfa=0&app_t=0&platform_id=0&layout_name=0&req_sn=0&api_v=0&psp_status=0&psp_uid=451953037415627&qyid=0&secure_v=0&req_times=0',
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
            CheckinMsg = `应用签到: ${obj.data.msg} ⚠️`;
          }
        } else {
          CheckinMsg = `应用签到: Cookie无效 ⚠️`;
        }
      } catch (e) {
        CheckinMsg = `应用签到: ${e.message || e}`;
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
      url: 'https://iface2.iqiyi.com/aggregate/3.0/lottery_activity?app_k=0&app_v=0&platform_id=0&dev_os=0&dev_ua=0&net_sts=0&qyid=0&psp_uid=0&psp_cki=' + P00001 + '&psp_status=0&secure_p=0&secure_v=0&req_sn=0'
    }
    $nobyda.get(URL, async function (error, response, data) {
      const Details = LogDetails ? `msg:\n${data || error}` : ''
      let LotteryMsg;
      try {
        if (error) throw new Error("接口请求出错 ‼️");
        const obj = JSON.parse(data);
        if (obj.title) {
          LotteryMsg = `应用抽奖: ${obj.title != '影片推荐' && obj.awardName || '未中奖'} 🎉`;
          LotteryMsg = obj.kv.code == 'Q00702' && `应用抽奖: 您的抽奖次数已经用完 ⚠️` || LotteryMsg;
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
    $nobyda.get(`https://tc.vip.iqiyi.com/taskCenter/task/queryUserTask?P00001=${P00001}`, function (error, response, data) {
      let taskListMsg, taskList = [];
      const Details = LogDetails ? `msg:\n${data || error}` : '';
      try {
        if (error) throw new Error(`请求失败`);
        const obj = JSON.parse(data);
        if (obj.code == 'A00000' && obj.data && obj.data.tasks) {
          Object.keys(obj.data.tasks).map((group) => {
            (obj.data.tasks[group] || []).map((item) => {
              taskList.push({
                name: item.taskTitle,
                taskCode: item.taskCode,
                status: item.status
              })
            })
          })
          taskListMsg = `获取成功!`;
        } else {
          taskListMsg = `获取失败!`;
        }
      } catch (e) {
        taskListMsg = `${e.message || e} ‼️`;
      }
      console.log(`爱奇艺-任务列表: ${taskListMsg} ${Details}`)
      resolve(taskList)
    })
  })
}

function joinTask(task) {
  return new Promise(resolve => {
    $nobyda.get('https://tc.vip.iqiyi.com/taskCenter/task/joinTask?taskCode=' + task.taskCode + '&lang=zh_CN&platform=0000000000000000&P00001=' + P00001, function (error, response, data) {
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
    $nobyda.get('https://tc.vip.iqiyi.com/taskCenter/task/notify?taskCode=' + task.taskCode + '&lang=zh_CN&platform=0000000000000000&P00001=' + P00001, function (error, response, data) {
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
    $nobyda.get('https://tc.vip.iqiyi.com/taskCenter/task/getTaskRewards?taskCode=' + task.taskCode + '&lang=zh_CN&platform=0000000000000000&P00001=' + P00001, function (error, response, data) {
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
    t.push("".concat(a, "=").concat(e[a]))
  }
  )),
    t.join("&")
}

module.exports = { parseCookie, request, main };
if (require.main === module) main().catch(() => {
  console.error('任务失败：请检查 IQIYI_COOKIE、网络和接口状态。');
  process.exitCode = 1;
});
