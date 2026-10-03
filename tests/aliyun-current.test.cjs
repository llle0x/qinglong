"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path"),
  os = require("node:os");
const runtime = require("../lib/aliyun-runtime.js"),
  cheerio = require("cheerio");
const titles = [
  "发布测评文章并入选",
  "回答被推荐",
  "部署解决方案",
  "观看视频",
  "分享任一文章",
  "关注子社区",
  "收藏任一文章",
  "点赞任一文章",
  "点赞任一回答",
  "关注任一用户",
];
const catalog = titles.map((title) => ({
  title,
  chance: [
    "观看视频",
    "分享任一文章",
    "收藏任一文章",
    "点赞任一文章",
    "点赞任一回答",
  ].includes(title)
    ? "每周最多领取1次积分"
    : "每天最多领取1次积分",
  href: "https://developer.aliyun.com/",
}));
const html = `<script id="script-page-config">window.$PAGE_CONFIG = ${JSON.stringify({ modules: [{ fullName: "@ali/hmod-ace-developer-new-score-get-integral", props: { getScore: catalog } }] })};</script>`;
test("Current official catalog loads as JSON without executing page scripts; format changes fail closed", () => {
  assert.deepEqual(
    runtime.parseTaskCatalog(html, cheerio).map((t) => t.title),
    titles,
  );
  assert.throws(
    () =>
      runtime.parseTaskCatalog(
        '<script id="script-page-config">throw Error("execute")</script>',
        cheerio,
      ),
    /格式/,
  );
  assert.throws(
    () =>
      runtime.parseTaskCatalog(
        '<script id="script-page-config">window.$PAGE_CONFIG={"modules":[]};</script>',
        cheerio,
      ),
    /缺少/,
  );
});
test("Success accepts API JSON and JSONP but rejects explicit denial", () => {
  assert.ok(
    runtime.apiSuccess(
      runtime.decodeJsonResponse('callback({"code":"200","data":1})'),
    ),
  );
  assert.equal(runtime.apiSuccess({ success: false, code: 200 }), false);
  assert.equal(runtime.apiSuccess(undefined), false);
});
test("Weekly checkpoint uses Beijing Monday and isolates accounts without saving Cookies", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aliyun-state-"));
  const file = path.join(dir, "state.json");
  try {
    assert.equal(
      runtime.taskPeriod(
        "每周最多领取1次",
        Date.parse("2026-10-04T23:59:59+08:00"),
      ),
      "2026-09-28",
    );
    assert.equal(
      runtime.taskPeriod(
        "每周最多领取1次",
        Date.parse("2026-10-05T00:00:00+08:00"),
      ),
      "2026-10-05",
    );
    const a = { userId: "123", token: "private-cookie" },
      b = { userId: "456", token: "other-private-cookie" },
      task = catalog.find((t) => t.title === "点赞任一文章");
    const state = runtime.createTaskState(file);
    assert.equal(state.has(a, task), false);
    state.mark(a, task);
    assert.equal(runtime.createTaskState(file).has(a, task), true);
    assert.equal(state.has(b, task), false);
    assert.ok(!fs.readFileSync(file, "utf8").includes("private-cookie"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
async function morningRun({ catalogHtml = html, denyLike = false } = {}) {
  const calls = [],
    notices = [],
    marks = new Set();
  class MockEnv extends runtime.Env {
    wait() {
      return Promise.resolve();
    }
    log() {}
  }
  const fakeRuntime = {
    ...runtime,
    Env: MockEnv,
    createTaskState: () => ({
      has: (a, t) => marks.has(t.title),
      mark: (a, t) => marks.add(t.title),
    }),
    notify: async (title, body) => notices.push(body),
    request: async (opts) => {
      calls.push(opts);
      if (opts.url.includes("/my/score/")) return { code: "200", data: 100 };
      if (opts.url.includes("getUserSpaceSignInDetail"))
        return { code: "200", data: { taskGroupId: "current" } };
      if (opts.url.includes("getTaskGroup"))
        return {
          code: "200",
          data: {
            taskList: [
              {
                finishRule: {
                  actions: [{ actionCode: "signin", objectId: "current" }],
                },
              },
            ],
          },
        };
      if (opts.url.includes("assessSignInBonusQualification"))
        return { code: "200", data: false };
      if (opts.url.endsWith("/mission/daily")) return catalogHtml;
      if (opts.url.endsWith("/indexFeed/"))
        return '<a href="/article/123">Current article</a>';
      if (opts.url.includes("uccPagingComponent/getUser"))
        return 'callback({"code":"200","data":{"uccCsrfToken":"test-csrf"}})';
      if (opts.url.includes("likeOrNotLike"))
        return `callback({"code":"${denyLike ? "500" : "200"}"})`;
      if (opts.url.includes("/ask/?"))
        return '<div class="askProduct-list"><div class="askProduct-item" data-id="123"><div class="askProduct-item-title-text"><h3>Question</h3></div><div class="askProduct-item-info-answer">50</div></div></div>';
      if (opts.url.endsWith("/ask/123"))
        return '<div class="answer-list"><div class="answer-item" data-id="answer-1"></div></div>';
      if (opts.url.endsWith("/csrfToken")) return { token: "test-csrf" };
      if (opts.url.endsWith("/live/"))
        return '<a href="/live/42">Current video</a>';
      if (opts.url.includes("/live/open/detail"))
        return {
          code: "200",
          data: { live: { name: "current-video", duration: 1 } },
        };
      return { code: "200", data: 1, message: "OK" };
    },
  };
  class MockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : ["2026-10-04T07:00:00+08:00"]));
    }
    getHours() {
      return 7;
    }
    static now() {
      return Date.parse("2026-10-04T07:00:00+08:00");
    }
  }
  const fakeProcess = {
    env: {
      aliyunWeb_data: '[{"userId":"123","token":"session=test;"}]',
      aliyunWeb_video: "true",
      aliyunWeb_scene: "true",
    },
  };
  const context = {
    module: { exports: {} },
    process: fakeProcess,
    Date: MockDate,
    console: { log() {}, warn() {}, error() {} },
    require: (name) =>
      name === "./lib/aliyun-runtime.js" ? fakeRuntime : require(name),
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../aliyun_web.js"), "utf8"),
    context,
  );
  await context.module.exports.run();
  const firstCount = calls.filter((c) =>
    c.url.includes("likeOrNotLike"),
  ).length;
  await context.module.exports.run();
  return { calls, notices, marks, firstCount, fakeProcess };
}
test("Morning run uses current weekly tasks and avoids removed comments, scenes and unfavoriting", async () => {
  const result = await morningRun();
  assert.equal(result.firstCount, 3);
  assert.equal(
    result.calls.filter((c) => c.url.includes("likeOrNotLike")).length,
    3,
  );
  assert.equal(result.marks.size, 5);
  assert.ok(
    result.calls.every(
      (c) => !/\/adc\/|ebook|addComment|listUserFavor/.test(c.url),
    ),
  );
  assert.ok(
    result.calls
      .filter((c) => c.url.includes("likeOrNotLike"))
      .every((c) => c.params.status === 0),
  );
  assert.ok(
    result.calls.some(
      (c) => c.url.includes("/live/open/detail") && c.params.id === "42",
    ),
  );
  assert.ok(
    result.calls.every(
      (c) =>
        !c.url.includes("253842") &&
        !Object.values(c.params || {}).includes("253842"),
    ),
  );
  assert.ok(result.notices[0].includes("需手动完成"));
  assert.equal(result.fakeProcess.exitCode, undefined);
});
test("Denied interactions never become weekly checkpoints and can retry later", async () => {
  const result = await morningRun({ denyLike: true });
  assert.equal(result.marks.has("点赞任一文章"), false);
  assert.equal(
    result.calls.filter((c) => c.url.includes("likeOrNotLike")).length,
    6,
  );
  assert.equal(result.fakeProcess.exitCode, 1);
});
test("Unavailable task catalog does not fall back to obsolete reward actions", async () => {
  const result = await morningRun({ catalogHtml: "<html>changed</html>" });
  assert.equal(result.firstCount, 0);
  assert.equal(result.marks.size, 0);
  assert.ok(
    result.calls.every(
      (c) => !/likeOrNotLike|voteAnswer|\/live\/open\//.test(c.url),
    ),
  );
  assert.equal(result.fakeProcess.exitCode, 1);
});
