/* 通用 Surge → 青龙凭证同步，llle0x，2026-10-03。
只捕获匹配规则的请求。新网站用 BoxJS JSON 规则配置，不需要新建 JS。
配置凭证优先 qinglong_sync_*，兼容此前 qinglong_iqiyi_*；不输出凭证。
*/
"use strict";
const DEFAULT_RULES = [
  {
    id: "iqiyi",
    name: "爱奇艺",
    pattern: "^https://passport\\.iqiyi\\.com/apis/user/",
    envName: "IQIYI_COOKIE",
    storageKey: "CookieQY",
    kind: "raw",
    header: "Cookie",
    requiredCookies: ["P00001", ["P00003", "P00010"]],
    remarks: "Surge iQIYI",
  },
  {
    id: "aliyun",
    name: "阿里云",
    pattern:
      "^https://developer\\.aliyun\\.com/developer/api/my/user/getUser(?:[/?]|$)",
    envName: "aliyunWeb_data",
    storageKey: "aliyunWeb_data",
    kind: "accounts",
    header: "Cookie",
    userIdPaths: ["data.userId", "data.uid", "data.nickname"],
    namePath: "data.nickname",
    avatarPath: "data.avatar",
    remarks: "Surge Aliyun",
  },
  {
    id: "ninebot",
    name: "九号出行",
    pattern:
      "^https://cn-cbu-gateway\\.ninebot\\.com/(?:portal|app-api)/api/user-sign/",
    envName: "NINEBOT_ACCOUNTS",
    storageKey: "Ninebot.Accounts.SurgeV2",
    kind: "ninebot",
    remarks: "Surge Ninebot",
  },
];
function read(key) {
  return $persistentStore.read(key) || "";
}
function loadRules() {
  let custom;
  try {
    custom = JSON.parse(read("qinglong_sync_rules") || "[]");
  } catch (_) {
    throw new Error("自定义规则不是有效 JSON");
  }
  if (!Array.isArray(custom)) throw new Error("自定义规则须为 JSON 数组");
  const rules = new Map(DEFAULT_RULES.map((rule) => [rule.id, { ...rule }]));
  for (const rule of custom) {
    if (!rule || !rule.id || typeof rule.id !== "string")
      throw new Error("每条自定义规则必须有 id");
    rules.set(rule.id, { ...(rules.get(rule.id) || {}), ...rule });
  }
  const enabled = [...rules.values()].filter((rule) => rule.enabled !== false);
  const targets = new Set();
  for (const rule of enabled) {
    if (
      typeof rule.pattern !== "string" ||
      !rule.pattern ||
      !/^[A-Za-z_]\w*$/.test(rule.envName || "") ||
      typeof rule.storageKey !== "string" ||
      !rule.storageKey ||
      !["raw", "accounts", "ninebot"].includes(rule.kind)
    )
      throw new Error("规则缺少有效 pattern、envName、storageKey 或 kind");
    try {
      new RegExp(rule.pattern);
    } catch (_) {
      throw new Error("规则 pattern 正则无效");
    }
    if (targets.has(rule.envName))
      throw new Error("多条规则使用相同青龙变量，请合并为一条规则");
    targets.add(rule.envName);
    if (rule.kind === "accounts" && !Array.isArray(rule.userIdPaths))
      throw new Error("多账号规则需要 userIdPaths");
  }
  return enabled;
}
function atPath(value, path) {
  if (!path) return undefined;
  return path
    .split(".")
    .reduce(
      (item, key) =>
        item && Object.prototype.hasOwnProperty.call(item, key)
          ? item[key]
          : undefined,
      value,
    );
}
function parseAccounts(value, kind = "accounts") {
  let rows;
  try {
    rows = JSON.parse(value || "[]");
  } catch (_) {
    throw new Error("账号数据必须为 JSON 数组，原数据未被覆盖");
  }
  rows = Array.isArray(rows) ? rows : [rows];
  if (kind === "ninebot") {
    const valid = (value) =>
      typeof value === "string" &&
      value.trim() &&
      !/[\x00-\x1f\x7f]/.test(value);
    if (
      rows.length > 50 ||
      rows.some(
        (row) =>
          !row ||
          !valid(row.deviceId) ||
          !valid(row.token) ||
          (row.authorization !== undefined && !valid(row.authorization)) ||
          (row.tokenHeader !== undefined &&
            !["access-token", "authorization"].includes(row.tokenHeader)) ||
          (row.deviceHeader !== undefined &&
            !["device-id", "device_id"].includes(row.deviceHeader)),
      )
    )
      throw new Error("九号账号数据格式异常，原数据未被覆盖");
    const ids = rows.map((row) => row.deviceId.trim());
    if (new Set(ids).size !== ids.length)
      throw new Error("九号设备 ID 重复，停止同步");
    return rows.map((row) => ({
      deviceId: row.deviceId.trim(),
      token: row.token.trim(),
      tokenHeader: row.tokenHeader || "authorization",
      deviceHeader: row.deviceHeader || "device_id",
      ...(row.authorization ? { authorization: row.authorization.trim() } : {}),
    }));
  }
  if (
    rows.some(
      (row) =>
        !row ||
        typeof row.token !== "string" ||
        !row.token ||
        !(row.userId || row.userName),
    )
  )
    throw new Error("账号数据缺少 token 或账号标识");
  return rows;
}
function mergeAccounts(existing, incoming, kind = "accounts") {
  if (kind === "ninebot") {
    const result = existing.map((row) => ({ ...row }));
    for (const row of incoming) {
      const index = result.findIndex((item) => item.deviceId === row.deviceId);
      if (index >= 0) result[index] = { ...row };
      else result.push({ ...row });
    }
    if (result.length > 50) throw new Error("九号账号超过 50 个，停止同步");
    return result;
  }
  const result = existing.map((row) => ({ ...row }));
  for (const row of incoming) {
    const matches = result
      .map((item, index) =>
        String(item.userId || item.userName) ===
          String(row.userId || row.userName) ||
        (item.userName && row.userName && item.userName === row.userName)
          ? index
          : -1,
      )
      .filter((index) => index >= 0);
    if (matches.length > 1) throw new Error("账号标识重复，停止同步");
    if (matches.length) result[matches[0]] = { ...result[matches[0]], ...row };
    else result.push({ ...row });
  }
  return result;
}
function headerValue(headers, name) {
  const key = Object.keys(headers || {}).find(
    (key) => key.toLowerCase() === String(name || "Cookie").toLowerCase(),
  );
  return key ? headers[key] : "";
}
function capture(rule, request, response) {
  if (rule.kind === "ninebot") {
    const headers = request.headers || {};
    const accessToken = headerValue(headers, "access-token");
    const authorization = headerValue(headers, "authorization");
    const hyphenId = headerValue(headers, "device-id");
    const row = {
      deviceId: hyphenId || headerValue(headers, "device_id"),
      token: accessToken || authorization,
      tokenHeader: accessToken ? "access-token" : "authorization",
      deviceHeader: hyphenId ? "device-id" : "device_id",
    };
    if (accessToken && authorization) row.authorization = authorization;
    const incoming = parseAccounts(JSON.stringify([row]), "ninebot");
    return JSON.stringify(
      mergeAccounts(
        parseAccounts(read(rule.storageKey), "ninebot"),
        incoming,
        "ninebot",
      ),
    );
  }
  let body;
  const responseBody = () => {
    if (body === undefined) {
      try {
        body = JSON.parse(response && response.body);
      } catch (_) {
        throw new Error("无法解析响应 JSON，请确认 requires-body=true");
      }
    }
    return body;
  };
  let value;
  const source = rule.captureFrom || "request-header";
  if (source === "request-header")
    value = headerValue(request.headers, rule.header);
  else if (source === "response-header")
    value = headerValue(response && response.headers, rule.header);
  else if (source === "response-json")
    value = atPath(responseBody(), rule.valuePath);
  else throw new Error("不支持的 captureFrom");
  if (
    typeof value !== "string" ||
    !value.trim() ||
    /[\x00-\x1f\x7f]/.test(value)
  )
    throw new Error("未捕获到有效凭证，未写入数据");
  if (rule.requiredCookies) {
    const cookies = Object.fromEntries(
      value.split(";").map((field) => {
        const index = field.indexOf("=");
        return [field.slice(0, index).trim(), field.slice(index + 1).trim()];
      }),
    );
    if (
      rule.requiredCookies.some(
        (field) => ![].concat(field).some((key) => cookies[key]),
      )
    )
      throw new Error("Cookie 缺少规则要求的字段");
  }
  if (rule.kind === "raw") return value;
  const identity = rule.userIdPaths
    .map((path) => atPath(responseBody(), path))
    .find(
      (value) =>
        typeof value === "number" || (typeof value === "string" && value),
    );
  if (identity === undefined) throw new Error("响应中没有账号标识，未写入数据");
  const name = atPath(responseBody(), rule.namePath);
  const avatar = atPath(responseBody(), rule.avatarPath);
  const row = {
    userId: String(identity),
    userName: typeof name === "string" ? name : String(identity),
    avatar: typeof avatar === "string" ? avatar : "",
    token: value,
  };
  return JSON.stringify(
    mergeAccounts(parseAccounts(read(rule.storageKey)), [row]),
  );
}
function call(method, url, token, body) {
  return new Promise((resolve, reject) => {
    const options = {
      url,
      headers: { "Content-Type": "application/json" },
      timeout: 15,
      "auto-redirect": false,
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) options.body = JSON.stringify(body);
    $httpClient[method](options, (error, response, data) => {
      if (error || !response)
        return reject(new Error("无法连接青龙，请检查地址和网络"));
      const status = response.status || response.statusCode;
      if (status < 200 || status >= 300)
        return reject(new Error(`青龙 HTTP ${status}，请检查应用权限和配置`));
      try {
        const parsed = JSON.parse(data);
        if (parsed.code !== 200) throw new Error();
        resolve(parsed.data);
      } catch (_) {
        reject(new Error("青龙响应异常，请检查应用凭证及环境变量权限"));
      }
    });
  });
}
function chooseEnv(rows, rule) {
  if (!Array.isArray(rows)) throw new Error("青龙变量列表格式异常");
  const exact = rows.filter((row) => row.name === rule.envName);
  if (exact.length <= 1) return exact[0];
  const marked = exact.filter(
    (row) => row.remarks === (rule.remarks || `Surge ${rule.id}`),
  );
  if (marked.length === 1) return marked[0];
  throw new Error("青龙存在多个同名变量，请用规则的 remarks 备注唯一目标");
}
async function upsert(rule, localValue, base, token) {
  const rows = await call(
    "get",
    `${base}/open/envs?searchValue=${encodeURIComponent(rule.envName)}`,
    token,
  );
  const existing = chooseEnv(rows, rule);
  if (existing && Number(existing.status) === 1)
    throw new Error("目标变量已禁用，请先在青龙确认");
  let value = localValue;
  if (["accounts", "ninebot"].includes(rule.kind))
    value = JSON.stringify(
      mergeAccounts(
        existing ? parseAccounts(existing.value, rule.kind) : [],
        parseAccounts(localValue, rule.kind),
        rule.kind,
      ),
    );
  else if (existing && /[\r\n]/.test(existing.value || ""))
    throw new Error("目标变量含多账号，停止覆盖");
  if (existing && existing.value === value) return false;
  const payload = {
    name: rule.envName,
    value,
    remarks:
      (existing && existing.remarks) || rule.remarks || `Surge ${rule.id}`,
  };
  if (existing) {
    payload.id = existing.id === undefined ? existing._id : existing.id;
    if (payload.id === undefined) throw new Error("青龙变量缺少 ID");
    await call("put", `${base}/open/envs`, token, payload);
  } else await call("post", `${base}/open/envs`, token, [payload]);
  return true;
}
async function run() {
  console.log("通用青龙同步 v2026.10.04.1");
  const rules = loadRules();
  const request = typeof $request === "undefined" ? null : $request;
  let selected = rules;
  if (request && typeof request.url === "string") {
    selected = rules.filter((rule) =>
      new RegExp(rule.pattern).test(request.url),
    );
    if (
      !selected.length ||
      String(request.method || "GET").toUpperCase() === "OPTIONS"
    )
      return;
    if (selected.length > 1)
      throw new Error("请求同时匹配多条规则，请缩小捕获范围");
    const rule = selected[0];
    const value = capture(
      rule,
      request,
      typeof $response === "undefined" ? null : $response,
    );
    if (!$persistentStore.write(value, rule.storageKey))
      throw new Error("本地凭证保存失败");
  }
  selected = selected.filter((rule) => Boolean(read(rule.storageKey)));
  if (!selected.length) {
    console.log("尚未捕获任何凭证，请打开对应登录页或积分商城");
    return;
  }
  const base = (read("qinglong_sync_url") || read("qinglong_iqiyi_url"))
    .trim()
    .replace(/\/+$/, "");
  const id = (
    read("qinglong_sync_client_id") || read("qinglong_iqiyi_client_id")
  ).trim();
  const secret = (
    read("qinglong_sync_client_secret") || read("qinglong_iqiyi_client_secret")
  ).trim();
  if (!base || !id || !secret)
    throw new Error("凭证已保存，请在 BoxJS 配置青龙地址、Client ID 和 Secret");
  if (!/^https?:\/\/[^\s/?#@]+(?:\/[^\s?#@]*)?$/.test(base))
    throw new Error("青龙根地址格式不正确");
  const auth = await call(
    "get",
    `${base}/open/auth/token?client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}`,
  );
  if (!auth || !auth.token) throw new Error("没有取得青龙访问令牌");
  for (const rule of selected) {
    try {
      const changed = await upsert(
        rule,
        read(rule.storageKey),
        base,
        auth.token,
      );
      console.log(
        `${rule.name || rule.id}：${changed ? "已同步" : "凭证未变化"}`,
      );
      if (changed)
        $notification.post(
          "凭证 → 青龙",
          "同步成功",
          `${rule.name || rule.id} 已更新，任务按青龙计划运行`,
        );
    } catch (error) {
      console.log(`${rule.name || rule.id}：${error.message}`);
      $notification.post(
        "凭证 → 青龙",
        "同步未完成",
        `${rule.name || rule.id}：${error.message}`,
      );
    }
  }
}
run()
  .catch((error) => {
    console.log(`同步未完成：${error.message}`);
    $notification.post("凭证 → 青龙", "同步未完成", error.message);
  })
  .finally(() => $done({}));
