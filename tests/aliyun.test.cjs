"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const runtime = require("../lib/aliyun-runtime.js");

test("Aliyun accepts raw Cookies, newline accounts and original BoxJS JSON", () => {
  assert.deepEqual(
    runtime.parseAccounts("a=1;\nb=2;").map((a) => a.token),
    ["a=1;", "b=2;"],
  );
  assert.equal(
    runtime.parseAccounts('[{"token":"session=test;","userId":"123"}]')[0]
      .userId,
    "123",
  );
  assert.equal(runtime.parseAccounts('{"token":"session=test;"}').length, 1);
  assert.deepEqual(runtime.parseAccounts(""), []);
  assert.throws(() => runtime.parseAccounts('[{"token":""}]'), /Cookie/);
});
test("Aliyun validates phase hour and optional task switches", () => {
  runtime.validateSettings({ aliyunWeb_time: "12", aliyunWeb_scene: "false" });
  assert.throws(
    () => runtime.validateSettings({ aliyunWeb_time: "24" }),
    /1–23/,
  );
  assert.throws(
    () => runtime.validateSettings({ aliyunWeb_video: "yes" }),
    /true/,
  );
});
test("Aliyun encodes form body, preserves Cookie and blocks redirects", async () => {
  let seen;
  const result = await runtime.request(
    {
      url: "https://developer.aliyun.com/developer/api/test",
      params: { q: "a&b" },
      body: { comment: "中文&a=b" },
      headers: { Cookie: "session=test;" },
    },
    async (url, opts) => {
      seen = { url, opts };
      return {
        ok: true,
        status: 200,
        text: async () => '{"code":200,"data":1}',
      };
    },
  );
  assert.equal(result.data, 1);
  assert.equal(seen.url.searchParams.get("q"), "a&b");
  assert.equal(new URLSearchParams(seen.opts.body).get("comment"), "中文&a=b");
  assert.equal(seen.opts.headers.Cookie, "session=test;");
  assert.equal(seen.opts.redirect, "manual");
});
test("Aliyun transport returns HTML for Cheerio and rejects unexpected hosts", async () => {
  const text = await runtime.request(
    "https://developer.aliyun.com/article/",
    async () => ({
      ok: true,
      status: 200,
      text: async () => '<div class="test">文章</div>',
    }),
  );
  const cheerio = require("cheerio");
  assert.equal(cheerio.load(text)(".test").text(), "文章");
  await assert.rejects(
    runtime.request("https://other.example.com", () => {
      throw new Error("must not send");
    }),
    /拒绝/,
  );
});
test("Aliyun errors do not expose Cookie through network diagnostics", async () => {
  await assert.rejects(
    runtime.request("https://developer.aliyun.com", async () => {
      throw new Error("session=private;");
    }),
    (error) => error.message === "阿里云接口网络请求失败",
  );
});
test("Aliyun system notification uses existing panel settings with redaction", async () => {
  const envBefore = process.env.aliyunWeb_data;
  const apiBefore = globalThis.QLAPI;
  let delivered;
  process.env.aliyunWeb_data = "session=private-token;";
  globalThis.QLAPI = {
    systemNotify: async (payload) => {
      delivered = payload;
      return { code: 200 };
    },
  };
  try {
    await runtime.notify("阿里云社区", "测试 private-token");
    assert.equal(delivered.title, "阿里云社区");
    assert.ok(!delivered.content.includes("private-token"));
  } finally {
    if (envBefore === undefined) delete process.env.aliyunWeb_data;
    else process.env.aliyunWeb_data = envBefore;
    globalThis.QLAPI = apiBefore;
  }
});
test("Aliyun full afternoon run collects points and exits normally without remote code", async () => {
  const fs = require("node:fs"),
    vm = require("node:vm");
  const calls = [],
    notices = [];
  class MockEnv extends runtime.Env {
    wait() {
      return Promise.resolve();
    }
    log() {}
  }
  const fakeRuntime = {
    ...runtime,
    Env: MockEnv,
    notify: async (title, body) => notices.push({ title, body }),
    request: async (opts) => {
      calls.push(opts);
      if (opts.url.includes("getUserSpaceSignInDetail"))
        return { data: { taskGroupId: "group" } };
      if (opts.url.includes("assessSignInBonusQualification"))
        return { data: false };
      if (opts.url.includes("listUserFavor")) return { data: { list: [] } };
      return { code: "200", data: 5 };
    },
  };
  class MockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : ["2026-10-03T13:00:00+08:00"]));
    }
    static now() {
      return new Date("2026-10-03T13:00:00+08:00").getTime();
    }
  }
  const fakeProcess = {
    env: {
      aliyunWeb_data: "session=test;",
      aliyunWeb_time: "1",
      aliyunWeb_scene: "false",
      aliyunWeb_video: "false",
      aliyunWeb_stock: "false",
    },
  };
  const context = {
    module: { exports: {} },
    process: fakeProcess,
    Date: MockDate,
    console: { log() {}, error() {}, warn() {} },
    require: (name) =>
      name === "./lib/aliyun-runtime.js" ? fakeRuntime : require(name),
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../aliyun_web.js"), "utf8"),
    context,
  );
  await context.module.exports.run();
  assert.ok(calls.some((call) => call.url.includes("receiveAllPendingScore")));
  assert.equal(notices.length, 1);
  assert.match(notices[0].body, /领取积分/);
  assert.ok(
    calls.every(
      (call) =>
        !call.url.includes("github") && call.headers.Cookie === "session=test;",
    ),
  );
  assert.equal(fakeProcess.exitCode, undefined);
});

function sceneHarness(handler, token = "session=test; c_csrf=csrf-test;") {
  const fs = require("node:fs"),
    vm = require("node:vm");
  const calls = [],
    logs = [];
  class MockEnv extends runtime.Env {
    wait() {
      return Promise.resolve();
    }
    log(...args) {
      logs.push(args.join(" "));
    }
  }
  const fakeRuntime = {
    ...runtime,
    Env: MockEnv,
    request: async (opts) => {
      calls.push(opts);
      return handler(opts);
    },
  };
  const context = {
    module: { exports: {} },
    process: { env: {} },
    console: { log() {}, error() {}, warn() {} },
    require: (name) =>
      name === "./lib/aliyun-runtime.js" ? fakeRuntime : require(name),
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../aliyun_web.js"), "utf8") +
      '\n$.Cheerio = require("cheerio");',
    context,
  );
  return {
    account: new context.module.exports.UserInfo({ token }),
    calls,
    logs,
  };
}
test("Empty or invalid scene lists stop without querying undefined IDs", async () => {
  for (const response of [
    { data: { list: [] } },
    {},
    { data: { list: [{ name: "no ID" }] } },
  ]) {
    const { account, calls, logs } = sceneHarness(() => response);
    assert.equal(await account.doScene(), false);
    assert.equal(calls.length, 1);
    assert.equal(account.ckStatus, false);
    assert.ok(logs.some((line) => line.includes("已停止")));
    assert.ok(logs.every((line) => !line.includes("ReferenceError")));
  }
});
test("Scene status retries are bounded and stop after three attempts", async () => {
  const { account, calls } = sceneHarness((opts) =>
    opts.url.endsWith("getSceneList")
      ? { data: { list: [{ id: "scene-1", name: "test" }] } }
      : { data: { developerAdcExperienceStatusVO: { buttonCode: "2" } } },
  );
  assert.equal(await account.doScene(), false);
  assert.equal(calls.filter((c) => c.url.endsWith("getSceneList")).length, 3);
  assert.equal(calls.length, 6);
});
test("Scene missing CSRF and malformed initialization do not start resources", async () => {
  const missing = sceneHarness(() => {
    throw Error("must not call");
  }, "session=test;");
  assert.equal(await missing.account.doScene(), false);
  assert.equal(missing.calls.length, 0);
  const invalid = sceneHarness((opts) =>
    opts.url.endsWith("getSceneList")
      ? { data: { list: [{ id: "scene-1" }] } }
      : opts.url.endsWith("getSceneDetailPageInfoById")
        ? {
            data: {
              id: "scene-1",
              developerAdcExperienceStatusVO: { buttonCode: "1" },
            },
          }
        : {},
  );
  assert.equal(await invalid.account.doScene(), false);
  assert.equal(invalid.calls.length, 3);
});
test("Valid scenes start and close once; failed startup does not trigger close", async () => {
  for (const startCode of ["200", "500"]) {
    const { account, calls } = sceneHarness((opts) => {
      if (opts.url.endsWith("getSceneList"))
        return { data: { list: [{ id: "scene-1" }] } };
      if (opts.url.endsWith("getSceneDetailPageInfoById"))
        return {
          data: {
            id: "scene-1",
            developerAdcExperienceStatusVO: { buttonCode: "1" },
          },
        };
      if (opts.url.endsWith("getSceneStartPageInfoById"))
        return { data: { resourceFrom: ["2"] } };
      return {
        code: opts.url.endsWith("startSceneById") ? startCode : "200",
        message: "test",
      };
    });
    assert.equal(await account.doScene(), startCode === "200");
    assert.equal(
      calls.filter((c) => c.url.endsWith("closeSceneById")).length,
      startCode === "200" ? 1 : 0,
    );
    assert.equal(calls[0].params.tags, ",");
    const start = calls.find((c) => c.url.endsWith("startSceneById"));
    assert.equal(start.body.id, "scene-1");
    assert.equal(start.headers.H_csrf, "csrf-test");
  }
});
test("Ask list uses canonical slash URL and never parses failed responses as HTML", async () => {
  const html =
    '<div class="askProduct-list"><div class="askProduct-item" data-id="ask-1"><div class="askProduct-item-title-text"><h3>test</h3></div><div class="askProduct-item-info-answer">2</div></div></div>';
  const valid = sceneHarness(() => html);
  assert.equal((await valid.account.getAsks()).id, "ask-1");
  assert.match(valid.calls[0].url, /\/ask\/\?pageNum=/);
  const failed = sceneHarness(() => {
    throw Error("阿里云接口 HTTP 301");
  });
  assert.equal(await failed.account.getAsks(), null);
  assert.ok(failed.logs.every((line) => !line.includes("cheerio.load()")));
});

test("Current task parsing skips expired and malformed rules without submitting empty actions", async () => {
  const { account, calls } = sceneHarness(() => ({
    data: {
      taskList: [
        {
          gmtEnableEnd: 1,
          finishRule: '{"actions":[{"actionCode":"old","objectId":"expired"}]}',
        },
        { finishRule: "{invalid}" },
        {
          finishRule:
            "{&quot;actions&quot;:[{&quot;actionCode&quot;:&quot;sign&quot;,&quot;activityCode&quot;:&quot;current&quot;,&quot;objectId&quot;:&quot;task-1&quot;}]}",
        },
      ],
    },
  }));
  const task = await account.getTasks("current-group");
  assert.equal(task.objectId, "task-1");
  assert.equal(task.activityCode, "current");
  assert.equal(calls[0].params.groupId, "current-group");
  const empty = sceneHarness(() => ({ data: { taskList: [] } }));
  assert.equal(await empty.account.getTasks("group"), null);
  assert.equal(await empty.account.signin(null), false);
  assert.equal(empty.calls.length, 1);
});
test("Sign-in logs success only when its API returns success", async () => {
  for (const code of ["200", "500"]) {
    const { account, logs } = sceneHarness(() => ({
      code,
      message: "test-result",
    }));
    assert.equal(
      await account.signin({ actionCode: "sign", objectId: "task" }),
      code === "200",
    );
    assert.equal(
      logs.some((line) => line.startsWith("✅")),
      code === "200",
    );
  }
});
