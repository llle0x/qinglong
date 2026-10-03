"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const vm = require("node:vm"),
  fs = require("node:fs");
const source = fs.readFileSync(
  require.resolve("../surge/qinglong-sync.js"),
  "utf8",
);
const cookie = "P00001=private-cookie; P00003=123";
const account = {
  userId: "123",
  userName: "测试用户",
  avatar: "",
  token: "session=private-cookie;",
};
async function run({
  values = {},
  request,
  response,
  remote = {},
  configured = true,
} = {}) {
  const store = new Map(Object.entries(values));
  if (configured)
    for (const [key, value] of Object.entries({
      qinglong_iqiyi_url: "https://ql.example.com",
      qinglong_iqiyi_client_id: "fake-id",
      qinglong_iqiyi_client_secret: "private-secret",
    }))
      store.set(key, value);
  const calls = [],
    logs = [],
    notifications = [];
  let doneCount = 0;
  await new Promise((resolve) => {
    const http = {};
    for (const method of ["get", "post", "put"])
      http[method] = (opts, callback) => {
        calls.push({ method, ...opts });
        const name = new URL(opts.url).searchParams.get("searchValue");
        const data = opts.url.includes("/auth/token")
          ? { token: "access-token" }
          : method === "get"
            ? remote[name] || []
            : {};
        callback(null, { status: 200 }, JSON.stringify({ code: 200, data }));
      };
    const context = {
      console: { log: (value) => logs.push(value) },
      $persistentStore: {
        read: (key) => store.get(key),
        write: (value, key) => {
          store.set(key, value);
          return true;
        },
      },
      $httpClient: http,
      $notification: { post: (...args) => notifications.push(args) },
      $done: () => {
        doneCount++;
        resolve();
      },
    };
    if (request) context.$request = request;
    if (response) context.$response = response;
    vm.runInNewContext(source, context);
  });
  assert.equal(doneCount, 1);
  const output = JSON.stringify({ logs, notifications });
  assert.ok(!output.includes("private-cookie"));
  assert.ok(!output.includes("private-secret"));
  return { calls, store, notifications, logs };
}
const writes = (result) =>
  result.calls.filter((c) => c.method !== "get").map((c) => JSON.parse(c.body));
test("Universal captures iQIYI with existing shared configuration", async () => {
  const result = await run({
    request: {
      url: "https://passport.iqiyi.com/apis/user/info.action",
      headers: { Cookie: cookie },
    },
  });
  assert.equal(writes(result)[0][0].name, "IQIYI_COOKIE");
  assert.equal(writes(result)[0][0].value, cookie);
  assert.equal(result.store.get("CookieQY"), cookie);
});
test("Universal Aliyun merges remote accounts without dropping other accounts", async () => {
  const result = await run({
    request: {
      url: "https://developer.aliyun.com/developer/api/my/user/getUser",
      headers: { cookie: account.token },
    },
    response: {
      body: JSON.stringify({ data: { userId: "123", nickname: "测试用户" } }),
    },
    remote: {
      aliyunWeb_data: [
        {
          id: 8,
          name: "aliyunWeb_data",
          value: JSON.stringify([
            { ...account, token: "old;" },
            { userId: "456", token: "other;" },
          ]),
        },
      ],
    },
  });
  const rows = JSON.parse(writes(result)[0].value);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].token, account.token);
  assert.equal(rows[1].token, "other;");
});
test("Manual run syncs all locally saved accounts with one authentication", async () => {
  const result = await run({
    values: { CookieQY: cookie, aliyunWeb_data: JSON.stringify([account]) },
  });
  assert.equal(
    result.calls.filter((c) => c.url.includes("/auth/token")).length,
    1,
  );
  assert.deepEqual(
    writes(result).map((row) => row[0].name),
    ["IQIYI_COOKIE", "aliyunWeb_data"],
  );
});
test("Custom rules capture Authorization headers without new script files", async () => {
  const rule = {
    id: "custom",
    name: "自定义",
    pattern: "^https://api\\.example\\.com/account$",
    envName: "MY_TOKEN",
    storageKey: "my_token",
    kind: "raw",
    header: "Authorization",
  };
  const result = await run({
    values: { qinglong_sync_rules: JSON.stringify([rule]) },
    request: {
      url: "https://api.example.com/account",
      headers: { authorization: "Bearer private-cookie" },
    },
  });
  assert.equal(writes(result)[0][0].name, "MY_TOKEN");
  assert.equal(writes(result)[0][0].value, "Bearer private-cookie");
});
test("Custom rules can capture a response JSON token", async () => {
  const rule = {
    id: "custom",
    pattern: "^https://api\\.example\\.com/login$",
    envName: "MY_TOKEN",
    storageKey: "my_token",
    kind: "raw",
    captureFrom: "response-json",
    valuePath: "data.token",
  };
  const result = await run({
    values: { qinglong_sync_rules: JSON.stringify([rule]) },
    request: { url: "https://api.example.com/login" },
    response: { body: '{"data":{"token":"private-cookie"}}' },
  });
  assert.equal(writes(result)[0][0].value, "private-cookie");
});
test("Unrelated traffic does not upload or change stored credentials", async () => {
  const result = await run({
    values: { CookieQY: cookie },
    request: {
      url: "https://unrelated.example.com/",
      headers: { Cookie: "other;" },
    },
  });
  assert.equal(result.calls.length, 0);
  assert.equal(result.store.get("CookieQY"), cookie);
  assert.equal(result.notifications.length, 0);
});
test("Overlapping rules abort before capture or network requests", async () => {
  const rule = {
    id: "overlap",
    pattern: "^https://passport\\.iqiyi\\.com/",
    envName: "OTHER_COOKIE",
    storageKey: "other_cookie",
    kind: "raw",
  };
  const result = await run({
    values: { qinglong_sync_rules: JSON.stringify([rule]) },
    request: {
      url: "https://passport.iqiyi.com/apis/user/info.action",
      headers: { Cookie: cookie },
    },
  });
  assert.equal(result.calls.length, 0);
  assert.equal(result.store.has("CookieQY"), false);
  assert.match(result.notifications[0][2], /多条规则/);
});
test("One disabled target fails independently while remaining targets sync", async () => {
  const result = await run({
    values: { CookieQY: cookie, aliyunWeb_data: JSON.stringify([account]) },
    remote: {
      IQIYI_COOKIE: [{ id: 1, name: "IQIYI_COOKIE", status: 1, value: "old;" }],
    },
  });
  assert.equal(writes(result).length, 1);
  assert.equal(writes(result)[0][0].name, "aliyunWeb_data");
  assert.match(result.notifications[0][2], /禁用/);
});
test("Capture saves locally even if Qinglong is not configured", async () => {
  const result = await run({
    configured: false,
    request: {
      url: "https://passport.iqiyi.com/apis/user/info.action",
      headers: { Cookie: cookie },
    },
  });
  assert.equal(result.calls.length, 0);
  assert.equal(result.store.get("CookieQY"), cookie);
});
test("Raw multi-account variables and ambiguous destinations are preserved", async () => {
  for (const rows of [
    [{ id: 1, name: "IQIYI_COOKIE", value: "first\nsecond" }],
    [1, 2].map((id) => ({ id, name: "IQIYI_COOKIE", value: "old;" })),
  ]) {
    const result = await run({
      values: { CookieQY: cookie },
      remote: { IQIYI_COOKIE: rows },
    });
    assert.equal(writes(result).length, 0);
    assert.equal(result.notifications.length, 1);
  }
});
