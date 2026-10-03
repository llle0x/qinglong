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
async function morningRun({
  catalogHtml = html,
  denyLike = false,
  rewardRows = [],
  rewardFailure = false,
  duration = 1,
  networkDelay = 0,
  advanceClock = true,
} = {}) {
  const calls = [],
    notices = [],
    marks = new Set();
  const logs = [];
  let fakeNow = Date.parse("2026-10-04T07:00:00+08:00");
  class MockEnv extends runtime.Env {
    wait(ms) {
      if (advanceClock) fakeNow += Math.max(1000, Number(ms) || 1000);
      return Promise.resolve();
    }
    log(...messages) {
      logs.push(messages.join(" "));
    }
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
      calls.push({ ...opts, time: fakeNow });
      if (advanceClock) fakeNow += networkDelay;
      if (opts.url.includes("listScoreLogByPage"))
        return rewardFailure
          ? { success: false }
          : {
              success: true,
              data: { list: rewardRows, total: rewardRows.length },
            };
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
          data: { live: { name: "current-video", duration } },
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
      return fakeNow;
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
  return { calls, notices, marks, firstCount, fakeProcess, logs };
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

test("Long video uses elapsed clock time, reports only minute progress and never dumps danmu content", async () => {
  const result = await morningRun({ duration: 1309, networkDelay: 1000 });
  assert.ok(result.marks.has("观看视频"));
  const polls = result.calls.filter((c) => c.url.includes("/live/open/danmu"));
  assert.ok(polls.length < Math.ceil(1309 / 3));
  assert.ok(
    result.logs.filter((line) => line.startsWith("视频进度：")).length <= 22,
  );
  assert.ok(result.logs.every((line) => !line.includes("秒弹幕:")));
  const start = result.calls.find((c) => c.url.includes("/live/open/play"));
  const heartbeats = result.calls.filter((c) =>
    c.url.includes("/live/open/online"),
  );
  assert.ok(heartbeats.at(-1).time - start.time <= 1312 * 1000);
});
test("Stalled video clock cannot cause endless polling or a successful weekly checkpoint", async () => {
  const result = await morningRun({ duration: 9, advanceClock: false });
  assert.equal(result.marks.has("观看视频"), false);
  assert.ok(
    result.calls.filter((c) => c.url.includes("/live/open/danmu")).length <= 6,
  );
  assert.ok(result.logs.some((line) => line.includes("视频计时异常")));
});

test("Official received rewards skip interaction even without a local checkpoint", async () => {
  const result = await morningRun({
    rewardRows: [
      {
        content: "完成每周点赞文章",
        gmtCreate: Date.now() - 1000,
        operateType: 1,
        score: 1,
      },
    ],
  });
  assert.equal(result.firstCount, 2);
  assert.ok(
    result.logs.some((line) => line.includes("本周期已有官网奖励领取记录")),
  );
});
test("Failed reward query blocks interactions and video instead of assuming unfinished", async () => {
  const result = await morningRun({ rewardFailure: true });
  assert.equal(result.firstCount, 0);
  assert.equal(result.marks.size, 0);
  assert.ok(
    !result.calls.some((call) => call.url.includes("/live/open/detail")),
  );
});

test("Reward reader covers both months at a week boundary and paginates", async () => {
  const calls = [];
  const row = {
    content: "完成每周点赞文章",
    operateType: 1,
    score: 1,
    gmtCreate: Date.parse("2026-09-30T20:00:00+08:00"),
  };
  const rows = await runtime.readReceivedRewards(async (params) => {
    calls.push(params);
    return {
      success: true,
      data: { list: [row], total: params.month === "2026-09" ? 2 : 1 },
    };
  }, Date.parse("2026-10-04T07:00:00+08:00"));
  assert.deepEqual(
    calls.map((p) => [p.month, p.pageNum]),
    [
      ["2026-09", 1],
      ["2026-09", 2],
      ["2026-10", 1],
    ],
  );
  assert.equal(rows.length, 3);
  await assert.rejects(
    runtime.readReceivedRewards(async () => ({
      success: true,
      data: { list: [], total: 1 },
    })),
    /未完整读取/,
  );
});
test("Reward matching excludes old periods, deductions, unknown and similar names", () => {
  const now = Date.parse("2026-10-04T07:00:00+08:00");
  const task = { title: "点赞任一文章", chance: "每周最多领取1次" };
  const row = {
    content: "完成每周点赞文章",
    operateType: 1,
    score: 1,
    gmtCreate: now - 1000,
  };
  assert.ok(runtime.hasReceivedReward([row], task, now));
  for (const change of [
    { score: -1 },
    { operateType: 2 },
    { content: "完成每周点赞回答" },
    { gmtCreate: now - 7 * 86400000 },
    { gmtCreate: now + 1000 },
  ])
    assert.equal(
      runtime.hasReceivedReward([{ ...row, ...change }], task, now),
      false,
    );
  assert.equal(
    runtime.hasReceivedReward(
      [row],
      { title: "观看视频", chance: "每周" },
      now,
    ),
    false,
  );
});
