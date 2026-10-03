"use strict";
// 青龙运行适配；原任务逻辑位于 aliyun_web.js。
function parseAccounts(value) {
  if (!String(value || "").trim()) return [];
  let accounts;
  const text = String(value).trim();
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      accounts = Array.isArray(parsed) ? parsed : [parsed];
    } catch (_) {
      throw new Error("aliyunWeb_data JSON 格式不正确");
    }
  } else accounts = text.split(/\r?\n/).filter(Boolean);
  return accounts.map((account) => {
    const data =
      typeof account === "string" ? { token: account.trim() } : account;
    if (
      !data ||
      typeof data.token !== "string" ||
      !data.token.trim() ||
      /[\r\n\x00]/.test(data.token)
    )
      throw new Error("账号缺少有效 Cookie token");
    return { ...data, token: data.token.trim() };
  });
}
function validateSettings(env) {
  const hour = env.aliyunWeb_time || "12";
  if (!/^\d+$/.test(hour) || Number(hour) < 1 || Number(hour) > 23)
    throw new Error("aliyunWeb_time 必须为 1–23 的整数");
  for (const key of ["aliyunWeb_scene", "aliyunWeb_video", "aliyunWeb_stock"]) {
    if (env[key] && !["true", "false"].includes(env[key]))
      throw new Error(`${key} 必须为 true 或 false`);
  }
}
function redact(message) {
  let result = String(message);
  let accounts = [];
  try {
    accounts = parseAccounts(process.env.aliyunWeb_data);
  } catch (_) {}
  const secrets = new Set();
  for (const account of accounts) {
    secrets.add(account.token);
    for (const field of account.token.split(";")) {
      const at = field.indexOf("=");
      const value = at >= 0 ? field.slice(at + 1).trim() : "";
      if (value.length >= 4) {
        secrets.add(value);
        secrets.add(encodeURIComponent(value));
      }
    }
  }
  for (const secret of [...secrets].sort((a, b) => b.length - a.length))
    result = result.split(secret).join("[已隐藏]");
  return result;
}
async function request(options, fetchImpl = fetch) {
  const opts = typeof options === "string" ? { url: options } : options;
  const url = new URL(opts.url);
  if (
    url.protocol !== "https:" ||
    !["developer.aliyun.com", "ucc.aliyun.com"].includes(url.hostname)
  )
    throw new Error("拒绝非阿里云任务接口地址");
  for (const [key, value] of Object.entries(opts.params || {})) {
    if (value !== undefined && value !== null)
      url.searchParams.set(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
      );
  }
  const method = String(
    opts.type || opts.method || (opts.body !== undefined ? "POST" : "GET"),
  ).toUpperCase();
  const headers = { ...opts.headers };
  for (const key of Object.keys(headers))
    if (/^content-length$/i.test(key)) delete headers[key];
  let body;
  if (!["GET", "HEAD"].includes(method) && opts.body !== undefined) {
    if ((opts.dataType || "form") === "form") {
      body =
        typeof opts.body === "string"
          ? opts.body
          : new URLSearchParams(
              Object.entries(opts.body).map(([k, v]) => [
                k,
                typeof v === "object" ? JSON.stringify(v) : String(v),
              ]),
            ).toString();
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      body =
        typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
      headers["Content-Type"] = "application/json";
    }
  }
  const controller = new AbortController();
  const limit = Math.min(60000, Math.max(1000, Number(opts.timeout) || 20000));
  const timer = setTimeout(() => controller.abort(), limit);
  try {
    const response = await fetchImpl(url, {
      method,
      headers,
      body,
      signal: controller.signal,
      redirect: "manual",
    });
    if (!response.ok) throw new Error(`阿里云接口 HTTP ${response.status}`);
    const text = await response.text();
    if (text.length > 5 * 1024 * 1024) throw new Error("接口响应过大");
    if (opts.resultType === "response")
      return { status: response.status, body: text };
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  } catch (error) {
    if (/^阿里云接口 HTTP \d+$|^接口响应过大$/.test(error.message)) throw error;
    throw new Error("阿里云接口网络请求失败");
  } finally {
    clearTimeout(timer);
  }
}
async function notify(title, body) {
  const content = redact(body);
  if (process.env.aliyunWeb_notify === "off") {
    console.log(content);
    return;
  }
  if (typeof globalThis.QLAPI?.systemNotify === "function") {
    try {
      const result = await globalThis.QLAPI.systemNotify({ title, content });
      console.log(
        Number(result?.code) === 200
          ? "青龙系统通知接口返回成功，请确认 TG 是否收到。"
          : "青龙系统通知未返回成功，请测试系统通知渠道。",
      );
    } catch (_) {
      console.warn("青龙系统通知调用失败，请测试通知渠道。");
    }
    return;
  }
  for (const path of [
    "../sendNotify.js",
    "../../sendNotify.js",
    "/ql/data/scripts/sendNotify.js",
    "/ql/scripts/sendNotify.js",
  ]) {
    let helper;
    try {
      helper = require(path);
    } catch (_) {
      continue;
    }
    if (typeof helper.sendNotify !== "function") continue;
    try {
      await helper.sendNotify(title, content);
      console.log("已调用 sendNotify；该方式需要通知环境变量。");
    } catch (_) {
      console.warn("sendNotify 调用失败，请检查通知环境变量。");
    }
    return;
  }
  console.warn("未找到青龙系统通知接口或 sendNotify，汇总如下：");
  console.log(content);
}
class Env {
  constructor(name) {
    this.name = name;
    this.notifyList = [];
    this.notifyMsg = [];
  }
  isNode() {
    return true;
  }
  isSurge() {
    return false;
  }
  getdata(key) {
    return process.env[key] || "";
  }
  toObj(text, fallback = null) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return fallback;
    }
  }
  toStr(value) {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return "";
    }
  }
  queryStr(params = {}) {
    return new URLSearchParams(
      Object.entries(params).map(([k, v]) => [
        k,
        typeof v === "object" ? JSON.stringify(v) : String(v),
      ]),
    ).toString();
  }
  log(...messages) {
    console.log(messages.map(redact).join("\n"));
  }
  wait(ms) {
    return new Promise((resolve) =>
      setTimeout(resolve, Math.max(1000, Number(ms) || 1000)),
    );
  }
}
module.exports = {
  Env,
  parseAccounts,
  validateSettings,
  request,
  redact,
  notify,
};
