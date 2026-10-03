/*
new Env('阿里云社区')
cron: 0 7,13 * * *
原作者：Leiyiyan。来源：https://github.com/leiyiyan/resource/blob/main/script/aliyun_web/aliyun_web.js
青龙适配修改：llle0x，2026-10-03。保留原任务流程，解码字符串以便检查。
依赖：cheerio@1.0.0；Node.js >= 18.17。变量：aliyunWeb_data。
任务包含点赞、收藏、评论、分享，以及可选场景、视频和库存查询。
原脚本使用说明及声明见 UPSTREAM-ALIYUN.md；本适配不改变原作者声明。
*/
"use strict";
process.env.TZ = process.env.aliyunWeb_timezone || "Asia/Shanghai";
const runtime = require("./lib/aliyun-runtime.js");
const Env = runtime.Env;
const $ = new Env("阿里云社区"),
  ckName = "aliyunWeb_data",
  controlTime =
    ($["isNode"]()
      ? process["env"]["aliyunWeb_time"]
      : $["getdata"]("aliyunWeb_time")) || "12",
  controlScene =
    ($["isNode"]()
      ? process["env"]["aliyunWeb_scene"]
      : $["getdata"]("aliyunWeb_scene")) || "false",
  controlStock =
    ($["isNode"]()
      ? process["env"]["aliyunWeb_stock"]
      : $["getdata"]("aliyunWeb_stock")) || "false",
  controlVideo =
    ($["isNode"]()
      ? process["env"]["aliyunWeb_video"]
      : $["getdata"]("aliyunWeb_video")) || "false",
  Notify = 0x1,
  notify = $["isNode"]() ? {} : "";
let envSplitor = ["@"];
var userCookie =
  ($["isNode"]() ? process["env"][ckName] : $["getdata"](ckName)) || "";
let userList = [],
  userIdx = 0x0,
  userCount = 0x0;
const taskGroup = [
  { code: "", name: "我的社区" },
  { code: "ecs", name: "弹性计算" },
  { code: "computenest", name: "计算巢" },
  { code: "yitian", name: "倚天" },
  { code: "wuying", name: "无影" },
  { code: "cloudnative", name: "云原生" },
  { code: "storage", name: "云存储" },
  { code: "luoshen", name: "飞天洛神云网络" },
  { code: "database", name: "数据库" },
  { code: "polardb", name: "PolarDB开源" },
  { code: "bigdata", name: "大数据与机器学习" },
  { code: "modelscope", name: "ModelScope模型即服务" },
  { code: "viapi", name: "视觉智能" },
  { code: "dns", name: "域名解析DNS" },
  { code: "iot", name: "物联网" },
  { code: "devops", name: "云效DevOps" },
  { code: "aliyun_linux", name: "龙蜥操作系统" },
  { code: "modelstudio", name: "百炼大模型" },
  { code: "tongyi", name: "通义大模型" },
];
(($["is_debug"] = "false"), ($["notifyList"] = []), ($["notifyMsg"] = []));
let pendingScore = 0x0,
  userScore = 0x0,
  sceneId = "",
  resourceFrom = "",
  sectionId = "",
  ip = "";
async function main() {
  const _0x386317 = null,
    _0x14727e = {
      xuiao: "\n================== 任务 ==================\n",
      NywEO: function (_0x1c4f8e, _0xc27505) {
        return _0x1c4f8e < _0xc27505;
      },
      TTxTK: "ebook",
      FWaSG: "aliyun-public-favorite",
      jGpQE: function (_0x51fe2e, _0x3c7dcf) {
        return _0x51fe2e === _0x3c7dcf;
      },
      ZTdtz: "aliyun-public-share",
      svNIw: "ask",
      bSdCA: function (_0x33688e, _0x918b75) {
        return _0x33688e(_0x918b75);
      },
      mJvCL: "aliyun-public-like",
      hRfil: function (_0x18d20c, _0x223927) {
        return _0x18d20c || _0x223927;
      },
      xOqdl: function (_0x1100e8, _0x74e128) {
        return _0x1100e8(_0x74e128);
      },
    };
  try {
    $["log"](_0x14727e["xuiao"]);
    for (let _0xc17500 of userList) {
      (console["log"]("🔷账号" + _0xc17500["index"] + " >> Start work"),
        console["log"]("随机延迟" + _0xc17500["getRandomTime"]() + "秒"));
      const _0x1c4f51 = Date["now"]();
      userScore = (await _0xc17500["interactData"]()) ?? {};
      if (_0xc17500["ckStatus"]) {
        if (
          _0x14727e["NywEO"](
            _0x1c4f51,
            new Date(
              new Date()["setHours"](Math["floor"](controlTime), 0x0, 0x0, 0x0),
            )["getTime"](),
          )
        ) {
          for (let _0x57933f of taskGroup) {
            const _0x51d904 = await _0xc17500["getUserSpaceSignInDetail"](
                _0x57933f["code"],
              ),
              _0x33a038 = await _0xc17500["getTasks"](_0x51d904);
            (await _0xc17500["signin"](_0x33a038, _0x57933f["name"]),
              await $["wait"](_0xc17500["getRandomTime"]()));
            const _0x17a4ce = await _0xc17500["assessSignInBonusQualification"](
              _0x51d904,
              _0x57933f["name"],
            );
            (await $["wait"](_0xc17500["getRandomTime"]()),
              _0x17a4ce &&
                (await _0xc17500["receiveSignInBonus"](
                  _0x51d904,
                  _0x57933f["name"],
                ),
                await $["wait"](_0xc17500["getRandomTime"]())));
          }
          const _0x50061a = await _0xc17500["getEbooks"]();
          await $["wait"](_0xc17500["getRandomTime"]());
          const _0x18bdd1 = await _0xc17500["getCsrfToken"](
            _0x50061a,
            _0x14727e["TTxTK"],
          );
          (await $["wait"](_0xc17500["getRandomTime"]()),
            await _0xc17500["addBookComment"](_0x50061a, _0x18bdd1),
            await $["wait"](_0xc17500["getRandomTime"]()));
          for (
            let _0xc370fb = 0x0;
            _0x14727e["NywEO"](_0xc370fb, 0x5);
            _0xc370fb++
          ) {
            const _0x4f28c6 = await _0xc17500["getArticles"]();
            (await $["wait"](_0xc17500["getRandomTime"]()),
              await _0xc17500["likeOrNotLike"](
                _0x4f28c6,
                "aliyun-public-like",
                0x0,
              ),
              await $["wait"](_0xc17500["getRandomTime"]()),
              await _0xc17500["likeOrNotLike"](
                _0x4f28c6,
                _0x14727e["FWaSG"],
                0x0,
              ),
              await $["wait"](_0xc17500["getRandomTime"]()));
            _0x14727e["jGpQE"](_0xc370fb, 0x0) &&
              (await _0xc17500["addComment"](_0x4f28c6),
              await $["wait"](_0xc17500["getRandomTime"]()),
              await _0xc17500["likeOrNotLike"](
                _0x4f28c6,
                _0x14727e["ZTdtz"],
                0x0,
              ),
              await $["wait"](_0xc17500["getRandomTime"]()));
            const _0x55e5ff = await _0xc17500["getAsks"]();
            await $["wait"](_0xc17500["getRandomTime"]());
            if (_0x55e5ff && _0x55e5ff?.["id"]) {
              const _0x4779c0 = await _0xc17500["getCsrfToken"](
                _0x55e5ff["id"],
                _0x14727e["svNIw"],
              );
              await $["wait"](_0xc17500["getRandomTime"]());
              const _0x3dea62 = await _0xc17500["getAskDetail"](_0x55e5ff);
              (await $["wait"](_0xc17500["getRandomTime"]()),
                _0x3dea62 &&
                  (await _0xc17500["voteAnswer"](
                    _0x55e5ff["id"],
                    _0x3dea62,
                    _0x4779c0,
                    0x1,
                  ),
                  await $["wait"](_0xc17500["getRandomTime"]())));
            }
          }
          (JSON["parse"](controlScene) &&
            (await _0xc17500["doScene"](),
            await $["wait"](_0xc17500["getRandomTime"]())),
            JSON["parse"](controlVideo) &&
              (await _0xc17500["playVideo"](),
              await $["wait"](_0xc17500["getRandomTime"]())),
            JSON["parse"](controlStock) && (await _0xc17500["getGroupItems"]()),
            (pendingScore = await _0xc17500["getUserTotalPendingScore"]()),
            ($["title"] = "获得待领取积分: " + pendingScore),
            _0x14727e["bSdCA"](
              DoubleLog,
              "🎉 当前积分: " + userScore + ", 待领取积分: " + pendingScore,
            ));
        } else {
          for (let _0x4d3f34 of taskGroup) {
            const _0x5459c9 = await _0xc17500["getUserSpaceSignInDetail"](
                _0x4d3f34["code"],
              ),
              _0x842398 = await _0xc17500["assessSignInBonusQualification"](
                _0x5459c9,
                _0x4d3f34["name"],
              );
            (await $["wait"](_0xc17500["getRandomTime"]()),
              _0x842398 &&
                (await _0xc17500["receiveSignInBonus"](
                  _0x5459c9,
                  _0x4d3f34["name"],
                ),
                await $["wait"](_0xc17500["getRandomTime"]())));
          }
          ((pendingScore = await _0xc17500["getUserTotalPendingScore"]()),
            await $["wait"](_0xc17500["getRandomTime"]()),
            await _0xc17500["collect"](),
            await $["wait"](_0xc17500["getRandomTime"]()),
            await $["wait"](_0xc17500["getRandomTime"]()));
          const _0x1f9cba = (await _0xc17500["getFavors"]()) ?? [];
          await $["wait"](_0xc17500["getRandomTime"]());
          if (_0x1f9cba["length"])
            for (let _0x375857 of _0x1f9cba) {
              (await _0xc17500["likeOrNotLike"](
                _0x375857["objectId"],
                _0x14727e["mJvCL"],
                0x1,
              ),
                await $["wait"](_0xc17500["getRandomTime"]()),
                await _0xc17500["likeOrNotLike"](
                  _0x375857["objectId"],
                  _0x14727e["FWaSG"],
                  0x1,
                ),
                await $["wait"](_0xc17500["getRandomTime"]()));
            }
          JSON["parse"](controlStock) && (await _0xc17500["getGroupItems"]());
          let _0x2764b0 = (await _0xc17500["interactData"]()) ?? {};
          (($["title"] =
            "本次运行共获得" + _0x14727e["hRfil"](pendingScore, 0x0) + "积分"),
            _0x14727e["xOqdl"](
              DoubleLog,
              "🎉\x20领取积分:\x20" +
                pendingScore +
                ",\x20当前积分:\x20" +
                _0x2764b0,
            ));
        }
      } else
        $["notifyMsg"]["push"](
          "⛔️\x20账号" +
            (_0xc17500["userName"] || _0xc17500["index"]) +
            "\x20>>\x20Check\x20ck\x20error!",
        );
      ($["notifyList"]["push"]({
        id: _0xc17500["index"],
        avatar: _0xc17500["avatar"],
        message: $["notifyMsg"],
      }),
        ($["notifyMsg"] = []));
    }
  } catch (_0x1fd506) {
    $["log"]("⛔️ main run error => " + _0x1fd506);
    throw new Error("⛔️ main run error => " + _0x1fd506);
  }
}
class UserInfo {
  constructor(_0x9880) {
    const _0x1b5a5b = null,
      _0x1b91e5 = {
        padKy: "string",
        gOZBQ: function (_0x472e5b, _0x31b359) {
          return _0x472e5b + _0x31b359;
        },
        BDVnj: function (_0x297e9f, _0x556550) {
          return _0x297e9f(_0x556550);
        },
        FbGPj: function (_0xe11f28, _0x4faf6c, _0x51275d) {
          return _0xe11f28(_0x4faf6c, _0x51275d);
        },
        XYYCE: "https://developer.aliyun.com/developer/api",
        adBub:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        xOFKE: "https://developer.aliyun.com/",
      };
    ((this["index"] = ++userIdx),
      (this["token"] = _0x9880["token"] || _0x9880),
      (this["userId"] = _0x9880["userId"]),
      (this["userName"] = _0x9880["userName"]),
      (this["avatar"] = _0x9880["avatar"]),
      (this["ckStatus"] = !![]),
      (this["baseUrl"] = ""),
      (this["host"] = _0x1b91e5["XYYCE"]),
      (this["headers"] = {
        Cookie: this["token"],
        "User-Agent": _0x1b91e5["adBub"],
        Referer: _0x1b91e5["xOFKE"],
      }),
      (this["getRandomTime"] = () => randomInt(0x1, 0x2)),
      (this["fetch"] = async (_0x5e81da) => {
        const _0x3648ab = null;
        try {
          if (typeof _0x5e81da === _0x1b91e5["padKy"])
            _0x5e81da = { url: _0x5e81da };
          if (_0x5e81da?.["url"]?.["startsWith"]("/"))
            _0x5e81da["url"] = _0x1b91e5["gOZBQ"](
              this["host"],
              _0x5e81da["url"],
            );
          const _0x443266 = await _0x1b91e5["BDVnj"](Request, {
            ..._0x5e81da,
            headers: _0x5e81da["headers"] || this["headers"],
            url: _0x5e81da["url"] || this["baseUrl"],
          });
          _0x1b91e5["FbGPj"](
            debug,
            _0x443266,
            _0x5e81da?.["url"]
              ?.["replace"](/\/+$/, "")
              [
                "substring"
              ](_0x1b91e5["gOZBQ"](_0x5e81da?.["url"]?.["lastIndexOf"]("/"), 0x1)),
          );
          if (_0x443266?.["code"] == 0x9c41)
            throw new Error(_0x443266?.["message"] || "用户需要去登录");
          return _0x443266;
        } catch (_0x4440cb) {
          ((this["ckStatus"] = ![]),
            $["log"]("⛔️ 请求发起失败！" + _0x4440cb));
        }
      }));
  }
  async ["getUser"]() {
    const _0x443c67 = null;
    try {
      const _0x44d6d4 = { url: "/my/user/getUser", type: "get" };
      await this["fetch"](_0x44d6d4);
    } catch (_0x52156c) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取签到任务列表失败! " + _0x52156c));
    }
  }
  async ["assessSignInBonusQualification"](_0x2c7c66, _0x574373) {
    const _0x423ca5 = null;
    if (!_0x2c7c66) return null;
    try {
      const _0x271b06 = {
        url: "/sign/assessSignInBonusQualification",
        type: "get",
        params: { taskGroupId: _0x2c7c66 },
      };
      let _0x4ba667 = await this["fetch"](_0x271b06);
      return _0x4ba667?.["data"];
    } catch (_0x57c4e2) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️\x20查询领奖条件失败!\x20" + _0x57c4e2));
    }
  }
  async ["receiveSignInBonus"](_0x7495b, _0x4948dd) {
    const _0x2e8422 = null,
      _0x4f6250 = {
        YXKip: "/sign/receiveSignInBonus",
        QDRbs: "post",
        zwEXX: function (_0x4be6bb, _0x1c9d58) {
          return _0x4be6bb == _0x1c9d58;
        },
        TgLMq: "200",
        FYyWT: "default",
      };
    try {
      const _0x5a858a = {
        url: _0x4f6250["YXKip"],
        type: _0x4f6250["QDRbs"],
        dataType: "form",
        body: { taskGroupId: _0x7495b },
      };
      let _0x302b4f = await this["fetch"](_0x5a858a);
      if (_0x4f6250["zwEXX"](_0x302b4f?.["code"], _0x4f6250["TgLMq"])) {
        const _0x1ea936 = _0x302b4f?.["data"] || 0x0;
        $["log"](
          "✅ 抽奖 - " +
            (_0x4948dd || _0x4f6250["FYyWT"]) +
            ":\x20获得\x20" +
            _0x1ea936 +
            " 积分",
        );
      } else
        $["log"](
          "⛔️ 抽奖 - " +
            (_0x4948dd || _0x4f6250["FYyWT"]) +
            ":\x20" +
            _0x302b4f?.["message"],
        );
    } catch (_0x4e0a4f) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️\x20抽奖失败!\x20" + _0x4e0a4f));
    }
  }
  async ["getUserSpaceSignInDetail"](_0x31cf97) {
    const _0x478e59 = null,
      _0x5edd7c = { ZrHUM: "get" };
    try {
      const _0x1bb131 = {
        url: "/sign/getUserSpaceSignInDetail",
        type: _0x5edd7c["ZrHUM"],
        params: { excode: _0x31cf97 },
      };
      let _0x38063a = await this["fetch"](_0x1bb131);
      const _0x66769 = _0x38063a?.["data"]?.["taskGroupId"] || null;
      return _0x66769;
    } catch (_0x1d6ab4) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取签到任务列表失败! " + _0x1d6ab4));
    }
  }
  async ["getTasks"](_0x4716cf) {
    const _0x263cb5 = null,
      _0x469eff = {
        uxbgL: "get",
        LWPjm: function (_0x48f3d1, _0x3247de) {
          return _0x48f3d1 >= _0x3247de;
        },
        fgwjk: function (_0x3e5654, _0x488e02) {
          return _0x3e5654 <= _0x488e02;
        },
      };
    if (!_0x4716cf) return null;
    try {
      const _0x5ad647 = {
        url: "/task/getTaskGroup?groupId=" + _0x4716cf,
        type: _0x469eff["uxbgL"],
      };
      let _0x2191eb = await this["fetch"](_0x5ad647);
      const _0x58d890 = _0x2191eb?.["data"]?.["taskList"];
      let _0x477196 = {};
      if (_0x58d890["length"]) {
        const _0x21834a = new Date()["getTime"]();
        for (let _0x5889ef of _0x58d890) {
          if (
            _0x469eff["LWPjm"](_0x21834a, _0x5889ef["gmtEnableStart"]) &&
            _0x469eff["fgwjk"](_0x21834a, _0x5889ef["gmtEnableEnd"])
          ) {
            const _0x348e5d = JSON["parse"](
              _0x5889ef["finishRule"]["replace"](/&quot;/g, "\x22"),
            );
            ((_0x477196["actionCode"] =
              _0x348e5d["actions"][0x0]["actionCode"]),
              (_0x477196["activityCode"] =
                _0x348e5d["actions"][0x0]["actionCode"]),
              (_0x477196["objectId"] = _0x348e5d["actions"][0x0]["objectId"]));
          }
        }
      }
      return _0x477196;
    } catch (_0x570364) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取签到任务列表失败! " + _0x570364));
    }
  }
  async ["signin"](_0x21e749, _0x2d26f7) {
    const _0x5d0751 = null,
      _0x43ef6f = { DukOp: "default", MMtHY: "post", LRljz: "form" };
    if (!_0x21e749) {
      $["log"](
        "✅\x20签到\x20-\x20" +
          (_0x2d26f7 || _0x43ef6f["DukOp"]) +
          ": 该社区无签到任务",
      );
      return;
    }
    try {
      const _0x26ea71 = {
        url: "/task/actionLog",
        type: _0x43ef6f["MMtHY"],
        dataType: _0x43ef6f["LRljz"],
        body: _0x21e749,
      };
      let _0x4dddd7 = await this["fetch"](_0x26ea71);
      $["log"](
        "✅ 签到 - " +
          (_0x2d26f7 || _0x43ef6f["DukOp"]) +
          ":\x20" +
          _0x4dddd7?.["message"],
      );
    } catch (_0x3f0eb8) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 签到失败! " + _0x3f0eb8));
    }
  }
  async ["getArticles"]() {
    const _0x222440 = null,
      _0x516d78 = {
        SFRut: function (_0x57cae3, _0x4b7c58) {
          return _0x57cae3(_0x4b7c58);
        },
        QZOAr: "data-id",
        uPDAJ: function (_0x228e0e, _0xc3a8e5) {
          return _0x228e0e(_0xc3a8e5);
        },
        IzCOg: ".feed-item-content-title h3",
        tUyHv: function (_0x21d975, _0x2e5ffb) {
          return _0x21d975 + _0x2e5ffb;
        },
        XbFSl: "get",
        ZlwUl: ".community-detail-content",
        ItYwU: function (_0x42b248, _0x1146e1) {
          return _0x42b248 * _0x1146e1;
        },
      };
    try {
      const _0x177237 = _0x516d78["tUyHv"](
          Math["floor"](Math["random"]() * 0x1f),
          0x1,
        ),
        _0x524574 = {
          url:
            "https://developer.aliyun.com/group/aliware/article_hot?pageNum=" +
            _0x177237,
          type: _0x516d78["XbFSl"],
        };
      let _0x3c4654 = await this["fetch"](_0x524574);
      const _0x4d1f6a = $["Cheerio"]["load"](_0x3c4654),
        _0x6396d2 = _0x4d1f6a(_0x516d78["ZlwUl"]),
        _0xa1b2e2 = _0x6396d2["find"](".community-list")
          ["map"]((_0x4f7801, _0x11a8ba) => {
            const _0x3b19d6 = null;
            return {
              id: _0x516d78["SFRut"](_0x4d1f6a, _0x11a8ba)
                ["find"](".feed-item")
                ["attr"](_0x516d78["QZOAr"]),
              name: _0x516d78["uPDAJ"](_0x4d1f6a, _0x11a8ba)
                ["find"](_0x516d78["IzCOg"])
                ["text"](),
            };
          })
          ["get"](),
        _0x4c4814 =
          _0xa1b2e2[
            Math["floor"](
              _0x516d78["ItYwU"](Math["random"](), _0xa1b2e2["length"]),
            )
          ],
        { id: _0xc6f1e8, name: _0x328275 } = _0x4c4814;
      return (
        $["log"]("✅ 随机获取文章id: " + _0xc6f1e8 + ", 标题: " + _0x328275),
        _0xc6f1e8
      );
    } catch (_0x2f4026) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取文章列表失败! " + _0x2f4026));
    }
  }
  async ["getEbooks"]() {
    const _0xbcd128 = null,
      _0x4b4397 = {
        qStcG: function (_0x19562f, _0x1a5b4d) {
          return _0x19562f(_0x1a5b4d);
        },
        kurQx: "/ebook/",
        GuYss: function (_0x81900c, _0x3e1aae) {
          return _0x81900c(_0x3e1aae);
        },
        bzhix: ".ebook-home-title",
        ULwpc: function (_0x5975d4, _0x34f16b) {
          return _0x5975d4 + _0x34f16b;
        },
        JCQMO: function (_0x57bc07, _0x3ee868) {
          return _0x57bc07 * _0x3ee868;
        },
        ZiJOK: "get",
        ZBwTI: function (_0x3fa484, _0x90dea0) {
          return _0x3fa484(_0x90dea0);
        },
        pnzvw: ".ebook-home-list",
        QGFKq: function (_0x3dd716, _0x3ce855) {
          return _0x3dd716 * _0x3ce855;
        },
      };
    try {
      const _0x17f70b = _0x4b4397["ULwpc"](
          Math["floor"](_0x4b4397["JCQMO"](Math["random"](), 0x1f5)),
          0x1,
        ),
        _0x5973f2 = {
          url: "https://developer.aliyun.com/ebook/index/__0_0_0_" + _0x17f70b,
          type: _0x4b4397["ZiJOK"],
        };
      let _0x276984 = await this["fetch"](_0x5973f2);
      const _0x1c9be6 = $["Cheerio"]["load"](_0x276984),
        _0x407fa8 = _0x4b4397["ZBwTI"](_0x1c9be6, _0x4b4397["pnzvw"]),
        _0x34b2f1 = _0x407fa8["find"](".ebook-home-item")
          ["map"]((_0x20d7cc, _0x8c4006) => {
            const _0x21292f = null;
            return {
              id: _0x4b4397["qStcG"](_0x1c9be6, _0x8c4006)
                ["attr"]("href")
                ["replace"](_0x4b4397["kurQx"], ""),
              name: _0x4b4397["GuYss"](_0x1c9be6, _0x8c4006)
                ["find"](_0x4b4397["bzhix"])
                ["text"](),
            };
          })
          ["get"](),
        _0x215663 =
          _0x34b2f1[
            Math["floor"](
              _0x4b4397["QGFKq"](Math["random"](), _0x34b2f1["length"]),
            )
          ],
        { id: _0xc01def, name: _0x362d2c } = _0x215663;
      return (
        $["log"]("✅ 随机电子书id: " + _0xc01def + ", 标题: " + _0x362d2c),
        _0xc01def
      );
    } catch (_0xfcb8a6) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取电子书列表失败! " + _0xfcb8a6));
    }
  }
  async ["getAsks"]() {
    const _0x2a639b = null,
      _0x2d934c = {
        idPFR: function (_0x781559, _0x189325) {
          return _0x781559(_0x189325);
        },
        wifgB: function (_0x5f4b30, _0x82768c) {
          return _0x5f4b30(_0x82768c);
        },
        vCapZ: ".askProduct-item-title-text h3",
        UkTaX: function (_0x5f4213, _0x5e64d9) {
          return _0x5f4213(_0x5e64d9);
        },
        twSUE: ".askProduct-item-info-answer",
        LXbVE: function (_0x5fea47, _0x5d8160) {
          return _0x5fea47 + _0x5d8160;
        },
        qDgPA: function (_0x40cb4e, _0x5a357c) {
          return _0x40cb4e * _0x5a357c;
        },
        BhNap: "get",
        MDVED: ".askProduct-list",
        WYycT: ".askProduct-item",
      };
    try {
      const _0x21f883 = _0x2d934c["LXbVE"](
          Math["floor"](_0x2d934c["qDgPA"](Math["random"](), 0x1f)),
          0x1,
        ),
        _0x35d953 = {
          url: "https://developer.aliyun.com/ask?pageNum=" + _0x21f883,
          type: _0x2d934c["BhNap"],
        };
      let _0x21a196 = await this["fetch"](_0x35d953);
      const _0x3f3437 = $["Cheerio"]["load"](_0x21a196),
        _0x5341fa = _0x2d934c["wifgB"](_0x3f3437, _0x2d934c["MDVED"]),
        _0x1772a5 = _0x5341fa["find"](_0x2d934c["WYycT"])
          ["map"]((_0x3bf0f7, _0x580a7c) => {
            const _0x22342a = null;
            return {
              id:
                _0x2d934c["idPFR"](_0x3f3437, _0x580a7c)["attr"]("data-id") ||
                "",
              name:
                _0x2d934c["wifgB"](_0x3f3437, _0x580a7c)
                  ["find"](_0x2d934c["vCapZ"])
                  ["text"]() || "",
              answer:
                parseInt(
                  _0x2d934c["UkTaX"](_0x3f3437, _0x580a7c)
                    ["find"](_0x2d934c["twSUE"])
                    ["text"](),
                ) || "",
            };
          })
          ["filter"]((_0xfd811d, _0x3ac6dc) => _0x3ac6dc["answer"] > 0x0)
          ["get"](),
        _0x27367d =
          _0x1772a5[Math["floor"](Math["random"]() * _0x1772a5["length"])];
      if (_0x27367d?.["id"] && _0x27367d?.["name"]) {
        const { id: _0x14c0c6, name: _0x34c830 } = _0x27367d;
        return (
          $["log"]("✅ 随机获取问答id: " + _0x14c0c6 + ", 标题: " + _0x34c830),
          _0x27367d
        );
      }
      return null;
    } catch (_0x2c7844) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取问答列表失败! " + _0x2c7844));
    }
  }
  async ["getAskDetail"](_0x3c853b) {
    const _0x133191 = null,
      _0x1108c9 = {
        WFMNv: function (_0x20483a, _0x54875b) {
          return _0x20483a(_0x54875b);
        },
        JWibK: "data-id",
        iXboJ: function (_0x4f3ff8, _0x14d57e) {
          return _0x4f3ff8(_0x14d57e);
        },
        YWzNW: ".answer-list",
        NUXGX: ".answer-item",
        pOoay: function (_0x58639d, _0x3e11d8) {
          return _0x58639d * _0x3e11d8;
        },
      };
    try {
      const _0x4d9fd4 = {
        url: "https://developer.aliyun.com/ask/" + _0x3c853b["id"],
        type: "get",
      };
      let _0x4a8d4d = await this["fetch"](_0x4d9fd4);
      const _0x197405 = $["Cheerio"]["load"](_0x4a8d4d),
        _0x95c7bb = _0x1108c9["iXboJ"](_0x197405, _0x1108c9["YWzNW"]),
        _0x496a64 = _0x95c7bb["find"](_0x1108c9["NUXGX"])
          ["map"]((_0x290648, _0x492ae4) => {
            const _0x2ecb22 = null;
            return {
              id:
                _0x1108c9["WFMNv"](_0x197405, _0x492ae4)["attr"](
                  _0x1108c9["JWibK"],
                ) || "",
            };
          })
          ["get"](),
        _0x777a55 =
          _0x496a64[
            Math["floor"](
              _0x1108c9["pOoay"](Math["random"](), _0x3c853b["answer"]),
            )
          ];
      if (_0x777a55) {
        const { id: _0x2a3950 } = _0x777a55;
        return (
          $["log"]("✅\x20随机获取问题问答id:\x20" + _0x2a3950),
          _0x2a3950
        );
      }
      return null;
    } catch (_0x49424e) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 随机获取问题问答失败! " + _0x49424e));
    }
  }
  async ["likeOrNotLike"](_0x5af432, _0x2ed0dc, _0x3541c6) {
    const _0x10ed7c = null,
      _0x1e0e13 = {
        Pffrn: "https://ucc.aliyun.com/uccPagingComponent/likeOrNotLike",
        nGUEP: "get",
        sTsDx: "yq-article",
        pvSTb: function (_0x571a67) {
          return _0x571a67();
        },
        cLyIc: function (_0x593c61, _0x15d89b) {
          return _0x593c61 + _0x15d89b;
        },
        pIRta: function (_0x3c3e5f, _0x202dfc) {
          return _0x3c3e5f === _0x202dfc;
        },
        keamp: "aliyun-public-like",
        cdZJP: "aliyun-public-favorite",
        gXewl: "aliyun-public-share",
      };
    try {
      const _0x4af17a = {
        url: _0x1e0e13["Pffrn"],
        type: _0x1e0e13["nGUEP"],
        params: {
          bizCategory: _0x1e0e13["sTsDx"],
          actionCode: _0x2ed0dc,
          objectId: _0x5af432,
          status: _0x3541c6,
          uccCsrfToken: await this["getUccCsrfToken"](),
          callback: _0x1e0e13["pvSTb"](getCallback),
        },
      };
      await this["fetch"](_0x4af17a);
      let _0x33d148 = _0x1e0e13["cLyIc"](
        "文章",
        _0x1e0e13["pIRta"](_0x3541c6, 0x1) ? "取消" : "",
      );
      if (_0x1e0e13["pIRta"](_0x2ed0dc, _0x1e0e13["keamp"]))
        _0x33d148 += "点赞";
      else {
        if (_0x2ed0dc === _0x1e0e13["cdZJP"]) _0x33d148 += "收藏";
        else _0x2ed0dc === _0x1e0e13["gXewl"] && (_0x33d148 += "分享");
      }
      $["log"]("✅\x20" + _0x33d148 + "成功: " + _0x5af432);
    } catch (_0x56df3a) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ " + taskType + "失败!\x20" + _0x56df3a));
    }
  }
  async ["getCsrfToken"](_0x3f985f, _0x20ff73) {
    const _0x17a058 = null,
      _0x488cb4 = {
        vfSSx: "get",
        ITMUJ:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(Aliyun/6.7.1) WindVane/8.7.2 1170x2532 WK",
      };
    try {
      const _0x4b9efd = {
          url: "https://developer.aliyun.com/csrfToken",
          type: _0x488cb4["vfSSx"],
          headers: {
            Cookie: this["token"],
            "User-Agent": _0x488cb4["ITMUJ"],
            Referer:
              "https://developer.aliyun.com/" + _0x20ff73 + "/" + _0x3f985f,
          },
        },
        _0x4948f3 = await this["fetch"](_0x4b9efd);
      return _0x4948f3?.["token"];
    } catch (_0x12b621) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️\x20获取\x20csrf\x20失败!\x20" + _0x12b621));
    }
  }
  async ["voteAnswer"](_0x41d7ed, _0x29baf3, _0x2dc533, _0x750f28) {
    const _0xe6da6e = null,
      _0x4e5cc0 = {
        jZCPX: "post",
        VggLf:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(Aliyun/6.7.1) WindVane/8.7.2 1170x2532 WK",
      };
    try {
      const _0x1383be = {
        url: "https://developer.aliyun.com/developer/api/my/ask/voteAnswer",
        type: _0x4e5cc0["jZCPX"],
        dataType: "form",
        headers: {
          Cookie: this["token"],
          "User-Agent": _0x4e5cc0["VggLf"],
          Referer: "https://developer.aliyun.com/ask/" + _0x41d7ed,
        },
        params: { p_csrf: _0x2dc533 },
        body: { id: _0x29baf3, votes: _0x750f28 },
      };
      (await this["fetch"](_0x1383be),
        $["log"]("✅ 回答点赞: " + _0x41d7ed + "-" + _0x29baf3));
    } catch (_0x194e66) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 回答点赞失败! " + _0x194e66));
    }
  }
  async ["addBookComment"](_0x3bb4d1, _0x4b6b9c) {
    const _0x1d045e = null,
      _0x4c1e67 = {
        nbnun: "post",
        AxnhL: "json",
        zaEjo:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(Aliyun/6.7.1) WindVane/8.7.2 1170x2532 WK",
        oXzUY: "很棒的一本书",
        PCxWX: "200",
      };
    try {
      const _0x37b32b = {
          url: "https://developer.aliyun.com/developer/api/ebook/mark/add",
          type: _0x4c1e67["nbnun"],
          dataType: _0x4c1e67["AxnhL"],
          headers: {
            Cookie: this["token"],
            "User-Agent": _0x4c1e67["zaEjo"],
            Referer: "https://developer.aliyun.com/ebook/" + _0x3bb4d1,
          },
          params: { p_csrf: _0x4b6b9c },
          body: { eBookId: _0x3bb4d1, score: 0xa, content: _0x4c1e67["oXzUY"] },
        },
        _0x2072a9 = await this["fetch"](_0x37b32b);
      _0x2072a9?.["code"] == _0x4c1e67["PCxWX"]
        ? $["log"]("✅\x20评价电子书:\x20" + _0x3bb4d1)
        : $["log"]("⛔️\x20评价电子书失败!\x20" + _0x2072a9?.["message"]);
    } catch (_0x194073) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️\x20评价电子书失败!\x20" + _0x194073));
    }
  }
  async ["getFavors"]() {
    const _0x44fd4d = null,
      _0x3b2b52 = {
        PXbAz:
          "https://developer.aliyun.com/developer/api/my/subscribe/listUserFavor",
        aTcYF: "get",
        cUbnc: function (_0x6fa1d8, _0x5db20d) {
          return _0x6fa1d8 === _0x5db20d;
        },
        lQujD: "aliyun-public-like",
        WxOWY: "文章点赞",
        tqskf: "文章收藏",
      };
    try {
      const _0x5d5bd3 = {
          url: _0x3b2b52["PXbAz"],
          type: _0x3b2b52["aTcYF"],
          params: { pageNum: 0x1, pageSize: 0xa, type: 0x1 },
        },
        _0x3c5f64 = await this["fetch"](_0x5d5bd3),
        { list: _0xa7b2df } = _0x3c5f64?.["data"];
      if (_0xa7b2df["length"])
        return ($["log"]("✅ 开始取消文章的点赞与收藏记录"), _0xa7b2df);
      return [];
    } catch (_0x3b85ec) {
      ((this["ckStatus"] = ![]),
        $["log"](
          "⛔️ " +
            (_0x3b2b52["cUbnc"](type, _0x3b2b52["lQujD"])
              ? _0x3b2b52["WxOWY"]
              : _0x3b2b52["tqskf"]) +
            "失败! " +
            _0x3b85ec,
        ));
    }
  }
  async ["addComment"](_0x5c615b) {
    const _0x46ab9d = null,
      _0x34cf22 = {
        CqIlP: function (_0x75e363, _0x374985) {
          return _0x75e363(_0x374985);
        },
        zDRLJ: "yq-comment-type-article",
        wtENQ: "developer-ecology",
        vrMkR: "developer-ecology-group",
        SNMLB: function (_0x27082d) {
          return _0x27082d();
        },
      };
    try {
      const _0x122e33 = {
        url: "https://ucc.aliyun.com/uccPagingComponent/addComment",
        type: "get",
        params: {
          content: _0x34cf22["CqIlP"](
            encodeURIComponent,
            "很有用的文章，非常受用，感谢博主",
          ),
          objectId: _0x5c615b,
          bizCategory: _0x34cf22["zDRLJ"],
          commentType: 0x0,
          sourceAppCode: _0x34cf22["wtENQ"],
          sourceBizCategory: _0x34cf22["vrMkR"],
          uccCsrfToken: await this["getUccCsrfToken"](),
          callback: _0x34cf22["SNMLB"](getCallback),
        },
      };
      (await this["fetch"](_0x122e33), $["log"]("✅ 文章评论: " + _0x5c615b));
    } catch (_0x36f9bb) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 文章点赞失败! " + _0x36f9bb));
    }
  }
  async ["doScene"]() {
    const _0x26f6d7 = null,
      _0x4607cd = {
        tLluj: "c_csrf=([^;]*)",
        lMWkc: function (_0x37b021, _0x3989de) {
          return _0x37b021 === _0x3989de;
        },
      },
      _0xbeffd6 = this["token"]["match"](new RegExp(_0x4607cd["tLluj"]))[0x1];
    (await this["getSceneList"](), await $["wait"](this["getRandomTime"]()));
    const _0x109c54 = await this["getSceneDetailPageInfoById"]();
    (await $["wait"](this["getRandomTime"]()),
      _0x109c54
        ? (await this["getSceneStartPageInfoById"](),
          await $["wait"](this["getRandomTime"]()),
          _0x4607cd["lMWkc"](resourceFrom, "2")
            ? (await this["startSceneById"](_0xbeffd6),
              await $["wait"](this["getRandomTime"]()),
              await this["closeSceneById"](_0xbeffd6),
              await $["wait"](this["getRandomTime"]()))
            : await this["doScene"]())
        : await this["doScene"]());
  }
  async ["getSceneList"]() {
    const _0x37e4f8 = null,
      _0x50e863 = {
        SSVNa: function (_0x288fd1, _0x3e79b8) {
          return _0x288fd1 + _0x3e79b8;
        },
        Tdapc: function (_0x195005, _0x3fdb6b) {
          return _0x195005 * _0x3fdb6b;
        },
        xBdmD: "https://developer.aliyun.com/adc/api/getSceneList",
        cOMmF: function (_0x3afdfc, _0x3856d9) {
          return _0x3afdfc(_0x3856d9);
        },
        UXOHC: "useCountTotal",
        yQtsC: "Cookie",
        yIpHb: "https://developer.aliyun.com/adc/labs/",
      };
    try {
      const _0x2c9fdc = _0x50e863["SSVNa"](
          Math["floor"](_0x50e863["Tdapc"](Math["random"](), 0x1a)),
          0x1,
        ),
        _0x46862c = 0x15,
        _0x11ed43 = {
          url: _0x50e863["xBdmD"],
          type: "get",
          params: {
            tags: _0x50e863["cOMmF"](encodeURIComponent, ","),
            difficulty: "",
            orderBy: _0x50e863["UXOHC"],
            pageNum: _0x2c9fdc,
            pageSize: _0x46862c,
          },
          headers: {
            Cookie: this["headers"][_0x50e863["yQtsC"]],
            Referer: _0x50e863["yIpHb"],
            "User-Agent": this["headers"]["User-Agent"],
          },
        },
        _0x420fdc = await this["fetch"](_0x11ed43),
        _0x32ec99 = _0x420fdc?.["data"]?.["list"];
      if (_0x32ec99["length"]) {
        const _0x1210da =
          _0x32ec99[
            Math["floor"](
              _0x50e863["Tdapc"](Math["random"](), _0x32ec99["length"]),
            )
          ];
        ((sceneId = _0x1210da?.["id"]),
          $["log"]("✅ 获取场景: " + _0x1210da["name"] + "[" + sceneId + "]"));
      } else $["log"]("⛔️ 获取场景失败! " + e);
    } catch (_0x12ed82) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 获取场景失败! " + _0x12ed82));
    }
  }
  async ["getSceneDetailPageInfoById"]() {
    const _0x4d081f = null,
      _0xd23c0b = {
        ILyLS:
          "https://developer.aliyun.com/adc/api/getSceneDetailPageInfoById",
        ZXcby: "get",
        thMpu: "Cookie",
        YFHtQ: "User-Agent",
      };
    try {
      const _0x551353 = {
          url: _0xd23c0b["ILyLS"],
          type: _0xd23c0b["ZXcby"],
          params: { id: sceneId },
          headers: {
            cookie: this["headers"][_0xd23c0b["thMpu"]],
            referer: "https://developer.aliyun.com/adc/scenario/" + sceneId,
            "user-agent": this["headers"][_0xd23c0b["YFHtQ"]],
          },
        },
        _0x5f152d = await this["fetch"](_0x551353),
        _0x3abff0 =
          _0x5f152d?.["data"]?.["developerAdcExperienceStatusVO"]?.[
            "buttonCode"
          ];
      return _0x3abff0
        ? _0x3abff0 === "1"
          ? ($["log"]("✅ 确认场景状态: " + _0x5f152d?.["data"]?.["id"]),
            _0x5f152d?.["data"]?.["id"])
          : ($["log"](
              "⛔️ 确认场景状态: " +
                _0x5f152d?.["data"]?.["id"] +
                " 已完成，将重新获取场景",
            ),
            null)
        : ($["log"](
            "⛔️\x20确认场景状态:\x20" +
              _0x5f152d?.["data"]?.["id"] +
              " 状态异常，将重新获取场景",
          ),
          null);
    } catch (_0x5a3c2b) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 确认场景状态失败! " + _0x5a3c2b));
    }
  }
  async ["getSceneStartPageInfoById"]() {
    const _0x27da9b = null,
      _0x46a261 = {
        emaVy: "get",
        QHyUB: "Cookie",
        fhIHP: "User-Agent",
        oLDfg: function (_0x3c5c7a, _0x527375) {
          return _0x3c5c7a > _0x527375;
        },
      };
    try {
      const _0x182772 = {
          url: "https://developer.aliyun.com/adc/api/getSceneStartPageInfoById",
          type: _0x46a261["emaVy"],
          params: { id: sceneId },
          headers: {
            cookie: this["headers"][_0x46a261["QHyUB"]],
            referer: "https://developer.aliyun.com/adc/scenario/exp/" + sceneId,
            "user-agent": this["headers"][_0x46a261["fhIHP"]],
          },
        },
        _0x13c1b2 = await this["fetch"](_0x182772);
      ((ip = _0x13c1b2?.["data"]?.["ip"]),
        _0x46a261["oLDfg"](
          _0x13c1b2?.["data"]?.["resourceFrom"]["indexOf"]("1"),
          -0x1,
        )
          ? (resourceFrom = "1")
          : (resourceFrom = "2"),
        _0x13c1b2?.["data"]?.["resourceCardInfoDTOList"]["length"] &&
          (sectionId =
            _0x13c1b2?.["data"]?.["resourceCardInfoDTOList"][0x0]?.["id"]),
        $["log"]("✅ 获取场景初始化信息: " + sceneId));
    } catch (_0x5a0a85) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取场景初始化信息失败! " + _0x5a0a85));
    }
  }
  async ["startSceneById"](_0xfb8c6e) {
    const _0x396d0a = null,
      _0xe7b20a = {
        eifTS: "post",
        gLtOz: "form",
        ItIMg: function (_0x1a1e01, _0x165e64) {
          return _0x1a1e01 === _0x165e64;
        },
        MJYSj: "200",
      };
    try {
      const _0x23127f = {
          url: "https://developer.aliyun.com/adc/api/startSceneById",
          type: _0xe7b20a["eifTS"],
          dataType: _0xe7b20a["gLtOz"],
          headers: {
            Host: "developer.aliyun.com",
            H_csrf: _0xfb8c6e,
            "X-XSRF-TOKEN": _0xfb8c6e,
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/adc/scenario/exp/" + sceneId,
          },
          params: { p_csrf: _0xfb8c6e },
          body: { id: sceneId, resourceFrom: resourceFrom },
        },
        _0x498020 = await this["fetch"](_0x23127f),
        { code: _0x4457a2, message: _0x20f985 } = _0x498020;
      console["log"](
        (_0xe7b20a["ItIMg"](_0x4457a2, _0xe7b20a["MJYSj"]) ? "✅" : "⛔️") +
          " 开始场景: " +
          sceneId +
          ",\x20" +
          _0x20f985,
      );
    } catch (_0xcacf62) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 开始场景失败! " + _0xcacf62));
    }
  }
  async ["closeSceneById"](_0x212e51) {
    const _0x43f4c3 = null,
      _0xbb7eab = {
        ddPoY: "https://developer.aliyun.com/adc/api/closeSceneById",
        HYETF: "post",
        zcWdN: "true",
        rppVt: "developer.aliyun.com",
        HrVfv:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      };
    try {
      const _0x549e7c = {
          url: _0xbb7eab["ddPoY"],
          type: _0xbb7eab["HYETF"],
          dataType: "form",
          body: { sceneId: sceneId, forceClose: _0xbb7eab["zcWdN"] },
          params: { p_csrf: _0x212e51 },
          headers: {
            Host: _0xbb7eab["rppVt"],
            H_csrf: _0x212e51,
            "X-XSRF-TOKEN": _0x212e51,
            "User-Agent": _0xbb7eab["HrVfv"],
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/adc/scenario/exp/" + sceneId,
          },
        },
        _0x18d5eb = await this["fetch"](_0x549e7c),
        { code: _0x4e485d, message: _0x5ebc35 } = _0x18d5eb;
      console["log"](
        (_0x4e485d === "200" ? "✅" : "⛔️") +
          " 结束场景: " +
          sceneId +
          ",\x20" +
          _0x5ebc35,
      );
    } catch (_0x169348) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 结束场景失败! " + _0x169348));
    }
  }
  async ["createResourceById"](_0x48af42) {
    const _0x4ff256 = null,
      _0x5736a6 = {
        zQVux: "https://developer.aliyun.com/adc/api/createResourceById",
        MNoKX: "post",
        BNLSG: "form",
        yOfwc: "developer.aliyun.com",
        mSPKa:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      };
    try {
      const _0x286015 = {
          url: _0x5736a6["zQVux"],
          type: _0x5736a6["MNoKX"],
          dataType: _0x5736a6["BNLSG"],
          body: { id: sceneId, sectionId: sectionId, ip: ip },
          params: { p_csrf: _0x48af42 },
          headers: {
            Host: _0x5736a6["yOfwc"],
            H_csrf: _0x48af42,
            "X-XSRF-TOKEN": _0x48af42,
            "User-Agent": _0x5736a6["mSPKa"],
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/adc/scenario/exp/" + sceneId,
          },
        },
        _0x59abad = await this["fetch"](_0x286015);
      _0x59abad?.["data"] && console["log"]("✅ 开始创建场景资源: " + sceneId);
    } catch (_0x44de26) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 创建场景资源失败! " + _0x44de26));
    }
  }
  async ["getResourceCardInfoById"]() {
    const _0x127ff5 = null,
      _0x3802ca = {
        iYaXk: "https://developer.aliyun.com/adc/api/getResourceCardInfoById",
        oyqEJ: "get",
        GTPLq:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        WMvIh: function (_0x159ee3, _0x5f38d3) {
          return _0x159ee3 === _0x5f38d3;
        },
        SbBot: "200",
        aLBfD: function (_0xb957f9, _0x4bedae) {
          return _0xb957f9 !== _0x4bedae;
        },
      };
    try {
      const _0x29c00e = {
          url: _0x3802ca["iYaXk"],
          type: _0x3802ca["oyqEJ"],
          params: { sceneId: sceneId, sectionId: sectionId },
          headers: {
            "User-Agent": _0x3802ca["GTPLq"],
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/adc/scenario/exp/" + sceneId,
          },
        },
        _0x437ae9 = await this["fetch"](_0x29c00e),
        { code: _0x36e2e8, data: _0x22043e } = _0x437ae9;
      if (_0x3802ca["WMvIh"](_0x36e2e8, _0x3802ca["SbBot"]) && _0x22043e) {
        if (_0x3802ca["aLBfD"](_0x22043e?.["status"], "RUNNING"))
          (await $["wait"](this["getRandomTime"]()),
            await this["getResourceCardInfoById"]());
        else return (console["log"]("✅ 创建场景资源完毕: " + sceneId), !![]);
      }
    } catch (_0x3184f0) {
      ((this["ckStatus"] = ![]),
        $["log"]("⛔️ 创建场景资源失败! " + _0x3184f0));
    }
  }
  async ["getVideoDetail"](_0x5f3fc1) {
    const _0x1d0cb7 = null,
      _0x2cfaae = {
        fUbAN: function (_0x219fdf, _0x3bbc06) {
          return _0x219fdf(_0x3bbc06);
        },
        oWklG: "get",
        XAIhx: "1.1.23",
        LVwix:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        AfHQa: function (_0xbd63fe, _0xd265df) {
          return _0xbd63fe(_0xd265df);
        },
      };
    try {
      const _0x38c61b = Date["now"](),
        _0x451b2e = _0x2cfaae["fUbAN"](getCallback, _0x38c61b),
        _0x58f751 = {
          url: "https://ucc.aliyun.com/api/ucc/live/open/detail",
          type: _0x2cfaae["oWklG"],
          params: {
            _: _0x38c61b,
            callback: _0x451b2e,
            version: _0x2cfaae["XAIhx"],
            id: _0x5f3fc1,
          },
          headers: {
            "User-Agent": _0x2cfaae["LVwix"],
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/live/" + _0x5f3fc1,
          },
        },
        _0x46c6d5 = await this["fetch"](_0x58f751),
        _0x4202fd = _0x2cfaae["AfHQa"](getJson, _0x46c6d5),
        _0x1ef603 = _0x4202fd?.["data"]?.["live"]?.["name"],
        _0x3e391f = _0x4202fd?.["data"]?.["live"]?.["duration"];
      return (
        console["log"](
          "✅ 获取视频信息成功: " +
            _0x1ef603 +
            ", 时长: " +
            _0x3e391f +
            "\x20秒",
        ),
        { videoName: _0x1ef603, videoTime: _0x3e391f }
      );
    } catch (_0x17a3fe) {
      return (
        (this["ckStatus"] = ![]),
        $["log"]("⛔️ 获取视频信息失败! " + _0x17a3fe),
        null
      );
    }
  }
  async ["getVideoView"](_0x1e1e24, _0x174a43) {
    const _0xd702cc = null,
      _0x56e011 = { TSRsa: "get" };
    try {
      const _0x17cdc8 = Date["now"](),
        _0x475c76 = getCallback(_0x17cdc8),
        _0x83fe0e = {
          url: "https://ucc.aliyun.com/api/ucc/live/open/view",
          type: _0x56e011["TSRsa"],
          params: {
            _: _0x17cdc8,
            callback: _0x475c76,
            version: "1.1.23",
            id: _0x1e1e24,
            sessionId: _0x174a43,
          },
          headers: {
            "User-Agent":
              "Mozilla/5.0\x20(Macintosh;\x20Intel\x20Mac\x20OS\x20X\x2010_15_7)\x20AppleWebKit/537.36\x20(KHTML,\x20like\x20Gecko)\x20Chrome/125.0.0.0\x20Safari/537.36",
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/live/" + _0x1e1e24,
          },
        };
      await this["fetch"](_0x83fe0e);
    } catch (_0xf47ac) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 获取视频视图失败! " + _0xf47ac));
    }
  }
  async ["play"](_0x19cac2, _0x4aa617, _0x3f5f00) {
    const _0x4e11d7 = null,
      _0x194151 = {
        XxmSN: function (_0x4e8ce5, _0x1b60c6) {
          return _0x4e8ce5(_0x1b60c6);
        },
        shDrW: "get",
        hLfat: "1.1.23",
      };
    try {
      const _0x2ba447 = Date["now"](),
        _0x23605f = _0x194151["XxmSN"](getCallback, _0x2ba447),
        _0xb88426 = {
          url: "https://ucc.aliyun.com/api/ucc/live/open/play",
          type: _0x194151["shDrW"],
          params: {
            _: _0x2ba447,
            callback: _0x23605f,
            version: _0x194151["hLfat"],
            id: _0x4aa617,
            sessionId: _0x3f5f00,
          },
          headers: {
            "User-Agent":
              "Mozilla/5.0\x20(Macintosh;\x20Intel\x20Mac\x20OS\x20X\x2010_15_7)\x20AppleWebKit/537.36\x20(KHTML,\x20like\x20Gecko)\x20Chrome/125.0.0.0\x20Safari/537.36",
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/live/" + _0x4aa617,
          },
        };
      (await this["fetch"](_0xb88426),
        console["log"]("✅ 开始播放视频: " + _0x19cac2));
    } catch (_0x3d7d6d) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 播放视频失败! " + _0x3d7d6d));
    }
  }
  async ["danmu"](_0x4538f3, _0x3917d4) {
    const _0x244625 = null,
      _0x53b51d = {
        kuTmH: function (_0x18b28a, _0xf2a664) {
          return _0x18b28a(_0xf2a664);
        },
        dnaov: "1.1.23",
        qHiNf:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        eFisk: function (_0xcb18e6, _0x1ea933) {
          return _0xcb18e6(_0x1ea933);
        },
      };
    try {
      const _0x21aff2 = Date["now"](),
        _0xfaf2fc = _0x53b51d["kuTmH"](getCallback, _0x21aff2),
        _0x32e09c = {
          url: "https://ucc.aliyun.com/api/ucc/live/open/danmu",
          type: "get",
          params: {
            _: _0x21aff2,
            callback: _0xfaf2fc,
            version: _0x53b51d["dnaov"],
            id: _0x4538f3,
            seek: _0x3917d4,
          },
          headers: {
            "User-Agent": _0x53b51d["qHiNf"],
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/live/" + _0x4538f3,
          },
        },
        _0x436c79 = await this["fetch"](_0x32e09c),
        _0x3b80cb = _0x53b51d["eFisk"](getJson, _0x436c79);
      console["log"](
        "✅\x20获取第\x20" +
          _0x3917d4 +
          " 秒弹幕: " +
          JSON["stringify"](_0x3b80cb?.["data"]),
      );
    } catch (_0x1899b3) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 获取弹幕失败! " + _0x1899b3));
    }
  }
  async ["online"](_0xf9cc65, _0x4b080b) {
    const _0x5e4348 = null,
      _0x3dddd = {
        VdfAt: function (_0x1f8f9b, _0x591380) {
          return _0x1f8f9b(_0x591380);
        },
        KLykr: "get",
        rqQAT: "1.1.23",
      };
    try {
      const _0x418c19 = Date["now"](),
        _0x369e23 = _0x3dddd["VdfAt"](getCallback, _0x418c19),
        _0x54fd5b = {
          url: "https://ucc.aliyun.com/api/ucc/live/open/online",
          type: _0x3dddd["KLykr"],
          params: {
            _: _0x418c19,
            callback: _0x369e23,
            version: _0x3dddd["rqQAT"],
            id: _0xf9cc65,
            sessionId: _0x4b080b,
          },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            Cookie: this["token"],
            Referer: "https://developer.aliyun.com/live/" + _0xf9cc65,
          },
        };
      (await this["fetch"](_0x54fd5b), console["log"]("✅ 在线心跳确认成功"));
    } catch (_0x1be8cf) {
      ((this["ckStatus"] = ![]), $["log"]("⛔️ 在线心跳确认! " + _0x1be8cf));
    }
  }
  async ["playVideo"]() {
    const _0x1d2110 = null,
      _0x45bb14 = {
        XIBBs: function (_0x56b868, _0x4792a4, _0x29943d) {
          return _0x56b868(_0x4792a4, _0x29943d);
        },
        RTQhO: function (_0x189cca, _0x382573) {
          return _0x189cca < _0x382573;
        },
        SYYDF: function (_0x15e1f4, _0x4c59e6) {
          return _0x15e1f4 == _0x4c59e6;
        },
      },
      _0x42c6be = "253842",
      _0x6907e1 = _0x45bb14["XIBBs"](getSessionId, this["token"], _0x42c6be),
      { videoName: _0x152746, videoTime: _0x2d1a1a } =
        await this["getVideoDetail"](_0x42c6be);
    (await $["wait"](this["getRandomTime"]()),
      await this["getVideoView"](_0x42c6be, _0x6907e1),
      await $["wait"](this["getRandomTime"]()),
      await this["play"](_0x152746, _0x42c6be, _0x6907e1),
      await $["wait"](this["getRandomTime"]()));
    for (
      let _0x5682e6 = 0x3;
      _0x45bb14["RTQhO"](_0x5682e6, _0x2d1a1a);
      _0x5682e6 += 0x3
    ) {
      (await this["danmu"](_0x42c6be, _0x5682e6),
        await $["wait"](0xbb8),
        _0x45bb14["SYYDF"](_0x5682e6, 0x3c) &&
          (await this["online"](_0x42c6be, _0x6907e1)));
    }
    console["log"]("✅\x20视频播放完毕:\x20" + _0x152746);
  }
  async ["getGroupItems"]() {
    const _0xb45f19 = null,
      _0x225569 = { ORcKo: "get" };
    try {
      const _0x48f601 = {
          url: "/lm/getGroupItems?pageNum=1&pageSize=50",
          type: _0x225569["ORcKo"],
        },
        _0x4ad0b6 = await this["fetch"](_0x48f601),
        { list: _0x494c27 } = _0x4ad0b6?.["data"];
      if (_0x494c27["length"]) {
        $["log"]("✅ 开始查询库存:");
        for (let _0x3d549a of _0x494c27) {
          $["log"](
            "🎁\x20" +
              _0x3d549a["itemTitle"]["replace"](/【.*?】/g, "") +
              ":\x20" +
              _0x3d549a["points"] +
              " 分【" +
              _0x3d549a["statusStr"] +
              "】",
          );
        }
      }
    } catch (_0x37ea50) {
      $["log"]("⛔️ 查询待收获积分列表失败! " + _0x37ea50);
    }
  }
  async ["interactData"]() {
    const _0x282695 = null,
      _0x1991d6 = {
        fEgve: "/my/score/getUserScore?appCode=developer",
        QfwTm: "get",
      };
    try {
      const _0x2af767 = { url: _0x1991d6["fEgve"], type: _0x1991d6["QfwTm"] };
      let _0x410f5d = await this["fetch"](_0x2af767);
      return _0x410f5d?.["data"];
    } catch (_0x1977df) {
      $["log"]("⛔️ 查询待收获积分列表失败! " + _0x1977df);
    }
  }
  async ["getUserTotalPendingScore"]() {
    const _0x2d1b86 = null,
      _0x144ee0 = {
        Leryj: "/score/pending/getUserTotalPendingScore?appCode=developer",
        jjrsm: "get",
      };
    try {
      const _0x255dda = { url: _0x144ee0["Leryj"], type: _0x144ee0["jjrsm"] };
      let _0xd4267a = await this["fetch"](_0x255dda);
      return (
        $["log"]("✅\x20待领取积分:\x20" + _0xd4267a?.["data"]),
        _0xd4267a?.["data"]
      );
    } catch (_0x4984ad) {
      $["log"]("⛔️ 查询待领取积分失败! " + _0x4984ad);
    }
  }
  async ["collect"]() {
    const _0x47349e = null,
      _0xe49e53 = {
        qXjkr: "/score/pending/receiveAllPendingScore?appCode=developer",
      };
    try {
      const _0x4f6134 = { url: _0xe49e53["qXjkr"], type: "get" };
      let _0x5094a6 = await this["fetch"](_0x4f6134);
      return (
        $["log"]("✅ 收取积分: " + _0x5094a6?.["data"]),
        _0x5094a6?.["data"]
      );
    } catch (_0x218567) {
      $["log"]("⛔️ 收取积分失败! " + _0x218567);
    }
  }
  async ["getUccCsrfToken"]() {
    const _0x452e34 = null,
      _0x725884 = {
        tNpEe: function (_0x5ba211) {
          return _0x5ba211();
        },
        qzjRv: function (_0x54a380, _0x15fe99) {
          return _0x54a380 + _0x15fe99;
        },
      };
    try {
      const _0x40283e = {
        url: "https://ucc.aliyun.com/uccPagingComponent/getUser",
        type: "get",
        params: { uccCsrfToken: "", callback: _0x725884["tNpEe"](getCallback) },
      };
      let _0x3273a8 = await this["fetch"](_0x40283e);
      const _0x4e54b3 = _0x3273a8["indexOf"]("{"),
        _0x32d38d = _0x3273a8["lastIndexOf"]("}"),
        _0x540a75 = _0x3273a8["substring"](
          _0x4e54b3,
          _0x725884["qzjRv"](_0x32d38d, 0x1),
        ),
        _0x4cf1fd = JSON["parse"](_0x540a75);
      return _0x4cf1fd["data"]["uccCsrfToken"];
    } catch (_0x1f1a15) {
      $["log"]("⛔️\x20获取UccCsrfToken失败!\x20" + _0x1f1a15);
    }
  }
}
function getCallback(_0x5deec1) {
  const _0x1c5699 = null,
    _0x5966f1 = {
      WsFRg: function (_0xaabf26, _0x5ac461) {
        return _0xaabf26 + _0x5ac461;
      },
      TqiTe: function (_0x2a9618, _0x360d0) {
        return _0x2a9618 + _0x360d0;
      },
      nmDFP: "jsonp_",
      SrRdj: function (_0x2d7774, _0x35850d) {
        return _0x2d7774 * _0x35850d;
      },
    };
  return (
    (_0x5deec1 = _0x5deec1 || Date["now"]()),
    _0x5966f1["WsFRg"](
      _0x5966f1["WsFRg"](
        _0x5966f1["TqiTe"](_0x5966f1["nmDFP"], _0x5deec1),
        "_",
      ),
      Math["ceil"](_0x5966f1["SrRdj"](0x186a0, Math["random"]())),
    )
  );
}
function getJson(_0x1f9cb8) {
  const _0x58eef9 = null;
  return JSON["parse"](_0x1f9cb8["replace"](/.*\(/, "")["replace"](/\)/, ""));
}
function getSessionId(_0x53c902, _0x3fc8b9) {
  const _0x48cb1e = null,
    _0x1f21f7 = {
      PkEKQ: function (_0x11b6aa, _0x25d1cf) {
        return _0x11b6aa + _0x25d1cf;
      },
      SYmBk: function (_0x5a54f7, _0x3dc5a3) {
        return _0x5a54f7 & _0x3dc5a3;
      },
      swvcc: function (_0x112d00, _0x35ff7e) {
        return _0x112d00 + _0x35ff7e;
      },
      ePruZ: function (_0x5b72b6, _0x2fd8ec) {
        return _0x5b72b6 >> _0x2fd8ec;
      },
      dnWlK: function (_0x599a2c, _0x5c4387) {
        return _0x599a2c >> _0x5c4387;
      },
      MnzBh: function (_0xedebe, _0x446091) {
        return _0xedebe | _0x446091;
      },
      WFnEO: function (_0x197c88, _0x447daf) {
        return _0x197c88 << _0x447daf;
      },
      bgEgg: function (_0x419c7f, _0x30ca8c) {
        return _0x419c7f - _0x30ca8c;
      },
      ueAKM: function (_0x4f3c4c, _0x116658, _0x5b77c3) {
        return _0x4f3c4c(_0x116658, _0x5b77c3);
      },
      jfbaE: function (_0x20246, _0x4996c6, _0x2ac530) {
        return _0x20246(_0x4996c6, _0x2ac530);
      },
      WwfkL: function (_0x383ebd, _0x54302f, _0xa1b75b) {
        return _0x383ebd(_0x54302f, _0xa1b75b);
      },
      fyzaA: function (
        _0x47930c,
        _0x317fe1,
        _0x4cf889,
        _0x36a2f0,
        _0x372e81,
        _0x4d3753,
        _0x36d572,
      ) {
        return _0x47930c(
          _0x317fe1,
          _0x4cf889,
          _0x36a2f0,
          _0x372e81,
          _0x4d3753,
          _0x36d572,
        );
      },
      DKCSg: function (_0x52d46b, _0xfa7d35) {
        return _0x52d46b & _0xfa7d35;
      },
      KyEKu: function (_0xfb92b3, _0x2442ee) {
        return _0xfb92b3 & _0x2442ee;
      },
      QAaMg: function (
        _0x3467c3,
        _0x3f007c,
        _0x1eb49b,
        _0x174dd1,
        _0x931af9,
        _0xa33209,
        _0x4521f4,
      ) {
        return _0x3467c3(
          _0x3f007c,
          _0x1eb49b,
          _0x174dd1,
          _0x931af9,
          _0xa33209,
          _0x4521f4,
        );
      },
      Zgaii: function (_0x5ec813, _0x5e42c8) {
        return _0x5ec813 | _0x5e42c8;
      },
      kKpnB: function (_0x261e79, _0x25b52f) {
        return _0x261e79 ^ _0x25b52f;
      },
      nQBbG: function (_0x432507, _0x106ea7) {
        return _0x432507 ^ _0x106ea7;
      },
      FMLmq: function (
        _0x330295,
        _0x2fabf4,
        _0x36c7b6,
        _0x2eca46,
        _0x112670,
        _0x2c2aaf,
        _0x41e575,
      ) {
        return _0x330295(
          _0x2fabf4,
          _0x36c7b6,
          _0x2eca46,
          _0x112670,
          _0x2c2aaf,
          _0x41e575,
        );
      },
      WNVxd: "4|1|0|2|3",
      nLASV: function (_0x34ec5c, _0x59f1c1) {
        return _0x34ec5c >> _0x59f1c1;
      },
      LCSzn: function (_0xdc6326, _0x5057e6) {
        return _0xdc6326 % _0x5057e6;
      },
      jSWYR: function (_0x5ecf0f, _0x3b8bf9) {
        return _0x5ecf0f + _0x3b8bf9;
      },
      aRcnl: function (_0xfa85b9, _0x2e291b) {
        return _0xfa85b9 >>> _0x2e291b;
      },
      GmaZE: function (
        _0x4d8a37,
        _0x40a0be,
        _0x109581,
        _0x594ef6,
        _0xabdfd,
        _0x455dff,
        _0x3dd8bd,
        _0x1b1e38,
      ) {
        return _0x4d8a37(
          _0x40a0be,
          _0x109581,
          _0x594ef6,
          _0xabdfd,
          _0x455dff,
          _0x3dd8bd,
          _0x1b1e38,
        );
      },
      SJfiO: function (
        _0x1e377c,
        _0x50291b,
        _0x590a7f,
        _0xcef17f,
        _0x1ad21e,
        _0x13c7a4,
        _0x25aedb,
        _0x28f413,
      ) {
        return _0x1e377c(
          _0x50291b,
          _0x590a7f,
          _0xcef17f,
          _0x1ad21e,
          _0x13c7a4,
          _0x25aedb,
          _0x28f413,
        );
      },
      vivPH: function (
        _0x5b94e6,
        _0x325407,
        _0x1ef2ac,
        _0x5d10c2,
        _0x2da8ea,
        _0x15d78b,
        _0x3b6b4e,
        _0x40ca48,
      ) {
        return _0x5b94e6(
          _0x325407,
          _0x1ef2ac,
          _0x5d10c2,
          _0x2da8ea,
          _0x15d78b,
          _0x3b6b4e,
          _0x40ca48,
        );
      },
      OxYHF: function (
        _0x237140,
        _0x30bbce,
        _0xa17ad5,
        _0x460833,
        _0x5eab54,
        _0x59c913,
        _0xb75633,
        _0x5ee029,
      ) {
        return _0x237140(
          _0x30bbce,
          _0xa17ad5,
          _0x460833,
          _0x5eab54,
          _0x59c913,
          _0xb75633,
          _0x5ee029,
        );
      },
      vqoQL: function (
        _0xd29201,
        _0x201584,
        _0x5ae102,
        _0x2cd52d,
        _0x3b034e,
        _0x12c5d8,
        _0x44cb19,
        _0x115d78,
      ) {
        return _0xd29201(
          _0x201584,
          _0x5ae102,
          _0x2cd52d,
          _0x3b034e,
          _0x12c5d8,
          _0x44cb19,
          _0x115d78,
        );
      },
      dDFyf: function (
        _0x582151,
        _0x94a1fc,
        _0x2cdda8,
        _0x5480e2,
        _0x1edc7d,
        _0x325c28,
        _0x8c97d4,
        _0x384920,
      ) {
        return _0x582151(
          _0x94a1fc,
          _0x2cdda8,
          _0x5480e2,
          _0x1edc7d,
          _0x325c28,
          _0x8c97d4,
          _0x384920,
        );
      },
      dkBgE: function (
        _0x3ae86c,
        _0x4194c9,
        _0x287539,
        _0x520f2e,
        _0x2bfd03,
        _0x34bc5b,
        _0x5ee275,
        _0x38c9de,
      ) {
        return _0x3ae86c(
          _0x4194c9,
          _0x287539,
          _0x520f2e,
          _0x2bfd03,
          _0x34bc5b,
          _0x5ee275,
          _0x38c9de,
        );
      },
      fVtHa: function (
        _0x277ba5,
        _0x5695f2,
        _0x2a3035,
        _0x50cd6a,
        _0x402bb8,
        _0x21b77a,
        _0x2678cc,
        _0x18e564,
      ) {
        return _0x277ba5(
          _0x5695f2,
          _0x2a3035,
          _0x50cd6a,
          _0x402bb8,
          _0x21b77a,
          _0x2678cc,
          _0x18e564,
        );
      },
      SrRNi: function (
        _0x3e6b36,
        _0x3baaa4,
        _0x5b911a,
        _0x533d33,
        _0x4361bc,
        _0x514fbf,
        _0x2c015d,
        _0x43ada4,
      ) {
        return _0x3e6b36(
          _0x3baaa4,
          _0x5b911a,
          _0x533d33,
          _0x4361bc,
          _0x514fbf,
          _0x2c015d,
          _0x43ada4,
        );
      },
      fTyJE: function (_0x369312, _0x26378d) {
        return _0x369312 + _0x26378d;
      },
      OkZYC: function (
        _0x565a8d,
        _0x34e88c,
        _0x496acc,
        _0x5b57ac,
        _0x45ffcb,
        _0x507b86,
        _0x12cda7,
        _0x264d95,
      ) {
        return _0x565a8d(
          _0x34e88c,
          _0x496acc,
          _0x5b57ac,
          _0x45ffcb,
          _0x507b86,
          _0x12cda7,
          _0x264d95,
        );
      },
      IzyoG: function (
        _0x39441b,
        _0x5fed64,
        _0x559b88,
        _0x991eb5,
        _0x293333,
        _0x19cdf1,
        _0x49f295,
        _0x4cbb96,
      ) {
        return _0x39441b(
          _0x5fed64,
          _0x559b88,
          _0x991eb5,
          _0x293333,
          _0x19cdf1,
          _0x49f295,
          _0x4cbb96,
        );
      },
      TruTh: function (_0x31d167, _0x502b57) {
        return _0x31d167 + _0x502b57;
      },
      YVXSl: function (_0x1fb0de, _0x5b7c6b) {
        return _0x1fb0de + _0x5b7c6b;
      },
      vKnOi: function (
        _0x1e6808,
        _0x4341b2,
        _0x309c54,
        _0xb9ce00,
        _0x959fcb,
        _0x52ada2,
        _0x28286b,
        _0xac6df7,
      ) {
        return _0x1e6808(
          _0x4341b2,
          _0x309c54,
          _0xb9ce00,
          _0x959fcb,
          _0x52ada2,
          _0x28286b,
          _0xac6df7,
        );
      },
      IFOkn: function (
        _0x4f089f,
        _0x5e346b,
        _0x5690a8,
        _0x3d6956,
        _0xd03af7,
        _0x37f697,
        _0x42451c,
        _0x58acc0,
      ) {
        return _0x4f089f(
          _0x5e346b,
          _0x5690a8,
          _0x3d6956,
          _0xd03af7,
          _0x37f697,
          _0x42451c,
          _0x58acc0,
        );
      },
      dgfRT: function (
        _0x50c64e,
        _0x26698f,
        _0x5921b9,
        _0x38b8b5,
        _0x357681,
        _0x33f8df,
        _0x2e40ee,
        _0x2de588,
      ) {
        return _0x50c64e(
          _0x26698f,
          _0x5921b9,
          _0x38b8b5,
          _0x357681,
          _0x33f8df,
          _0x2e40ee,
          _0x2de588,
        );
      },
      dmCDy: function (_0x1788fd, _0x4e4b52) {
        return _0x1788fd + _0x4e4b52;
      },
      qWAdh: function (
        _0x15b69a,
        _0x179c01,
        _0x51cbf6,
        _0x9822c5,
        _0x4f8f5a,
        _0x476642,
        _0x3823cb,
        _0x2369e5,
      ) {
        return _0x15b69a(
          _0x179c01,
          _0x51cbf6,
          _0x9822c5,
          _0x4f8f5a,
          _0x476642,
          _0x3823cb,
          _0x2369e5,
        );
      },
      LniNO: function (_0x3da5fd, _0x5b29d1) {
        return _0x3da5fd + _0x5b29d1;
      },
      fTWWC: function (_0x313dfc, _0x2aed50) {
        return _0x313dfc + _0x2aed50;
      },
      gHhmi: function (
        _0x333af7,
        _0x4e8083,
        _0x38ea2a,
        _0x324858,
        _0x4061cb,
        _0x58de83,
        _0x57e2ba,
        _0x4c4cf4,
      ) {
        return _0x333af7(
          _0x4e8083,
          _0x38ea2a,
          _0x324858,
          _0x4061cb,
          _0x58de83,
          _0x57e2ba,
          _0x4c4cf4,
        );
      },
      KIocb: function (
        _0x225024,
        _0x482458,
        _0x396eb0,
        _0x261483,
        _0x250279,
        _0x2e336d,
        _0x32eaa7,
        _0x223b61,
      ) {
        return _0x225024(
          _0x482458,
          _0x396eb0,
          _0x261483,
          _0x250279,
          _0x2e336d,
          _0x32eaa7,
          _0x223b61,
        );
      },
      NbYPS: function (_0x37b9c5, _0x683947) {
        return _0x37b9c5 + _0x683947;
      },
      yEYkd: function (_0x4ca131, _0x4795ed) {
        return _0x4ca131 + _0x4795ed;
      },
      JKRox: function (
        _0x1db6c1,
        _0x265b3d,
        _0x38633a,
        _0x1fa9fe,
        _0x90f623,
        _0x25afea,
        _0x1b7ca8,
        _0x48e7f9,
      ) {
        return _0x1db6c1(
          _0x265b3d,
          _0x38633a,
          _0x1fa9fe,
          _0x90f623,
          _0x25afea,
          _0x1b7ca8,
          _0x48e7f9,
        );
      },
      OIUVz: function (
        _0x1a749c,
        _0x10137b,
        _0x2f40c8,
        _0x2d62ea,
        _0x11518d,
        _0x4ebd1b,
        _0x39181f,
        _0x274c7a,
      ) {
        return _0x1a749c(
          _0x10137b,
          _0x2f40c8,
          _0x2d62ea,
          _0x11518d,
          _0x4ebd1b,
          _0x39181f,
          _0x274c7a,
        );
      },
      pAWGT: function (_0x1fe71d, _0x4288b4) {
        return _0x1fe71d + _0x4288b4;
      },
      uiSqK: function (_0x5f36e2, _0x455ec4) {
        return _0x5f36e2 + _0x455ec4;
      },
      bRteK: function (_0x5d86dc, _0x3d564a) {
        return _0x5d86dc + _0x3d564a;
      },
      XkOgl: function (
        _0x5124c6,
        _0x5bd00e,
        _0x757574,
        _0x39e4a0,
        _0x3ed2a5,
        _0x30cfd3,
        _0x1537d8,
        _0x222bff,
      ) {
        return _0x5124c6(
          _0x5bd00e,
          _0x757574,
          _0x39e4a0,
          _0x3ed2a5,
          _0x30cfd3,
          _0x1537d8,
          _0x222bff,
        );
      },
      aHqhl: function (_0x2df4d5, _0x57efbc) {
        return _0x2df4d5 + _0x57efbc;
      },
      CHdWN: function (_0x2cc1c1, _0x2cc842) {
        return _0x2cc1c1 + _0x2cc842;
      },
      zkEzp: function (
        _0x234598,
        _0x2025c6,
        _0x1d8f42,
        _0xca3c0a,
        _0x3717df,
        _0x5d755a,
        _0x3c51e2,
        _0x56a711,
      ) {
        return _0x234598(
          _0x2025c6,
          _0x1d8f42,
          _0xca3c0a,
          _0x3717df,
          _0x5d755a,
          _0x3c51e2,
          _0x56a711,
        );
      },
      pdhPS: function (_0x44448b, _0x1cce49) {
        return _0x44448b + _0x1cce49;
      },
      hadXK: function (_0xab6dab, _0x4c2758) {
        return _0xab6dab + _0x4c2758;
      },
      bENNq: function (
        _0x9a74c4,
        _0x3ed99b,
        _0x3f7bc6,
        _0x24e028,
        _0x400862,
        _0x1228a4,
        _0x27a00b,
        _0x966081,
      ) {
        return _0x9a74c4(
          _0x3ed99b,
          _0x3f7bc6,
          _0x24e028,
          _0x400862,
          _0x1228a4,
          _0x27a00b,
          _0x966081,
        );
      },
      MAmVO: function (_0x2a757d, _0x4e6991) {
        return _0x2a757d + _0x4e6991;
      },
      HCIFp: function (
        _0x5bc71a,
        _0x47aac4,
        _0x34252e,
        _0x1a6809,
        _0x2e1e47,
        _0x3ae549,
        _0x206a29,
        _0x51530e,
      ) {
        return _0x5bc71a(
          _0x47aac4,
          _0x34252e,
          _0x1a6809,
          _0x2e1e47,
          _0x3ae549,
          _0x206a29,
          _0x51530e,
        );
      },
      xUVcq: function (_0x498a81, _0x1cbc5b) {
        return _0x498a81 + _0x1cbc5b;
      },
      TiGxa: function (_0x1ecdf7, _0x407162) {
        return _0x1ecdf7 + _0x407162;
      },
      ZbJbK: function (
        _0x534fde,
        _0x5ced71,
        _0xf22ccb,
        _0x34e390,
        _0x192827,
        _0x15cac2,
        _0x64de97,
        _0x5225a8,
      ) {
        return _0x534fde(
          _0x5ced71,
          _0xf22ccb,
          _0x34e390,
          _0x192827,
          _0x15cac2,
          _0x64de97,
          _0x5225a8,
        );
      },
      IkJtr: function (_0x102dc8, _0x302984) {
        return _0x102dc8 + _0x302984;
      },
      BzMui: function (
        _0x1552a8,
        _0x257a3e,
        _0x455a09,
        _0x84214f,
        _0x7da4b3,
        _0x63539a,
        _0x2a21fd,
        _0x45fd63,
      ) {
        return _0x1552a8(
          _0x257a3e,
          _0x455a09,
          _0x84214f,
          _0x7da4b3,
          _0x63539a,
          _0x2a21fd,
          _0x45fd63,
        );
      },
      jLEQe: function (
        _0x2e8097,
        _0x34fe6b,
        _0x16c097,
        _0x67df76,
        _0x59eef,
        _0x524505,
        _0x523e6c,
        _0x12a943,
      ) {
        return _0x2e8097(
          _0x34fe6b,
          _0x16c097,
          _0x67df76,
          _0x59eef,
          _0x524505,
          _0x523e6c,
          _0x12a943,
        );
      },
      QkeTN: function (_0x449a10, _0x4d6730) {
        return _0x449a10 + _0x4d6730;
      },
      cPkTo: function (_0x4915d7, _0x54281d) {
        return _0x4915d7 + _0x54281d;
      },
      AEgVh: function (
        _0x29d932,
        _0x2b6607,
        _0x3ca6e4,
        _0xe3812d,
        _0x419947,
        _0x5c9dfe,
        _0x2c396e,
        _0x32271f,
      ) {
        return _0x29d932(
          _0x2b6607,
          _0x3ca6e4,
          _0xe3812d,
          _0x419947,
          _0x5c9dfe,
          _0x2c396e,
          _0x32271f,
        );
      },
      VVQmp: function (_0x1b23f2, _0x2ef6d6) {
        return _0x1b23f2 + _0x2ef6d6;
      },
      vPXCj: function (_0x1611c0, _0x3ba13c) {
        return _0x1611c0 + _0x3ba13c;
      },
      jZYsU: function (
        _0x8b0c3d,
        _0x2637e1,
        _0x5b1d84,
        _0x29831e,
        _0x456d02,
        _0x1a49ea,
        _0x2b4370,
        _0x25a55c,
      ) {
        return _0x8b0c3d(
          _0x2637e1,
          _0x5b1d84,
          _0x29831e,
          _0x456d02,
          _0x1a49ea,
          _0x2b4370,
          _0x25a55c,
        );
      },
      tHvKm: function (_0x196cd1, _0x1db2aa) {
        return _0x196cd1 + _0x1db2aa;
      },
      pEzTG: function (_0x17d3fa, _0x297d4a) {
        return _0x17d3fa + _0x297d4a;
      },
      GrGKk: function (_0x4052d6, _0x5a94c4) {
        return _0x4052d6 + _0x5a94c4;
      },
      IaKXa: function (
        _0x313eaf,
        _0x477dca,
        _0x122879,
        _0x50cf7b,
        _0x1cedee,
        _0x166b0f,
        _0x3756c6,
        _0x27635f,
      ) {
        return _0x313eaf(
          _0x477dca,
          _0x122879,
          _0x50cf7b,
          _0x1cedee,
          _0x166b0f,
          _0x3756c6,
          _0x27635f,
        );
      },
      wzwzr: function (_0x17cd54, _0x382f4f) {
        return _0x17cd54 + _0x382f4f;
      },
      kBLBH: function (_0x5233e9, _0x3d3783) {
        return _0x5233e9 + _0x3d3783;
      },
      fqLyn: function (_0x339c54, _0x12665e, _0x197acb) {
        return _0x339c54(_0x12665e, _0x197acb);
      },
      dPMbD: function (_0x5c2ceb, _0x5a691b, _0x20336b) {
        return _0x5c2ceb(_0x5a691b, _0x20336b);
      },
      FhjkZ: function (_0xd454a3, _0x3b7b29) {
        return _0xd454a3 < _0x3b7b29;
      },
      VMoKp: function (_0x11b08f, _0x569709) {
        return _0x11b08f >> _0x569709;
      },
      QMjge: "3|2|1|0|4",
      yNVJE: function (_0x535d59, _0x523974) {
        return _0x535d59 * _0x523974;
      },
      MRHnI: function (_0x4701b3, _0x340ccf) {
        return _0x4701b3 - _0x340ccf;
      },
      KTbZI: function (_0x13eb31, _0x2f2376) {
        return _0x13eb31(_0x2f2376);
      },
      RHMxQ: function (_0x5d5766, _0x2be0aa, _0x2fafe5) {
        return _0x5d5766(_0x2be0aa, _0x2fafe5);
      },
      zkxuc: function (_0x3f6b2a, _0x86c241) {
        return _0x3f6b2a(_0x86c241);
      },
      bIrxS: function (_0x5a214c, _0x18ee89) {
        return _0x5a214c > _0x18ee89;
      },
      UbClY: function (_0x12cd99, _0x4565b5) {
        return _0x12cd99 * _0x4565b5;
      },
      TaZGO: function (_0x3e5470, _0x1c8b49) {
        return _0x3e5470 ^ _0x1c8b49;
      },
      bMqIB: function (_0x12ad4e, _0x1c032f) {
        return _0x12ad4e ^ _0x1c032f;
      },
      ATMQS: function (_0x59fa81, _0x4daae4, _0x410b09) {
        return _0x59fa81(_0x4daae4, _0x410b09);
      },
      wgOOR: function (_0x371e56, _0x41cdf0) {
        return _0x371e56 + _0x41cdf0;
      },
      RgYNH: function (_0x155d34, _0x11fa5d, _0x26add6) {
        return _0x155d34(_0x11fa5d, _0x26add6);
      },
      ygucS: "0123456789abcdef",
      bSQsG: function (_0xfd0b33, _0x293cd9) {
        return _0xfd0b33 + _0x293cd9;
      },
      oUhna: function (_0x57a2b1, _0xd04fcb) {
        return _0x57a2b1(_0xd04fcb);
      },
      KKypd: function (_0x571ec1, _0x2f7e81) {
        return _0x571ec1(_0x2f7e81);
      },
      vGWtG: function (_0xefdd2d, _0x5b14c1) {
        return _0xefdd2d(_0x5b14c1);
      },
      BiWEp: function (_0x2b5dca, _0x258034) {
        return _0x2b5dca(_0x258034);
      },
      EauHL: function (_0x4518ec, _0x1e709f, _0x3f1148) {
        return _0x4518ec(_0x1e709f, _0x3f1148);
      },
      MMVAR: function (_0x3add93, _0x1db877, _0x454af5) {
        return _0x3add93(_0x1db877, _0x454af5);
      },
      jlubw: function (_0x275f8f, _0x3ee7b3) {
        return _0x275f8f == _0x3ee7b3;
      },
      hZEwh: "cna",
    };
  function _0x137d42(_0x5d05d2, _0x23d059) {
    const _0x2c0162 = null;
    var _0x25d3d9 = _0x1f21f7["PkEKQ"](
        _0x1f21f7["SYmBk"](0xffff, _0x5d05d2),
        _0x1f21f7["SYmBk"](0xffff, _0x23d059),
      ),
      _0x3b0ab7;
    return (
      (_0x1f21f7["swvcc"](
        _0x1f21f7["ePruZ"](_0x5d05d2, 0x10) +
          _0x1f21f7["ePruZ"](_0x23d059, 0x10),
        _0x1f21f7["dnWlK"](_0x25d3d9, 0x10),
      ) <<
        0x10) |
      (0xffff & _0x25d3d9)
    );
  }
  function _0x2f8b56(_0x3cb206, _0x3b83b4) {
    const _0x610fec = null;
    return _0x1f21f7["MnzBh"](
      _0x1f21f7["WFnEO"](_0x3cb206, _0x3b83b4),
      _0x3cb206 >>> _0x1f21f7["bgEgg"](0x20, _0x3b83b4),
    );
  }
  function _0x1e821a(
    _0xce4859,
    _0x3e05a9,
    _0x46e3e4,
    _0x55aaa6,
    _0x3789c9,
    _0x5a4af6,
  ) {
    const _0x29489f = null;
    return _0x1f21f7["ueAKM"](
      _0x137d42,
      _0x1f21f7["jfbaE"](
        _0x2f8b56,
        _0x1f21f7["WwfkL"](
          _0x137d42,
          _0x137d42(_0x3e05a9, _0xce4859),
          _0x137d42(_0x55aaa6, _0x5a4af6),
        ),
        _0x3789c9,
      ),
      _0x46e3e4,
    );
  }
  function _0x556674(
    _0x4b0996,
    _0x5b0cf4,
    _0x3134a9,
    _0x5834c7,
    _0xe9da30,
    _0x2e94c5,
    _0x2f1c22,
  ) {
    const _0x17c52e = null;
    return _0x1f21f7["fyzaA"](
      _0x1e821a,
      _0x1f21f7["DKCSg"](_0x5b0cf4, _0x3134a9) |
        _0x1f21f7["KyEKu"](~_0x5b0cf4, _0x5834c7),
      _0x4b0996,
      _0x5b0cf4,
      _0xe9da30,
      _0x2e94c5,
      _0x2f1c22,
    );
  }
  function _0x6edb37(
    _0x2cc02a,
    _0x23c0b8,
    _0x41a0a2,
    _0x33aa30,
    _0x4275f1,
    _0x6f2301,
    _0x236ce1,
  ) {
    const _0x3afe5f = null;
    return _0x1f21f7["QAaMg"](
      _0x1e821a,
      _0x1f21f7["Zgaii"](
        _0x23c0b8 & _0x33aa30,
        _0x1f21f7["DKCSg"](_0x41a0a2, ~_0x33aa30),
      ),
      _0x2cc02a,
      _0x23c0b8,
      _0x4275f1,
      _0x6f2301,
      _0x236ce1,
    );
  }
  function _0x44c910(
    _0x51ee38,
    _0x41f5c5,
    _0xc0a5a7,
    _0x422b04,
    _0x2827cd,
    _0x2926bf,
    _0x4b2489,
  ) {
    const _0x438792 = null;
    return _0x1f21f7["fyzaA"](
      _0x1e821a,
      _0x1f21f7["kKpnB"](_0x1f21f7["nQBbG"](_0x41f5c5, _0xc0a5a7), _0x422b04),
      _0x51ee38,
      _0x41f5c5,
      _0x2827cd,
      _0x2926bf,
      _0x4b2489,
    );
  }
  function _0xeaacd0(
    _0x37b302,
    _0x2615c6,
    _0x5eb8d8,
    _0x2b74e2,
    _0x55c746,
    _0x41df57,
    _0x46b3d3,
  ) {
    const _0x3752be = null;
    return _0x1f21f7["FMLmq"](
      _0x1e821a,
      _0x1f21f7["nQBbG"](_0x5eb8d8, _0x1f21f7["Zgaii"](_0x2615c6, ~_0x2b74e2)),
      _0x37b302,
      _0x2615c6,
      _0x55c746,
      _0x41df57,
      _0x46b3d3,
    );
  }
  function _0x9cc193(_0x5c153a, _0x42b568) {
    const _0x558205 = null,
      _0x2a8973 = _0x1f21f7["WNVxd"]["split"]("|");
    let _0x17c58a = 0x0;
    while (!![]) {
      switch (_0x2a8973[_0x17c58a++]) {
        case "0":
          var _0x384ad4 = 0x67452301,
            _0x3bb7b3 = -0x10325477,
            _0x208747 = -0x67452302,
            _0x223c56 = 0x10325476;
          continue;
        case "1":
          ((_0x5c153a[_0x1f21f7["nLASV"](_0x42b568, 0x5)] |= _0x1f21f7["WFnEO"](
            0x80,
            _0x1f21f7["LCSzn"](_0x42b568, 0x20),
          )),
            (_0x5c153a[
              _0x1f21f7["jSWYR"](
                0xe,
                _0x1f21f7["aRcnl"](_0x1f21f7["swvcc"](_0x42b568, 0x40), 0x9) <<
                  0x4,
              )
            ] = _0x42b568));
          continue;
        case "2":
          for (
            _0x24907b = 0x0;
            _0x24907b < _0x5c153a["length"];
            _0x24907b += 0x10
          )
            ((_0x4edf31 = null),
              (_0x15d9bc = null),
              (_0x5a2b74 = null),
              (_0x2cc331 = null),
              (_0x3bb7b3 = _0x1f21f7["GmaZE"](
                _0xeaacd0,
                (_0x3bb7b3 = _0x1f21f7["SJfiO"](
                  _0xeaacd0,
                  (_0x3bb7b3 = _0x1f21f7["vivPH"](
                    _0xeaacd0,
                    (_0x3bb7b3 = _0x1f21f7["SJfiO"](
                      _0xeaacd0,
                      (_0x3bb7b3 = _0x1f21f7["OxYHF"](
                        _0x44c910,
                        (_0x3bb7b3 = _0x44c910(
                          (_0x3bb7b3 = _0x1f21f7["SJfiO"](
                            _0x44c910,
                            (_0x3bb7b3 = _0x44c910(
                              (_0x3bb7b3 = _0x1f21f7["vqoQL"](
                                _0x6edb37,
                                (_0x3bb7b3 = _0x1f21f7["dDFyf"](
                                  _0x6edb37,
                                  (_0x3bb7b3 = _0x1f21f7["vqoQL"](
                                    _0x6edb37,
                                    (_0x3bb7b3 = _0x1f21f7["dkBgE"](
                                      _0x6edb37,
                                      (_0x3bb7b3 = _0x556674(
                                        (_0x3bb7b3 = _0x1f21f7["OxYHF"](
                                          _0x556674,
                                          (_0x3bb7b3 = _0x556674(
                                            (_0x3bb7b3 = _0x1f21f7["fVtHa"](
                                              _0x556674,
                                              _0x3bb7b3,
                                              (_0x208747 = _0x1f21f7["OxYHF"](
                                                _0x556674,
                                                _0x208747,
                                                (_0x223c56 = _0x1f21f7["SJfiO"](
                                                  _0x556674,
                                                  _0x223c56,
                                                  (_0x384ad4 = _0x1f21f7[
                                                    "SrRNi"
                                                  ](
                                                    _0x556674,
                                                    _0x384ad4,
                                                    _0x3bb7b3,
                                                    _0x208747,
                                                    _0x223c56,
                                                    _0x5c153a[_0x24907b],
                                                    0x7,
                                                    -0x28955b88,
                                                  )),
                                                  _0x3bb7b3,
                                                  _0x208747,
                                                  _0x5c153a[
                                                    _0x1f21f7["PkEKQ"](
                                                      _0x24907b,
                                                      0x1,
                                                    )
                                                  ],
                                                  0xc,
                                                  -0x173848aa,
                                                )),
                                                _0x384ad4,
                                                _0x3bb7b3,
                                                _0x5c153a[
                                                  _0x1f21f7["PkEKQ"](
                                                    _0x24907b,
                                                    0x2,
                                                  )
                                                ],
                                                0x11,
                                                0x242070db,
                                              )),
                                              _0x223c56,
                                              _0x384ad4,
                                              _0x5c153a[
                                                _0x1f21f7["fTyJE"](
                                                  _0x24907b,
                                                  0x3,
                                                )
                                              ],
                                              0x16,
                                              -0x3e423112,
                                            )),
                                            (_0x208747 = _0x1f21f7["OkZYC"](
                                              _0x556674,
                                              _0x208747,
                                              (_0x223c56 = _0x1f21f7["SrRNi"](
                                                _0x556674,
                                                _0x223c56,
                                                (_0x384ad4 = _0x1f21f7["IzyoG"](
                                                  _0x556674,
                                                  _0x384ad4,
                                                  _0x3bb7b3,
                                                  _0x208747,
                                                  _0x223c56,
                                                  _0x5c153a[
                                                    _0x1f21f7["TruTh"](
                                                      _0x24907b,
                                                      0x4,
                                                    )
                                                  ],
                                                  0x7,
                                                  -0xa83f051,
                                                )),
                                                _0x3bb7b3,
                                                _0x208747,
                                                _0x5c153a[
                                                  _0x1f21f7["YVXSl"](
                                                    _0x24907b,
                                                    0x5,
                                                  )
                                                ],
                                                0xc,
                                                0x4787c62a,
                                              )),
                                              _0x384ad4,
                                              _0x3bb7b3,
                                              _0x5c153a[_0x24907b + 0x6],
                                              0x11,
                                              -0x57cfb9ed,
                                            )),
                                            _0x223c56,
                                            _0x384ad4,
                                            _0x5c153a[
                                              _0x1f21f7["fTyJE"](_0x24907b, 0x7)
                                            ],
                                            0x16,
                                            -0x2b96aff,
                                          )),
                                          (_0x208747 = _0x1f21f7["vKnOi"](
                                            _0x556674,
                                            _0x208747,
                                            (_0x223c56 = _0x1f21f7["IFOkn"](
                                              _0x556674,
                                              _0x223c56,
                                              (_0x384ad4 = _0x1f21f7["dgfRT"](
                                                _0x556674,
                                                _0x384ad4,
                                                _0x3bb7b3,
                                                _0x208747,
                                                _0x223c56,
                                                _0x5c153a[_0x24907b + 0x8],
                                                0x7,
                                                0x698098d8,
                                              )),
                                              _0x3bb7b3,
                                              _0x208747,
                                              _0x5c153a[_0x24907b + 0x9],
                                              0xc,
                                              -0x74bb0851,
                                            )),
                                            _0x384ad4,
                                            _0x3bb7b3,
                                            _0x5c153a[
                                              _0x1f21f7["dmCDy"](_0x24907b, 0xa)
                                            ],
                                            0x11,
                                            -0xa44f,
                                          )),
                                          _0x223c56,
                                          _0x384ad4,
                                          _0x5c153a[_0x24907b + 0xb],
                                          0x16,
                                          -0x76a32842,
                                        )),
                                        (_0x208747 = _0x1f21f7["qWAdh"](
                                          _0x556674,
                                          _0x208747,
                                          (_0x223c56 = _0x556674(
                                            _0x223c56,
                                            (_0x384ad4 = _0x1f21f7["IFOkn"](
                                              _0x556674,
                                              _0x384ad4,
                                              _0x3bb7b3,
                                              _0x208747,
                                              _0x223c56,
                                              _0x5c153a[
                                                _0x1f21f7["LniNO"](
                                                  _0x24907b,
                                                  0xc,
                                                )
                                              ],
                                              0x7,
                                              0x6b901122,
                                            )),
                                            _0x3bb7b3,
                                            _0x208747,
                                            _0x5c153a[
                                              _0x1f21f7["swvcc"](_0x24907b, 0xd)
                                            ],
                                            0xc,
                                            -0x2678e6d,
                                          )),
                                          _0x384ad4,
                                          _0x3bb7b3,
                                          _0x5c153a[
                                            _0x1f21f7["fTWWC"](_0x24907b, 0xe)
                                          ],
                                          0x11,
                                          -0x5986bc72,
                                        )),
                                        _0x223c56,
                                        _0x384ad4,
                                        _0x5c153a[
                                          _0x1f21f7["YVXSl"](_0x24907b, 0xf)
                                        ],
                                        0x16,
                                        0x49b40821,
                                      )),
                                      (_0x208747 = _0x1f21f7["gHhmi"](
                                        _0x6edb37,
                                        _0x208747,
                                        (_0x223c56 = _0x1f21f7["fVtHa"](
                                          _0x6edb37,
                                          _0x223c56,
                                          (_0x384ad4 = _0x1f21f7["KIocb"](
                                            _0x6edb37,
                                            _0x384ad4,
                                            _0x3bb7b3,
                                            _0x208747,
                                            _0x223c56,
                                            _0x5c153a[
                                              _0x1f21f7["NbYPS"](_0x24907b, 0x1)
                                            ],
                                            0x5,
                                            -0x9e1da9e,
                                          )),
                                          _0x3bb7b3,
                                          _0x208747,
                                          _0x5c153a[_0x24907b + 0x6],
                                          0x9,
                                          -0x3fbf4cc0,
                                        )),
                                        _0x384ad4,
                                        _0x3bb7b3,
                                        _0x5c153a[
                                          _0x1f21f7["yEYkd"](_0x24907b, 0xb)
                                        ],
                                        0xe,
                                        0x265e5a51,
                                      )),
                                      _0x223c56,
                                      _0x384ad4,
                                      _0x5c153a[_0x24907b],
                                      0x14,
                                      -0x16493856,
                                    )),
                                    (_0x208747 = _0x1f21f7["GmaZE"](
                                      _0x6edb37,
                                      _0x208747,
                                      (_0x223c56 = _0x1f21f7["JKRox"](
                                        _0x6edb37,
                                        _0x223c56,
                                        (_0x384ad4 = _0x1f21f7["OIUVz"](
                                          _0x6edb37,
                                          _0x384ad4,
                                          _0x3bb7b3,
                                          _0x208747,
                                          _0x223c56,
                                          _0x5c153a[
                                            _0x1f21f7["pAWGT"](_0x24907b, 0x5)
                                          ],
                                          0x5,
                                          -0x29d0efa3,
                                        )),
                                        _0x3bb7b3,
                                        _0x208747,
                                        _0x5c153a[
                                          _0x1f21f7["dmCDy"](_0x24907b, 0xa)
                                        ],
                                        0x9,
                                        0x2441453,
                                      )),
                                      _0x384ad4,
                                      _0x3bb7b3,
                                      _0x5c153a[
                                        _0x1f21f7["uiSqK"](_0x24907b, 0xf)
                                      ],
                                      0xe,
                                      -0x275e197f,
                                    )),
                                    _0x223c56,
                                    _0x384ad4,
                                    _0x5c153a[
                                      _0x1f21f7["bRteK"](_0x24907b, 0x4)
                                    ],
                                    0x14,
                                    -0x182c0438,
                                  )),
                                  (_0x208747 = _0x6edb37(
                                    _0x208747,
                                    (_0x223c56 = _0x1f21f7["IzyoG"](
                                      _0x6edb37,
                                      _0x223c56,
                                      (_0x384ad4 = _0x1f21f7["XkOgl"](
                                        _0x6edb37,
                                        _0x384ad4,
                                        _0x3bb7b3,
                                        _0x208747,
                                        _0x223c56,
                                        _0x5c153a[_0x24907b + 0x9],
                                        0x5,
                                        0x21e1cde6,
                                      )),
                                      _0x3bb7b3,
                                      _0x208747,
                                      _0x5c153a[
                                        _0x1f21f7["aHqhl"](_0x24907b, 0xe)
                                      ],
                                      0x9,
                                      -0x3cc8f82a,
                                    )),
                                    _0x384ad4,
                                    _0x3bb7b3,
                                    _0x5c153a[
                                      _0x1f21f7["fTWWC"](_0x24907b, 0x3)
                                    ],
                                    0xe,
                                    -0xb2af279,
                                  )),
                                  _0x223c56,
                                  _0x384ad4,
                                  _0x5c153a[_0x1f21f7["CHdWN"](_0x24907b, 0x8)],
                                  0x14,
                                  0x455a14ed,
                                )),
                                (_0x208747 = _0x1f21f7["KIocb"](
                                  _0x6edb37,
                                  _0x208747,
                                  (_0x223c56 = _0x1f21f7["vivPH"](
                                    _0x6edb37,
                                    _0x223c56,
                                    (_0x384ad4 = _0x1f21f7["zkEzp"](
                                      _0x6edb37,
                                      _0x384ad4,
                                      _0x3bb7b3,
                                      _0x208747,
                                      _0x223c56,
                                      _0x5c153a[
                                        _0x1f21f7["dmCDy"](_0x24907b, 0xd)
                                      ],
                                      0x5,
                                      -0x561c16fb,
                                    )),
                                    _0x3bb7b3,
                                    _0x208747,
                                    _0x5c153a[
                                      _0x1f21f7["pdhPS"](_0x24907b, 0x2)
                                    ],
                                    0x9,
                                    -0x3105c08,
                                  )),
                                  _0x384ad4,
                                  _0x3bb7b3,
                                  _0x5c153a[_0x1f21f7["hadXK"](_0x24907b, 0x7)],
                                  0xe,
                                  0x676f02d9,
                                )),
                                _0x223c56,
                                _0x384ad4,
                                _0x5c153a[_0x24907b + 0xc],
                                0x14,
                                -0x72d5b376,
                              )),
                              (_0x208747 = _0x1f21f7["IzyoG"](
                                _0x44c910,
                                _0x208747,
                                (_0x223c56 = _0x1f21f7["bENNq"](
                                  _0x44c910,
                                  _0x223c56,
                                  (_0x384ad4 = _0x1f21f7["dgfRT"](
                                    _0x44c910,
                                    _0x384ad4,
                                    _0x3bb7b3,
                                    _0x208747,
                                    _0x223c56,
                                    _0x5c153a[_0x24907b + 0x5],
                                    0x4,
                                    -0x5c6be,
                                  )),
                                  _0x3bb7b3,
                                  _0x208747,
                                  _0x5c153a[_0x1f21f7["hadXK"](_0x24907b, 0x8)],
                                  0xb,
                                  -0x788e097f,
                                )),
                                _0x384ad4,
                                _0x3bb7b3,
                                _0x5c153a[_0x1f21f7["fTyJE"](_0x24907b, 0xb)],
                                0x10,
                                0x6d9d6122,
                              )),
                              _0x223c56,
                              _0x384ad4,
                              _0x5c153a[_0x1f21f7["MAmVO"](_0x24907b, 0xe)],
                              0x17,
                              -0x21ac7f4,
                            )),
                            (_0x208747 = _0x44c910(
                              _0x208747,
                              (_0x223c56 = _0x1f21f7["HCIFp"](
                                _0x44c910,
                                _0x223c56,
                                (_0x384ad4 = _0x1f21f7["HCIFp"](
                                  _0x44c910,
                                  _0x384ad4,
                                  _0x3bb7b3,
                                  _0x208747,
                                  _0x223c56,
                                  _0x5c153a[_0x1f21f7["xUVcq"](_0x24907b, 0x1)],
                                  0x4,
                                  -0x5b4115bc,
                                )),
                                _0x3bb7b3,
                                _0x208747,
                                _0x5c153a[_0x1f21f7["YVXSl"](_0x24907b, 0x4)],
                                0xb,
                                0x4bdecfa9,
                              )),
                              _0x384ad4,
                              _0x3bb7b3,
                              _0x5c153a[_0x1f21f7["TiGxa"](_0x24907b, 0x7)],
                              0x10,
                              -0x944b4a0,
                            )),
                            _0x223c56,
                            _0x384ad4,
                            _0x5c153a[_0x24907b + 0xa],
                            0x17,
                            -0x41404390,
                          )),
                          (_0x208747 = _0x1f21f7["fVtHa"](
                            _0x44c910,
                            _0x208747,
                            (_0x223c56 = _0x1f21f7["ZbJbK"](
                              _0x44c910,
                              _0x223c56,
                              (_0x384ad4 = _0x1f21f7["HCIFp"](
                                _0x44c910,
                                _0x384ad4,
                                _0x3bb7b3,
                                _0x208747,
                                _0x223c56,
                                _0x5c153a[_0x1f21f7["IkJtr"](_0x24907b, 0xd)],
                                0x4,
                                0x289b7ec6,
                              )),
                              _0x3bb7b3,
                              _0x208747,
                              _0x5c153a[_0x24907b],
                              0xb,
                              -0x155ed806,
                            )),
                            _0x384ad4,
                            _0x3bb7b3,
                            _0x5c153a[_0x24907b + 0x3],
                            0x10,
                            -0x2b10cf7b,
                          )),
                          _0x223c56,
                          _0x384ad4,
                          _0x5c153a[_0x1f21f7["aHqhl"](_0x24907b, 0x6)],
                          0x17,
                          0x4881d05,
                        )),
                        (_0x208747 = _0x1f21f7["HCIFp"](
                          _0x44c910,
                          _0x208747,
                          (_0x223c56 = _0x1f21f7["BzMui"](
                            _0x44c910,
                            _0x223c56,
                            (_0x384ad4 = _0x1f21f7["jLEQe"](
                              _0x44c910,
                              _0x384ad4,
                              _0x3bb7b3,
                              _0x208747,
                              _0x223c56,
                              _0x5c153a[_0x1f21f7["QkeTN"](_0x24907b, 0x9)],
                              0x4,
                              -0x262b2fc7,
                            )),
                            _0x3bb7b3,
                            _0x208747,
                            _0x5c153a[_0x1f21f7["TiGxa"](_0x24907b, 0xc)],
                            0xb,
                            -0x1924661b,
                          )),
                          _0x384ad4,
                          _0x3bb7b3,
                          _0x5c153a[_0x1f21f7["cPkTo"](_0x24907b, 0xf)],
                          0x10,
                          0x1fa27cf8,
                        )),
                        _0x223c56,
                        _0x384ad4,
                        _0x5c153a[_0x24907b + 0x2],
                        0x17,
                        -0x3b53a99b,
                      )),
                      (_0x208747 = _0x1f21f7["AEgVh"](
                        _0xeaacd0,
                        _0x208747,
                        (_0x223c56 = _0x1f21f7["qWAdh"](
                          _0xeaacd0,
                          _0x223c56,
                          (_0x384ad4 = _0xeaacd0(
                            _0x384ad4,
                            _0x3bb7b3,
                            _0x208747,
                            _0x223c56,
                            _0x5c153a[_0x24907b],
                            0x6,
                            -0xbd6ddbc,
                          )),
                          _0x3bb7b3,
                          _0x208747,
                          _0x5c153a[_0x24907b + 0x7],
                          0xa,
                          0x432aff97,
                        )),
                        _0x384ad4,
                        _0x3bb7b3,
                        _0x5c153a[_0x1f21f7["VVQmp"](_0x24907b, 0xe)],
                        0xf,
                        -0x546bdc59,
                      )),
                      _0x223c56,
                      _0x384ad4,
                      _0x5c153a[_0x1f21f7["vPXCj"](_0x24907b, 0x5)],
                      0x15,
                      -0x36c5fc7,
                    )),
                    (_0x208747 = _0x1f21f7["dgfRT"](
                      _0xeaacd0,
                      _0x208747,
                      (_0x223c56 = _0x1f21f7["zkEzp"](
                        _0xeaacd0,
                        _0x223c56,
                        (_0x384ad4 = _0x1f21f7["jZYsU"](
                          _0xeaacd0,
                          _0x384ad4,
                          _0x3bb7b3,
                          _0x208747,
                          _0x223c56,
                          _0x5c153a[_0x1f21f7["xUVcq"](_0x24907b, 0xc)],
                          0x6,
                          0x655b59c3,
                        )),
                        _0x3bb7b3,
                        _0x208747,
                        _0x5c153a[_0x24907b + 0x3],
                        0xa,
                        -0x70f3336e,
                      )),
                      _0x384ad4,
                      _0x3bb7b3,
                      _0x5c153a[_0x1f21f7["hadXK"](_0x24907b, 0xa)],
                      0xf,
                      -0x100b83,
                    )),
                    _0x223c56,
                    _0x384ad4,
                    _0x5c153a[_0x24907b + 0x1],
                    0x15,
                    -0x7a7ba22f,
                  )),
                  (_0x208747 = _0x1f21f7["vKnOi"](
                    _0xeaacd0,
                    _0x208747,
                    (_0x223c56 = _0x1f21f7["vivPH"](
                      _0xeaacd0,
                      _0x223c56,
                      (_0x384ad4 = _0xeaacd0(
                        _0x384ad4,
                        _0x3bb7b3,
                        _0x208747,
                        _0x223c56,
                        _0x5c153a[_0x1f21f7["tHvKm"](_0x24907b, 0x8)],
                        0x6,
                        0x6fa87e4f,
                      )),
                      _0x3bb7b3,
                      _0x208747,
                      _0x5c153a[_0x24907b + 0xf],
                      0xa,
                      -0x1d31920,
                    )),
                    _0x384ad4,
                    _0x3bb7b3,
                    _0x5c153a[_0x1f21f7["pEzTG"](_0x24907b, 0x6)],
                    0xf,
                    -0x5cfebcec,
                  )),
                  _0x223c56,
                  _0x384ad4,
                  _0x5c153a[_0x1f21f7["GrGKk"](_0x24907b, 0xd)],
                  0x15,
                  0x4e0811a1,
                )),
                (_0x208747 = _0x1f21f7["vivPH"](
                  _0xeaacd0,
                  _0x208747,
                  (_0x223c56 = _0x1f21f7["ZbJbK"](
                    _0xeaacd0,
                    _0x223c56,
                    (_0x384ad4 = _0x1f21f7["IaKXa"](
                      _0xeaacd0,
                      _0x384ad4,
                      _0x3bb7b3,
                      _0x208747,
                      _0x223c56,
                      _0x5c153a[_0x1f21f7["wzwzr"](_0x24907b, 0x4)],
                      0x6,
                      -0x8ac817e,
                    )),
                    _0x3bb7b3,
                    _0x208747,
                    _0x5c153a[_0x1f21f7["kBLBH"](_0x24907b, 0xb)],
                    0xa,
                    -0x42c50dcb,
                  )),
                  _0x384ad4,
                  _0x3bb7b3,
                  _0x5c153a[_0x1f21f7["TruTh"](_0x24907b, 0x2)],
                  0xf,
                  0x2ad7d2bb,
                )),
                _0x223c56,
                _0x384ad4,
                _0x5c153a[_0x1f21f7["tHvKm"](_0x24907b, 0x9)],
                0x15,
                -0x14792c6f,
              )),
              (_0x384ad4 = _0x1f21f7["ueAKM"](_0x137d42, _0x384ad4, _0x4edf31)),
              (_0x3bb7b3 = _0x1f21f7["fqLyn"](_0x137d42, _0x3bb7b3, _0x15d9bc)),
              (_0x208747 = _0x137d42(_0x208747, _0x5a2b74)),
              (_0x223c56 = _0x1f21f7["dPMbD"](
                _0x137d42,
                _0x223c56,
                _0x2cc331,
              )));
          continue;
        case "3":
          return [_0x384ad4, _0x3bb7b3, _0x208747, _0x223c56];
        case "4":
          var _0x24907b, _0x4edf31, _0x15d9bc, _0x5a2b74, _0x2cc331;
          continue;
      }
      break;
    }
  }
  function _0x50ea51(_0x5ce175) {
    const _0x341b95 = null;
    var _0x2d6737,
      _0x178b7e = "",
      _0xf302ee = 0x20 * _0x5ce175["length"];
    for (
      _0x2d6737 = 0x0;
      _0x1f21f7["FhjkZ"](_0x2d6737, _0xf302ee);
      _0x2d6737 += 0x8
    )
      _0x178b7e += String["fromCharCode"](
        _0x1f21f7["aRcnl"](
          _0x5ce175[_0x1f21f7["VMoKp"](_0x2d6737, 0x5)],
          _0x1f21f7["LCSzn"](_0x2d6737, 0x20),
        ) & 0xff,
      );
    return _0x178b7e;
  }
  function _0x29b34d(_0x34f282) {
    const _0x8fff68 = null,
      _0x44f24b = _0x1f21f7["QMjge"]["split"]("|");
    let _0x5fae6b = 0x0;
    while (!![]) {
      switch (_0x44f24b[_0x5fae6b++]) {
        case "0":
          for (_0x23e610 = 0x0; _0x23e610 < _0x2254fe; _0x23e610 += 0x8)
            _0x3b69c5[_0x1f21f7["nLASV"](_0x23e610, 0x5)] |= _0x1f21f7["WFnEO"](
              _0x1f21f7["KyEKu"](
                0xff,
                _0x34f282["charCodeAt"](_0x23e610 / 0x8),
              ),
              _0x1f21f7["LCSzn"](_0x23e610, 0x20),
            );
          continue;
        case "1":
          var _0x2254fe = _0x1f21f7["yNVJE"](0x8, _0x34f282["length"]);
          continue;
        case "2":
          for (
            _0x3b69c5[
              _0x1f21f7["MRHnI"](
                _0x1f21f7["dnWlK"](_0x34f282["length"], 0x2),
                0x1,
              )
            ] = void 0x0,
              _0x23e610 = 0x0;
            _0x1f21f7["FhjkZ"](_0x23e610, _0x3b69c5["length"]);
            _0x23e610 += 0x1
          )
            _0x3b69c5[_0x23e610] = 0x0;
          continue;
        case "3":
          var _0x23e610,
            _0x3b69c5 = [];
          continue;
        case "4":
          return _0x3b69c5;
      }
      break;
    }
  }
  function _0x158fdb(_0x322fab) {
    const _0x5ce50b = null;
    return _0x1f21f7["KTbZI"](
      _0x50ea51,
      _0x1f21f7["RHMxQ"](
        _0x9cc193,
        _0x1f21f7["zkxuc"](_0x29b34d, _0x322fab),
        0x8 * _0x322fab["length"],
      ),
    );
  }
  function _0x257071(_0x786736, _0x21848d) {
    const _0x25ed33 = null;
    var _0x5bc4eb,
      _0x239460 = _0x29b34d(_0x786736),
      _0x5b0446 = [],
      _0x3653d1 = [],
      _0x280460;
    for (
      _0x5b0446[0xf] = _0x3653d1[0xf] = void 0x0,
        _0x1f21f7["bIrxS"](_0x239460["length"], 0x10) &&
          (_0x239460 = _0x9cc193(
            _0x239460,
            _0x1f21f7["UbClY"](0x8, _0x786736["length"]),
          )),
        _0x5bc4eb = 0x0;
      _0x1f21f7["FhjkZ"](_0x5bc4eb, 0x10);
      _0x5bc4eb += 0x1
    )
      ((_0x5b0446[_0x5bc4eb] = _0x1f21f7["TaZGO"](
        0x36363636,
        _0x239460[_0x5bc4eb],
      )),
        (_0x3653d1[_0x5bc4eb] = _0x1f21f7["bMqIB"](
          0x5c5c5c5c,
          _0x239460[_0x5bc4eb],
        )));
    return (
      (_0x280460 = _0x1f21f7["ATMQS"](
        _0x9cc193,
        _0x5b0446["concat"](_0x29b34d(_0x21848d)),
        _0x1f21f7["wgOOR"](0x200, _0x1f21f7["UbClY"](0x8, _0x21848d["length"])),
      )),
      _0x50ea51(
        _0x1f21f7["RgYNH"](_0x9cc193, _0x3653d1["concat"](_0x280460), 0x280),
      )
    );
  }
  function _0x9d69f1(_0x36e772) {
    const _0x23620f = null;
    var _0x42a123 = _0x1f21f7["ygucS"],
      _0x3f8cf1 = "",
      _0x39ff07,
      _0x277ea5;
    for (
      _0x277ea5 = 0x0;
      _0x1f21f7["FhjkZ"](_0x277ea5, _0x36e772["length"]);
      _0x277ea5 += 0x1
    )
      ((_0x39ff07 = _0x36e772["charCodeAt"](_0x277ea5)),
        (_0x3f8cf1 += _0x1f21f7["bSQsG"](
          _0x42a123["charAt"](
            _0x1f21f7["SYmBk"](_0x1f21f7["aRcnl"](_0x39ff07, 0x4), 0xf),
          ),
          _0x42a123["charAt"](0xf & _0x39ff07),
        )));
    return _0x3f8cf1;
  }
  function _0x1f0e1f(_0x143785) {
    return _0x1f21f7["KTbZI"](
      unescape,
      _0x1f21f7["oUhna"](encodeURIComponent, _0x143785),
    );
  }
  function _0x23c2fb(_0x4a2ea9) {
    const _0x39fad3 = null;
    return _0x1f21f7["oUhna"](
      _0x158fdb,
      _0x1f21f7["KKypd"](_0x1f0e1f, _0x4a2ea9),
    );
  }
  function _0x173d91(_0x3a0f4b) {
    const _0x49ec7a = null;
    return _0x1f21f7["zkxuc"](
      _0x9d69f1,
      _0x1f21f7["vGWtG"](_0x23c2fb, _0x3a0f4b),
    );
  }
  function _0x18aca0(_0x5ab9a2, _0x47a91d) {
    const _0x17c9ab = null;
    return _0x257071(
      _0x1f21f7["KKypd"](_0x1f0e1f, _0x5ab9a2),
      _0x1f21f7["BiWEp"](_0x1f0e1f, _0x47a91d),
    );
  }
  function _0x3a66fc(_0x10796d, _0x5ec3d1) {
    const _0xc51ea5 = null;
    return _0x1f21f7["vGWtG"](_0x9d69f1, _0x18aca0(_0x10796d, _0x5ec3d1));
  }
  function _0x36d24a(_0x115e3e, _0x3a9ac8, _0x430575) {
    const _0x4be845 = null;
    return _0x3a9ac8
      ? _0x430575
        ? _0x1f21f7["EauHL"](_0x18aca0, _0x3a9ac8, _0x115e3e)
        : _0x1f21f7["MMVAR"](_0x3a66fc, _0x3a9ac8, _0x115e3e)
      : _0x430575
        ? _0x1f21f7["KKypd"](_0x23c2fb, _0x115e3e)
        : _0x1f21f7["KKypd"](_0x173d91, _0x115e3e);
  }
  function _0x39c216(_0x3c1aa5) {
    const _0x3f98f1 = null;
    for (
      var _0x3140f5, _0x3af048 = _0x53c902["split"](";"), _0x8e4115 = 0x0;
      _0x1f21f7["FhjkZ"](_0x8e4115, _0x3af048["length"]);
      _0x8e4115++
    ) {
      var _0x11935c = _0x3af048[_0x8e4115]["split"]("=");
      if (_0x1f21f7["jlubw"](_0x11935c[0x0]["trim"](), _0x3c1aa5))
        return _0x11935c[0x1];
    }
    return null;
  }
  const _0x12acac = _0x39c216(_0x1f21f7["hZEwh"]) || "",
    _0x2e2cd2 = _0x1f21f7["oUhna"](
      _0x36d24a,
      _0x1f21f7["uiSqK"](
        _0x1f21f7["tHvKm"](_0x12acac, _0x3fc8b9),
        Date["now"](),
      ),
    );
  return _0x2e2cd2;
}
async function loadModule() {
  const _0x5a3d4e = null,
    _0x55def0 = {
      HEIjK: function (_0x22c730) {
        return _0x22c730();
      },
    };
  try {
    return (
      ($["Cheerio"] = await _0x55def0["HEIjK"](loadCheerio)),
      $["Cheerio"] ? !![] : ![]
    );
  } catch (_0x531128) {
    throw new Error("⛔️\x20loadModule\x20run\x20error\x20=>\x20" + _0x531128);
  }
}
async function checkEnv() {
  userList = runtime
    .parseAccounts(process.env[ckName])
    .map((account) => new UserInfo(account));
  userCount = userList.length;
  console.log(`共找到 ${userCount} 个账号`);
  if (!userCount)
    throw new Error("未读取到 aliyunWeb_data，请添加并启用环境变量");
  return true;
}
async function Request(options) {
  return runtime.request(options);
}
function randomInt(_0x4a627a, _0x42fc17) {
  const _0x27e3b0 = null,
    _0x23b229 = {
      lpDza: function (_0x4901a0, _0x5c03bf) {
        return _0x4901a0 * _0x5c03bf;
      },
    };
  return Math["round"](
    _0x23b229["lpDza"](Math["random"](), _0x42fc17 - _0x4a627a) + _0x4a627a,
  );
}
function DoubleLog(_0x4e8f4a) {
  const _0xb1babf = null;
  if (_0x4e8f4a && $["isNode"]())
    (console["log"]("" + _0x4e8f4a), $["notifyMsg"]["push"]("" + _0x4e8f4a));
  else
    _0x4e8f4a &&
      (console["log"]("" + _0x4e8f4a), $["notifyMsg"]["push"]("" + _0x4e8f4a));
}
function debug(_0x49c1b8, _0x1f6959 = "debug") {
  const _0x451c27 = null,
    _0x528e0c = {
      LwGup: "true",
      zWyGJ: function (_0x425869, _0x3e90be) {
        return _0x425869 == _0x3e90be;
      },
    };
  $["is_debug"] === _0x528e0c["LwGup"] &&
    ($["log"]("\x0a-----------" + _0x1f6959 + "------------\n"),
    $["log"](
      _0x528e0c["zWyGJ"](typeof _0x49c1b8, "string")
        ? _0x49c1b8
        : $["toStr"](_0x49c1b8) || "debug error => t=" + _0x49c1b8,
    ),
    $["log"]("\n-----------" + _0x1f6959 + "------------\n"));
}
async function SendMsgList(list) {
  const messages = (list || []).map(
    (item) => `账号 ${item.id}\n${(item.message || []).join("\n")}`,
  );
  if ($.notifyMsg.length) messages.push($.notifyMsg.join("\n"));
  await runtime.notify(
    "阿里云社区",
    messages.join("\n\n────────\n\n") || "任务已执行，详细结果请查看青龙日志。",
  );
}
function ObjectKeys2LowerCase(_0x4ec005) {
  const _0x40086c = null;
  return (
    (_0x4ec005 = Object["fromEntries"](
      Object["entries"](_0x4ec005)["map"](([_0x33721f, _0x551a42]) => [
        _0x33721f["toLowerCase"](),
        _0x551a42,
      ]),
    )),
    new Proxy(_0x4ec005, {
      get: function (_0x1fecbc, _0x3ef758, _0x3e420b) {
        const _0x106092 = null;
        return Reflect["get"](_0x1fecbc, _0x3ef758["toLowerCase"](), _0x3e420b);
      },
      set: function (_0x4cede0, _0x4cd234, _0x56b9d3, _0x2b6205) {
        const _0xf82211 = null;
        return Reflect["set"](
          _0x4cede0,
          _0x4cd234["toLowerCase"](),
          _0x56b9d3,
          _0x2b6205,
        );
      },
    })
  );
}
async function loadCheerio() {
  return require("cheerio");
}
async function run() {
  console.log("阿里云社区青龙适配版 v2026.10.03.1");
  try {
    runtime.validateSettings(process.env);
    await checkEnv();
    await loadModule();
    await main();
    if (userList.some((account) => account.ckStatus === false))
      process.exitCode = 1;
  } catch (error) {
    const reason = /aliyunWeb_|Cookie token/.test(error.message)
      ? error.message
      : "请检查 aliyunWeb_data、依赖 cheerio 和网络";
    console.error(`运行失败：${reason}`);
    $.notifyMsg.push(`运行失败：${reason}`);
    process.exitCode = 1;
  } finally {
    await SendMsgList($.notifyList);
  }
}
module.exports = { run, UserInfo };
if (require.main === module)
  run().catch(() => {
    console.error("任务结束或通知汇总异常");
    process.exitCode = 1;
  });
