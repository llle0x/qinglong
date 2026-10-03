/**
 * 九号出行签到 · 青龙 v2026.10.04.1
 * Adapted from llle0x/Surge/Scripts/ninebot.js.
 * Original flow: 凉心 (52Lxcloud/ScriptKit).
 * cron: 20 8 * * *
 * 环境变量 NINEBOT_ACCOUNTS：Surge Ninebot.Accounts.SurgeV2 的 JSON 数组。
 * Node.js >= 18.17，无额外依赖，不输出凭证。
 */
"use strict";
const TITLE = "九号出行签到";
const API = "https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2";

function parseAccounts(value) {
  if (!String(value || "").trim()) throw new Error("请配置 NINEBOT_ACCOUNTS");
  let accounts;
  try {
    accounts = JSON.parse(value);
  } catch (_) {
    throw new Error("NINEBOT_ACCOUNTS 必须是 JSON 数组");
  }
  if (!Array.isArray(accounts) || !accounts.length || accounts.length > 50)
    throw new Error("请配置 1 至 50 个账号的 JSON 数组");
  const seen = new Set();
  return accounts.map((a, i) => {
    const valid = (v) =>
      typeof v === "string" && v.trim() && !/[\r\n\0]/.test(v);
    if (
      !a ||
      !valid(a.deviceId) ||
      !valid(a.token) ||
      (a.authorization !== undefined && !valid(a.authorization)) ||
      (a.tokenHeader !== undefined &&
        !["access-token", "authorization"].includes(a.tokenHeader)) ||
      (a.deviceHeader !== undefined &&
        !["device-id", "device_id"].includes(a.deviceHeader))
    )
      throw new Error(
        `账号 ${i + 1} 配置格式错误，请保留捕获的凭证及请求头类型`,
      );
    if (seen.has(a.deviceId.trim()))
      throw new Error(`账号 ${i + 1} 的设备 ID 重复`);
    seen.add(a.deviceId.trim());
    return {
      deviceId: a.deviceId.trim(),
      token: a.token.trim(),
      tokenHeader: a.tokenHeader || "authorization",
      deviceHeader: a.deviceHeader || "device_id",
      ...(a.authorization ? { authorization: a.authorization.trim() } : {}),
    };
  });
}

async function request(path, account, method, body, fetchImpl = fetch) {
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    language: "zh",
    from_platform_1: "1",
    Origin: "https://h5-bj.ninebot.com",
    Referer: "https://h5-bj.ninebot.com/",
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Segway v6",
  };
  headers[account.deviceHeader] = account.deviceId;
  headers[
    account.tokenHeader === "access-token" ? "access-token" : "Authorization"
  ] = account.token;
  if (account.authorization) headers.Authorization = account.authorization;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetchImpl(API + path, {
      method: method.toUpperCase(),
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
      redirect: "manual",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    let json;
    try {
      json = JSON.parse(await response.text());
    } catch (_) {
      throw new Error("接口返回不是 JSON");
    }
    if (!json || typeof json !== "object" || Array.isArray(json))
      throw new Error("接口响应格式变化");
    return json;
  } catch (error) {
    if (/^HTTP \d+$|^接口返回不是 JSON$|^接口响应格式变化$/.test(error.message))
      throw error;
    throw new Error("网络请求失败或超时");
  } finally {
    clearTimeout(timer);
  }
}

function checkStatus(result) {
  if (![0, "0"].includes(result.code))
    throw new Error("状态查询失败，请检查 Token 是否有效");
  const state = result.data?.currentSignStatus;
  if (![0, 1, "0", "1"].includes(state))
    throw new Error("签到状态格式变化，停止提交");
  return Number(state);
}
async function signIn(account, fetchImpl) {
  const status = await request(
    `/status?t=${Date.now()}`,
    account,
    "get",
    undefined,
    fetchImpl,
  );
  const days = Number(status.data?.consecutiveDays) || 0;
  if (checkStatus(status) === 1) return `已签到 | 连签 ${days} 天`;
  const signed = await request(
    "/sign",
    account,
    "post",
    { deviceId: account.deviceId },
    fetchImpl,
  );
  if (![0, "0"].includes(signed.code))
    throw new Error("签到接口未返回成功，请检查账号状态");
  const after = await request(
    `/status?t=${Date.now()}`,
    account,
    "get",
    undefined,
    fetchImpl,
  );
  if (checkStatus(after) !== 1)
    throw new Error("提交后尚未确认签到成功，请稍后查询");
  const rewards = (
    Array.isArray(signed.data?.rewardList) ? signed.data.rewardList : []
  )
    .map((item) => Number(item?.rewardValue))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => `+${n} N币`)
    .join(" ");
  return `成功 | 连签 ${Number(after.data?.consecutiveDays) || days + 1} 天${rewards ? ` | ${rewards}` : ""}`;
}

async function notify(body) {
  if (process.env.NINEBOT_NOTIFY === "off") return;
  if (typeof globalThis.QLAPI?.systemNotify === "function") {
    try {
      const result = await globalThis.QLAPI.systemNotify({
        title: TITLE,
        content: body,
      });
      console.log(
        Number(result?.code) === 200
          ? "青龙系统通知接口返回成功，请确认 TG 是否收到。"
          : "青龙系统通知未返回成功，请测试通知渠道。",
      );
    } catch (_) {
      console.warn("青龙系统通知调用失败，请测试通知渠道。");
    }
    return;
  }
  for (const location of [
    "./sendNotify.js",
    "../sendNotify.js",
    "/ql/data/scripts/sendNotify.js",
    "/ql/scripts/sendNotify.js",
  ]) {
    let helper;
    try {
      helper = require(location);
    } catch (_) {
      continue;
    }
    if (typeof helper.sendNotify !== "function") continue;
    try {
      await helper.sendNotify(TITLE, body);
    } catch (_) {
      console.warn("sendNotify 调用失败，请检查通知环境变量。");
    }
    return;
  }
  console.warn("未找到青龙通知模块，结果已输出到日志。");
}
async function run({
  value = process.env.NINEBOT_ACCOUNTS,
  fetchImpl,
  notifyImpl = notify,
} = {}) {
  console.log("九号出行青龙适配版 v2026.10.04.1");
  const results = [];
  let failed = false;
  let accounts;
  try {
    accounts = parseAccounts(value);
  } catch (error) {
    results.push(error.message);
    failed = true;
  }
  for (let i = 0; i < (accounts?.length || 0); i++) {
    try {
      results.push(`账号 ${i + 1}: ${await signIn(accounts[i], fetchImpl)}`);
    } catch (error) {
      results.push(`账号 ${i + 1}: ${error.message}`);
      failed = true;
    }
  }
  const body = results.join("\n");
  console.log(body);
  await notifyImpl(body);
  return failed ? 1 : 0;
}
module.exports = { parseAccounts, request, signIn, run, notify };
if (require.main === module)
  run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch(() => {
      console.error("九号任务运行失败，请检查运行环境及通知模块。");
      process.exitCode = 1;
    });
