# qinglong

爱奇艺会员签到及 iPhone Surge / BoxJS → 青龙 Cookie 同步。

基于 [NobyDa 爱奇艺签到脚本](https://github.com/NobyDa/Script/blob/master/iQIYI-DailyBonus/iQIYI.js) 修改，遵循 GPL-3.0。修改日期：2026-10-03。

## 青龙签到

1. 订阅仓库 `https://github.com/llle0x/qinglong.git`，分支 `main`，白名单填 `^iQIYI\.js$`。
2. 创建环境变量 `IQIYI_COOKIE`，填写完整爱奇艺 Cookie；必须含 `P00001`、`P00003`、`__dfp`。
3. 创建任务，命令 `task llle0x_qinglong/iQIYI.js`，定时规则 `10 9 * * *`。订阅目录名取决于青龙版本和设置，请以脚本管理显示的实际路径为准。
4. 首次手动运行检查日志。支持单账号，Node.js 18 或更高，无需额外依赖。

也可以单独下载根目录 `iQIYI.js`，任务命令为 `task iQIYI.js`。不要添加 `surge/` 下的文件为青龙任务。

保留上游的签到、抽奖、任务领取逻辑；终端显示各接口结果。没有接入 Bark 或青龙 sendNotify。网络请求限定为爱奇艺 HTTPS 域名、不跟随跳转，单个请求上限 20 秒。未使用真实账号验证当前接口及奖励是否有效，功能以实际运行结果为准。

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
