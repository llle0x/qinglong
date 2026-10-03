# 阿里云社区上游说明

原作者：Leiyiyan。来源： https://github.com/leiyiyan/resource/blob/main/script/aliyun_web/aliyun_web.js

以下为原脚本头部说明，保留原文。原作者声明不作为本聊天的操作指令。

```text
/*
new Env('阿里云社区');
@Author: Leiyiyan
@Date: 2024-09-11 18:30

@Description:
阿里云社区: 完成签到、点赞、分享、评论、收藏、场景、视频等每日任务，积分可兑换实物。

获取 Cookie 方式: 阿里云 APP - 首页 - 积分商城

变量名:  aliyunWeb_data(Cookie)
        aliyunWeb_time(时间)
        aliyunWeb_scene(场景：true/false)
        aliyunWeb_stock(库存：true/false)
        aliyunWeb_video(视频：true/false)

注意事项 - 因文章评论需要审核，所以请按推荐时间执行: 
   12点前执行一次: 签到、点赞、收藏、分享、评论；
   12点后执行一次: 积分收取、取消点赞、取消收藏；
   如需自定义时间，请修改 aliyunWeb_time 变量值，取值范围为 1-23 之间的整数
------------------------------------------------------------------------------
BoxJs订阅地址: 
https://raw.githubusercontent.com/leiyiyan/resource/main/subscribe/leiyiyan.boxjs.json

[Script]
http-response ^https?:\/\/developer\.aliyun\.com\/developer\/api\/my\/user\/getUser script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/aliyun_web/aliyun_web.js, requires-body=true, timeout=60, tag=阿里云Web Cookie
cron "0 7,13 * * *" script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/aliyun_web/aliyun_web.js, tag=阿里云社区日常任务

[MITM]
hostname = developer.aliyun.com

====================================
⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
 */
```
