# qinglong

爱奇艺会员签到及 iPhone Surge / BoxJS → 青龙 Cookie 同步。

基于 [NobyDa 爱奇艺签到脚本](https://github.com/NobyDa/Script/blob/master/iQIYI-DailyBonus/iQIYI.js) 修改，遵循 GPL-3.0。修改日期：2026-10-03。

## 青龙签到

1. 订阅仓库 `https://github.com/llle0x/qinglong.git`，分支 `main`，白名单填 `^iQIYI\.js$`。
2. 创建环境变量 `IQIYI_COOKIE`，填写完整爱奇艺 Cookie；必须含 `P00001` 和 `P00003`（或 `P00010`），建议同时保留 `__dfp` / `dfp`。多账号在同一个变量里每行放一个完整 Cookie。
3. 创建任务，命令 `task llle0x_qinglong/iQIYI.js`，定时规则 `10 9 * * *`。订阅目录名取决于青龙版本和设置，请以脚本管理显示的实际路径为准。
4. 首次手动运行检查日志。支持多账号按行分隔，Node.js 18 或更高，无需额外依赖。

也可以单独下载根目录 `iQIYI.js`，任务命令为 `task iQIYI.js`。不要添加 `surge/` 下的文件为青龙任务。

保留上游的签到、抽奖、任务领取逻辑；终端显示各接口结果。通过青龙 `sendNotify.js` 汇总推送；需要配置好通知渠道，通知文件缺失时给出日志提示。网络请求限定为爱奇艺 HTTPS 域名、不跟随跳转，单个请求上限 20 秒。未使用真实账号验证当前接口及奖励是否有效，功能以实际运行结果为准。

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

- 默认每次运行汇总各账号结果，调用青龙 `sendNotify.js`。在青龙配置自己的通知渠道；脚本不内置通知密钥，不需要在仓库填写任何凭证。
- 环境变量 `IQIYI_NOTIFY` 可设置 `all`（默认，每次通知）、`errors`（异常时通知）或 `off`（关闭）。
- 环境变量 `IQIYI_WEB_TASKS=1` 启用网页签到和热点访问奖励，默认关闭。读取 `__dfp` 或 `dfp`；均不存在时跳过网页版任务。网页接口参数参考 [lzwme/ql-scripts](https://github.com/lzwme/ql-scripts/blob/main/ql_iqiyi.ts)。是否可获得奖励需实际验证。
- 多账号在 `IQIYI_COOKIE` 内按换行分隔，不使用 `&` 分隔，避免 Cookie 值里的特殊字符被误拆分。单个账号异常后继续其他账号，最后推送一条汇总。
- Surge 仍是单账号同步；若目标变量已保存多个账号，脚本会停止以避免覆盖。需要同步手机账号时，为它保留一条独立变量并备注 `Surge iQIYI`。

通知文件查找位置：签到脚本同目录、上一层目录、`/ql/data/scripts/sendNotify.js`、`/ql/scripts/sendNotify.js`。若提示未找到，请从你的青龙安装获取通知文件并放在上述标准位置。调用模块不等于消息已送达，请结合通知模块日志检查渠道。

签到脚本 v2026.10.03.6：签到和任务列表失败时报告接口状态码及经过脱敏的错误消息；任务列表失败纳入通知汇总。会员到期查询成功不代表所有签到接口均接受当前请求，请根据各接口结果判断。
