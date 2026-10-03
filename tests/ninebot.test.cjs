const test = require("node:test"),
  assert = require("node:assert/strict");
const {
  parseAccounts,
  signIn,
  request,
  run,
  notify,
} = require("../ninebot.js");
const account = parseAccounts(
  JSON.stringify([
    {
      deviceId: "device",
      token: "secret",
      tokenHeader: "access-token",
      deviceHeader: "device-id",
      authorization: "Bearer secret2",
    },
  ]),
)[0];
const response = (data) => ({
  ok: true,
  text: async () => JSON.stringify(data),
});
test("Ninebot preserves captured header types and rejects invalid or duplicate credentials", () => {
  assert.equal(account.tokenHeader, "access-token");
  assert.throws(
    () => parseAccounts(JSON.stringify([{ deviceId: "d", token: "x\ny" }])),
    /格式/,
  );
  assert.throws(
    () =>
      parseAccounts(
        JSON.stringify([
          { deviceId: "d", token: "x" },
          { deviceId: "d", token: "y" },
        ]),
      ),
    /重复/,
  );
  assert.throws(() => parseAccounts("device:token"), /JSON/);
});
test("Already signed account performs only status query with captured headers", async () => {
  const calls = [];
  const result = await signIn(account, async (url, opts) => {
    calls.push({ url, opts });
    return response({
      code: 0,
      data: { currentSignStatus: 1, consecutiveDays: 8 },
    });
  });
  assert.match(result, /已签到/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].opts.headers["access-token"], "secret");
  assert.equal(calls[0].opts.headers.Authorization, "Bearer secret2");
  assert.equal(calls[0].opts.headers["device-id"], "device");
  assert.equal(calls[0].opts.redirect, "manual");
});
test("Sign success requires post-sign status confirmation", async () => {
  let index = 0;
  const calls = [];
  const replies = [
    { code: 0, data: { currentSignStatus: 0 } },
    { code: 0, data: { rewardList: [{ rewardValue: 2 }] } },
    { code: 0, data: { currentSignStatus: 1, consecutiveDays: 1 } },
  ];
  const result = await signIn(account, async (url, opts) => {
    calls.push(opts);
    return response(replies[index++]);
  });
  assert.match(result, /成功.*\+2 N币/);
  assert.equal(calls[1].method, "POST");
  assert.deepEqual(JSON.parse(calls[1].body), { deviceId: "device" });
  index = 0;
  replies[2].data.currentSignStatus = 0;
  await assert.rejects(
    signIn(account, async () => response(replies[index++])),
    /尚未确认/,
  );
});
test("Invalid status and remote error messages cannot cause a sign or disclose credentials", async () => {
  let count = 0;
  await assert.rejects(
    signIn(account, async () => {
      count++;
      return response({
        code: null,
        msg: "secret",
        data: { currentSignStatus: 0 },
      });
    }),
    /Token/,
  );
  assert.equal(count, 1);
  await assert.rejects(
    signIn(account, async () => response({ code: 0, data: {} })),
    /格式变化/,
  );
  await assert.rejects(
    request("/status", account, "get", undefined, async () => {
      throw Error("secret");
    }),
    /^Error: 网络请求失败或超时$/,
  );
  await assert.rejects(
    request("/status", account, "get", undefined, async () => ({
      ok: false,
      status: 302,
    })),
    /HTTP 302/,
  );
});
test("One account failure does not block another and sends one combined summary", async () => {
  const notices = [];
  const code = await run({
    value: JSON.stringify([
      { deviceId: "a", token: "bad" },
      { deviceId: "b", token: "good" },
    ]),
    fetchImpl: async (url, opts) =>
      response(
        opts.headers.Authorization === "bad"
          ? { code: 401, msg: "bad" }
          : { code: 0, data: { currentSignStatus: 1 } },
      ),
    notifyImpl: async (body) => notices.push(body),
  });
  assert.equal(code, 1);
  assert.equal(notices.length, 1);
  assert.match(notices[0], /账号 2: 已签到/);
  assert.ok(!notices[0].includes("bad"));
});
test("Ninebot uses configured Qinglong system notification", async () => {
  const old = globalThis.QLAPI;
  const calls = [];
  try {
    globalThis.QLAPI = {
      systemNotify: async (payload) => {
        calls.push(payload);
        return { code: 200 };
      },
    };
    await notify("账号 1: 已签到");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].title, "九号出行签到");
  } finally {
    globalThis.QLAPI = old;
  }
});
