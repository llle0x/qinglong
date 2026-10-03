# qinglong

爱奇艺会员签到及 iPhone Surge / BoxJS → 青龙 Cookie 同步。

基于 [NobyDa 爱奇艺签到脚本](https://github.com/NobyDa/Script/blob/master/iQIYI-DailyBonus/iQIYI.js) 修改，遵循 GPL-3.0。修改日期：2026-10-03。

## 青龙签到

1. 订阅仓库 `https://github.com/llle0x/qinglong.git`，分支 `main`，白名单填 `^iQIYI\.js$`。
2. 创建环境变量 `IQIYI_COOKIE`，填写完整爱奇艺 Cookie；必须含 `P00001` 和 `P00003`（或 `P00010`），建议同时保留 `__dfp` / `dfp`。多账号在同一个变量里每行放一个完整 Cookie。
3. 创建任务，命令 `task llle0x_qinglong/iQIYI.js`，定时规则 `10 9 * * *`。订阅目录名取决于青龙版本和设置，请以脚本管理显示的实际路径为准。
4. 首次手动运行检查日志。支持多账号按行分隔，Node.js 18 或更高，无需额外依赖。

也可以单独下载根目录 `iQIYI.js`，任务命令为 `task iQIYI.js`。不要添加 `surge/` 下的文件为青龙任务。

保留上游的签到、抽奖、任务领取逻辑；终端显示各接口结果。优先通过青龙 `QLAPI.systemNotify` 使用系统通知设置汇总推送；旧版环境回退到 `sendNotify.js`，需配置通知环境变量。网络请求限定为爱奇艺 HTTPS 域名、不跟随跳转，单个请求上限 20 秒。未使用真实账号验证当前接口及奖励是否有效，功能以实际运行结果为准。

## iPhone 自动同步

1. 在青龙“系统设置 → 应用设置”新建应用，只勾选环境变量权限，取得 Client ID / Secret。
2. Surge 已安装 BoxJS 的情况下，添加以下 BoxJS 订阅：

   `https://raw.githubusercontent.com/llle0x/qinglong/main/qinglong.boxjs.json`

3. 打开 BoxJS 应用“爱奇艺 → 青龙”，填写青龙面板根地址、Client ID、Client Secret 并保存。根地址不要加 `/open`；远程使用 HTTPS，局域网可用例如 `http://192.168.1.100:5700`。
4. 将以下模块导入 Surge：

   `https://raw.githubusercontent.com/llle0x/qinglong/main/surge/iQIYI-Qinglong.sgmodule`

5. 为 `passport.iqiyi.com` 启用 MITM，确认 Surge CA 证书已安装并信任。Safari 打开 `https://m.iqiyi.com/user.html`，用密码登录；匹配到请求并捕获完整 Cookie 后会保存到 `CookieQY`，随后立即同步。
6. 打开青龙环境变量页面确认 `IQIYI_COOKIE` 已更新，运行签到任务检查结果。

本模块只有 Cookie 捕获及同步，签到由青龙执行。若同时安装原 NobyDa 模块，请关闭其同地址的获取脚本和定时签到，避免 Surge 的匹配规则冲突及重复签到。

已有 NobyDa 脚本保存的 `CookieQY` 可以直接同步：本模块默认每小时 15 分读取本地值并重试；也可手动运行 `surge/iqiyi-sync.js`。定时同步不重新登录、不续期 Cookie。手机须能访问青龙，局域网地址在外出时需要安全的远程连接。

如果青龙存在多个 `IQIYI_COOKIE`，请将要更新的那一条备注设为 `Surge iQIYI`，且只有一条使用该备注。存在歧义时同步脚本停止，不会批量覆盖；已禁用的变量也不会自动启用。

## 安全与配置

Cookie 和应用密钥仅在自己的设备配置；仓库不包含任何账号凭证。同步请求不自动跟随跳转，不输出 Cookie、密钥、令牌或青龙响应正文。第三方脚本能读取所需的本地数据，启用前请审查代码。BoxJS 备份可能包含凭证，请妥善保存，勿公开上传。

## 验证

`node --test tests/compatibility.test.cjs`

测试使用模拟接口，覆盖字段校验、捕获存储、创建和更新、未变化跳过、重复变量、禁用变量、接口失败及凭证不出现在通知中。未连接真实爱奇艺或青龙服务。

## 排查同步问题

Surge 脚本控制台显示 `Result: {}` 仅表示脚本调用了结束接口，不能证明同步成功。请查看控制台的“同步结果”或“同步未完成”信息。新版会记录步骤和失败原因，不显示凭证。

青龙任务在请求接口前失败时，新版会指出环境变量未读取、缺少哪些字段或格式错误。先运行仓库订阅更新脚本；如果已有任务名称显示 `item.taskTitle,`，可手动改为“爱奇艺会员签到”，任务命令保持原脚本路径。

同步脚本 v2026.10.03.3：只有匹配爱奇艺登录接口的请求才进入捕获模式；手动或其他运行入口直接读取本地 `CookieQY`，避免误报“捕获地址不匹配”。

签到脚本 v2026.10.03.4：移除未有接口依据的 Cookie 字符格式限制；保留三个字段非空及控制字符检查，对 URL 参数进行编码，兼容含点号、加号、斜线、等号或连字符的凭证。

## 通知和网页版任务（v2026.10.03.5）

- 默认每次运行汇总各账号结果，优先调用青龙 `QLAPI.systemNotify`，使用系统设置中的通知渠道；脚本不内置通知密钥，不需要在仓库填写任何凭证。
- 环境变量 `IQIYI_NOTIFY` 可设置 `all`（默认，每次通知）、`errors`（异常时通知）或 `off`（关闭）。
- 环境变量 `IQIYI_WEB_TASKS=1` 启用网页签到和热点访问奖励，默认关闭。读取 `__dfp` 或 `dfp`；均不存在时跳过网页版任务。网页接口参数参考 [lzwme/ql-scripts](https://github.com/lzwme/ql-scripts/blob/main/ql_iqiyi.ts)。是否可获得奖励需实际验证。
- 多账号在 `IQIYI_COOKIE` 内按换行分隔，不使用 `&` 分隔，避免 Cookie 值里的特殊字符被误拆分。单个账号异常后继续其他账号，最后推送一条汇总。
- Surge 仍是单账号同步；若目标变量已保存多个账号，脚本会停止以避免覆盖。需要同步手机账号时，为它保留一条独立变量并备注 `Surge iQIYI`。

通知文件查找位置：签到脚本同目录、上一层目录、`/ql/data/scripts/sendNotify.js`、`/ql/scripts/sendNotify.js`。若提示未找到，请从你的青龙安装获取通知文件并放在上述标准位置。调用模块不等于消息已送达，请结合通知模块日志检查渠道。

签到脚本 v2026.10.03.6：签到和任务列表失败时报告接口状态码及经过脱敏的错误消息；任务列表失败纳入通知汇总。会员到期查询成功不代表所有签到接口均接受当前请求，请根据各接口结果判断。

## 系统通知与 TG（v2026.10.03.7）

新版优先调用 `QLAPI.systemNotify({title, content})`，使用青龙系统设置中的 TG 配置。请先在“系统设置 → 通知设置”测试 TG，然后通过青龙 `task` 命令运行签到；在普通 Node.js 终端直接运行可能没有青龙内置接口。

若提示缺少 `QLAPI.systemNotify`，旧环境回退到 `sendNotify.js`，它读取的是 `TG_BOT_TOKEN`、`TG_USER_ID` 等环境变量，不能保证读取面板系统通知设置。两种配置来源不同。无需把 Bot Token 发到聊天或仓库。

通知接口返回成功仅表示接口调用返回成功，实际送达仍需在 Telegram 确认。接口异常不会自动重复调用另一条通知路径，以免重复发送。

## 阿里云社区（aliyun_web.js）

基于 [Leiyiyan 原脚本](https://github.com/leiyiyan/resource/blob/main/script/aliyun_web/aliyun_web.js) 的青龙适配，新版保留签到和积分收取，并按官网现行任务列表执行支持的互动任务；旧评论和场景流程不再自动执行。原作者说明见 `UPSTREAM-ALIYUN.md`。目录中的 `aliyun_web_process.js` 是另一日常版本，`aliyun_web_scene.js` 是独立场景任务，未重复加入以避免重复执行。

### 订阅与依赖

- 仓库链接：`https://github.com/llle0x/qinglong.git`；分支：`main`。
- 白名单：`^(iQIYI|aliyun_web|ninebot)\.js$`。
- 依赖文件：`lib/aliyun-runtime\.js$`。依赖文件要一起拉取，但不创建独立定时任务。
- 青龙“依赖管理 → Node.js”添加 `cheerio@1.0.0`。Node.js 需 18.17 或更高。
- 更新订阅后确认脚本目录里同时有 `aliyun_web.js` 和 `lib/aliyun-runtime.js`。
- 命令：`task llle0x_qinglong/aliyun_web.js`（按实际订阅目录调整）。
- 定时规则：`0 7,13 * * *`，每天 07:00 / 13:00；脚本默认北京时间。

### 环境变量

| 变量                     | 用途                                                                     | 默认值          |
| ------------------------ | ------------------------------------------------------------------------ | --------------- |
| `aliyunWeb_data`         | 完整 Cookie，或原 BoxJS 保存的账号 JSON 数组                             | 必填            |
| `aliyunWeb_time`         | 上午任务与积分收取的分界小时，1–23                                       | `12`            |
| `aliyunWeb_scene`        | 旧场景功能已停用；设为 true 时仅提示手动部署                             | `false`         |
| `aliyunWeb_video`        | 官网仍列出观看视频任务时执行视频流程                                     | `false`         |
| `aliyunWeb_reward_check` | 查询官网积分领取明细；本周期已有已核对名称的奖励则跳过。false 关闭此检查 | `true`          |
| `aliyunWeb_dedupe`       | 本地记录成功请求，避免同一周期重复互动；false 临时关闭去重               | `true`          |
| `aliyunWeb_stock`        | 库存查询开关                                                             | `false`         |
| `aliyunWeb_notify`       | `off` 关闭通知；其他值使用系统通知                                       | 开启            |
| `aliyunWeb_timezone`     | 运行时区                                                                 | `Asia/Shanghai` |

原作者获取方式：阿里云 App → 首页 → 积分商城。原 BoxJS 的 `aliyunWeb_data` 数据可直接使用，例如账号对象带 `token`、`userId`、`userName`、`avatar`。支持单个对象、对象数组，或纯 Cookie 每行一个账号；不使用 `@` 分隔，避免误拆 Cookie 内的字符。

原作者配套的 [aliyun_web_ck.js](https://github.com/leiyiyan/resource/blob/main/script/aliyun_web/aliyun_web_ck.js) 可以同步该环境变量；它还有自动运行任务功能，因此需要“环境变量”和“定时任务”权限，并匹配任务名“阿里云社区”。本次未改动该手机同步脚本。不要同时定时执行多个阿里云日常版本。

分界时间前执行签到与官网当前支持的互动，分界时间后领取积分。新版不自动提交文章/电子书评论、不取消用户点赞或收藏。视频默认关闭；部署解决方案需手动完成。实际任务奖励以账号积分记录为准。

### 通知和运行调整

适配版优先调用青龙 `QLAPI.systemNotify` 使用系统设置中的 TG 配置；旧环境回退到 `sendNotify.js`。Cheerio 改为本地依赖，不再从外部代理下载并执行 JS。取消原版结束时固定 `process.exit(1)` 的行为，运行错误或账号状态异常才标记失败。日志调试强制关闭，不输出原始接口响应。

本地验证：`npm install` 后运行 `npm test`。测试使用模拟接口，未登录真实阿里云账号或发布评论。

### 我们的 Surge / BoxJS 阿里云 Cookie 同步

1. 更新已有 BoxJS 订阅 `https://raw.githubusercontent.com/llle0x/qinglong/main/qinglong.boxjs.json`，出现“阿里云 → 青龙”。它与“爱奇艺 → 青龙”共用地址、Client ID、Client Secret，无需重复填写。只需青龙环境变量权限。
2. 导入 Surge 模块：`https://raw.githubusercontent.com/llle0x/qinglong/main/surge/Aliyun-Qinglong.sgmodule`。
3. 启用 `developer.aliyun.com` 的 MITM，确认 CA 证书已信任；打开阿里云 App → 首页 → 积分商城，匹配用户接口时捕获并同步。
4. 检查青龙的 `aliyunWeb_data` 已更新。任务按青龙定时规则运行；本模块不自动触发任务。

已有本地账号时，可以手动运行 `surge/aliyun-sync.js` 重试同步。同步按用户标识/昵称合并 JSON 账号数组，保留其他账号；目标存在歧义时停止。若青龙已有纯 Cookie 字符串，请先将它整理为含 `token`、`userId` 的账号 JSON 数组，脚本不会盲目覆盖原数据。不要与原作者的 Cookie 同步脚本同时启用相同匹配规则。

## 通用 Surge / BoxJS 凭证同步（推荐）

现在可以只启用一个 [通用模块](https://raw.githubusercontent.com/llle0x/qinglong/main/surge/Qinglong-Sync.sgmodule)，同时同步爱奇艺和阿里云；不再为每个任务单独安装同步模块。它只同步环境变量，任务仍按青龙计划运行。

1. 更新 [BoxJS 青龙订阅](https://raw.githubusercontent.com/llle0x/qinglong/main/qinglong.boxjs.json)，打开“通用凭证 → 青龙”。地址、Client ID、Secret 留空时自动沿用原配置；首次使用才需要填写。应用只需环境变量权限。
2. 禁用之前的爱奇艺和阿里云同步模块，以及相同地址的其他 Cookie 捕获脚本；导入通用模块。启用 MITM 并信任证书。
3. 打开爱奇艺登录页面或阿里云积分商城，捕获后自动同步到 `IQIYI_COOKIE` 或 `aliyunWeb_data`。已保存的 `CookieQY` 和 `aliyunWeb_data` 会继续使用。
4. 需要重试时，在 Surge 手动运行 [通用同步脚本](https://raw.githubusercontent.com/llle0x/qinglong/main/surge/qinglong-sync.js)，一次同步所有已保存凭证。没有自动定时重试；凭证不变时跳过更新通知。

爱奇艺仍为单账号更新；阿里云按账号标识合并 JSON 数组并保留其他账号。目标变量已禁用、多个同名变量无法唯一匹配、原数据格式不兼容时停止对应变量更新，手动同步时继续其他网站。

### 添加其他网站

通用脚本并不能自动识别任意网站的登录信息。新网站只需添加捕获规则，不需要新建 JS：在 BoxJS“自定义同步规则”填写 JSON 数组，再编辑通用模块的“捕获匹配”参数加入该网站接口，并在 Surge MITM 中加入域名。三个位置的地址必须一致。

以下是格式示例，需按真实网站和任务变量名修改：

```json
[
  {
    "id": "my_site",
    "name": "我的网站",
    "pattern": "^https://api\\.example\\.com/account$",
    "envName": "MY_COOKIE",
    "storageKey": "my_site_cookie",
    "kind": "raw",
    "header": "Cookie"
  }
]
```

- 默认从请求头捕获。`header` 可改为 `Authorization`，其完整值原样同步；若任务需要剥离 `Bearer ` 或其他转换，需要另行适配。
- `captureFrom: "response-header"` 从响应头读取；`captureFrom: "response-json"` 配合 `valuePath: "data.token"` 从响应 JSON 读取字符串。
- `kind: "raw"` 同步单个字符串。阿里云内置 `accounts` 格式按账号合并，并读取响应中的账号字段。
- 自定义规则使用相同 `id` 可修改内置规则；例如 `[{"id":"aliyun","enabled":false}]` 禁用阿里云同步。
- 每条规则应对应唯一环境变量、独立本地存储键和精确接口地址；一条请求匹配多条规则时停止，避免凭证写错位置。仅拦截需同步的网站。

所有规则共用一套青龙应用凭证。不同网站可能使用不同身份验证机制，是否能通过 Surge 捕获仍需逐个确认。验证使用模拟接口，未连接真实手机或账号。

### 修复问答跳转与场景重试（v2026.10.04.1）

问答列表改用 `/ask/?pageNum=...`，避免旧地址的 301 跳转；请求失败时不把空值传给 Cheerio。场景查询参数不再重复 URL 编码，修复空列表分支引用未定义变量 `e`。空列表或异常初始化信息会结束当前场景任务；不可执行场景最多选择三次，随后继续视频等后续任务，并在通知汇总里记录场景失败。缺少 `c_csrf` 时给出明确原因；启动失败不会继续关闭场景。

如果旧任务还在反复输出场景日志，先停止它，再运行仓库订阅更新，然后重新运行阿里云任务，确认开头版本为 `v2026.10.04.1`。新版不会保证场景接口或奖励一定可用，实际结果以账号接口响应为准。新增回归验证使用模拟响应，未启动真实场景资源。

### 现行任务更新（v2026.10.04.2）

2026-10-04 核对登录后的 [官网日常任务](https://developer.aliyun.com/mission/daily)，当前列出 10 项任务：其中文章点赞、收藏、分享、回答点赞和观看视频均为每周最多领取一次积分。部署解决方案、审核入选的测评文章、官方推荐的回答、用户关注和子社区关注需由用户选择并完成，脚本在通知中提示。

- 每次先读取任务中心公开配置，再执行支持的任务；任务页面结构变化时停止互动，不回退到旧任务列表。
- 移除每天五轮文章/问答互动、电子书评价、文章评论、旧场景自动启动，以及下午自动取消点赞/收藏。
- 签到只查询“我的社区”的当前签到任务组，不再遍历旧的 19 个社区；无有效任务、过期或无效规则时跳过。
- 从官网当前文章/视频列表选择内容；视频不再固定为旧 ID。最多检查三个视频，流程只执行 30 分钟以内的有效视频，失败或没有可用视频时提示手动完成。视频流程耗时取决于其时长。
- 接口没有明确返回成功时不标记成功；成功请求也不等于积分已经到账，仍需查看领取及积分记录。
- 本地去重记录默认保存于 `/ql/data/config/aliyun-community-state.json`（自定义 `QL_DATA_DIR` 时放在对应数据目录的 config 下）；只保存账号/任务的哈希与周期，不保存 Cookie。周任务以北京时间周一为本地去重周期；这是脚本的去重规则，页面未说明服务器周奖励的具体重置时刻。关闭去重可临时设 `aliyunWeb_dedupe=false`。

更新青龙订阅时，`aliyun_web.js` 和 `lib/aliyun-runtime.js` 必须一起更新，依赖仍是 `cheerio@1.0.0`。现有早上执行、下午领取的定时规则可继续使用。已用真实公开页面验证任务配置和文章/视频列表解析；账号操作与积分到账仅做模拟验证，未利用浏览器登录信息直接执行任务。

### 视频等待与日志（v2026.10.04.3）

视频时长 1309 秒约为 21 分 49 秒，播放流程耗时较长并不代表无限循环。新版不打印每三秒的弹幕正文，只在开始时显示预计等待时间、每分钟显示进度及结束结果。接口耗时计入实际等待时间，计时异常或视频接口失败时退出；一次请求仍受运行适配层的超时限制。如果不需要视频任务，将 `aliyunWeb_video` 设为 `false` 并停止已启动的旧任务；环境变量或脚本更新不会改变正在运行的进程。

### 官网奖励领取记录检查（v2026.10.04.4）

晨间互动前查询官网 `/my/score/listScoreLogByPage` 的领取明细，覆盖北京时间本周所在月份（跨月查询两个月），分页完整读取，每月最多 100 页。积分明细查询失败、格式变化或超过读取上限时跳过本次互动及视频，签到与领取流程保持独立。

已核对的奖励名称对应点赞文章、收藏文章、分享文章、点赞回答。本周期出现正积分领取记录时跳过对应任务；没有记录时继续使用本地成功请求去重。`aliyunWeb_dedupe=false` 不会关闭官网检查，另设 `aliyunWeb_reward_check=false` 才关闭领取明细检查。

**这是领取记录检查，不是完整任务进度接口。** 官网记录的时间是领取时间；延迟领取旧奖励可能使脚本跳过当前周期，未领取的新奖励也可能不在明细中。本地记录用于补充防重复，周周期仍以北京时间周一计算，尚未确认官方重置时刻。视频的奖励记录名称以及两项关注任务的累计奖励次数尚未核实，不用模糊名称或总积分推断它们已达标；本版没有新增自动关注。

## 九号出行签到（青龙版）

基于自己 [Surge 仓库的九号脚本](https://github.com/llle0x/Surge/blob/main/Scripts/ninebot.js) 适配，原流程来源于凉心（52Lxcloud/ScriptKit）。青龙运行根目录 `ninebot.js`，不要运行 Surge 原脚本。Node.js 18.17 或以上，无额外依赖，也不需要本仓库 lib 文件。

1. 仓库订阅白名单改为 `^(iQIYI|aliyun_web|ninebot)\.js$`，重新拉取。
2. 更新已有 BoxJS 订阅，在“九号出行 · 本地登录数据”的数据中复制 `Ninebot.Accounts.SurgeV2` 的完整 JSON 数组。若没有这个键，先在 Surge 启用九号抓取模块，再打开九号 App 签到页面获取数据。旧的 `Ninebot.Accounts` 是另一种格式，不能直接填入此版本。
3. 青龙创建并启用环境变量 `NINEBOT_ACCOUNTS`，值为上述 JSON 数组。请保留捕获的 `tokenHeader`、`deviceHeader`，以及有时同时存在的 `authorization`，不要只复制 Token。示例（值需换成自己真实捕获的值）：

```json
[
  {
    "deviceId": "你的设备ID",
    "token": "你的Token",
    "tokenHeader": "access-token",
    "deviceHeader": "device-id"
  }
]
```

4. 定时规则建议 `20 8 * * *`；命令为 `task llle0x_qinglong_main/ninebot.js`，以青龙脚本管理中的实际目录为准。手动运行一次确认结果。

支持多账号，先查签到状态，已签到就跳过；提交后再查询状态确认成功；单个账号失败不会阻止其他账号。优先使用青龙系统通知设置（含 TG），旧版本回退 sendNotify。`NINEBOT_NOTIFY=off` 可关闭通知。请求限定九号固定 HTTPS 接口、不跟随跳转，每个请求超时 15 秒。日志只含账号序号和签到结果，不打印凭证或接口原始错误信息。

没有使用真实 Token 验证当前接口及 N 币奖励。BoxJS 此入口仅展示手机本地数据，不会自动传给青龙；Token 更新后需重新复制。转由青龙签到后，可关闭 Surge 的 `Ninebot_Checkin` 定时项，保留 `Ninebot_Header` 捕获项。
