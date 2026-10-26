# 赛事与来源核验（2026-10-26）

[官方规则](https://paypalaihackathon.devpost.com/rules) · [官方FAQ](https://paypalaihackathon.devpost.com/details/faqs)

当前开放，截止 **2026-11-13 04:00北京时间**（11月12日12:00PST）。线上，允许个人/团队/组织；须达居住地成年年龄并满足地区和利益冲突限制。中国大陆未在列举的排除地区中，能注册账号与有参赛资格是两件事。PayPal sandbox及AI必须构成实质功能；新项目或赛期重大更新可参赛。必须公有开源仓库及LICENSE、能运行的构建（本地说明可代替部署）、英文材料和少于3分钟公有YouTube演示。当前未投稿。

现金总奖池67,500美元，另有Render积分。主奖12,000/8,000/5,000；5种荣誉奖各5,000；AG Grid赞助奖5,000/2,000/3个1,000，其他赞助奖以官方表为准。每作品最多一个主奖或荣誉奖，再加一个赞助奖。没有官方普遍证书承诺；参赛留存Devpost项目/收件确认，获奖须公告及身份/贡献/税务核验，表格通常10个工作日内返回。

## 开源与服务来源

| 来源 | 许可证据 | 取舍/实际使用 |
|---|---|---|
| [官方sandbox入门](https://github.com/paypaldev/getting-started-with-paypal-sandbox) | 页面未显示LICENSE | 仅参考账号设置，不复制代码或图 |
| [PayPal Standard Checkout旧教程](https://github.com/paypaldev/PayPal-Standard-Checkout-Tutorial) / [LICENSE](https://github.com/paypaldev/PayPal-Standard-Checkout-Tutorial/blob/main/LICENSE) | MIT；现已归档 | 评估备选，未复制，避免采用旧版流程 |
| [PayPal Orders官方说明](https://developer.paypal.com/api/rest/integration/orders-api) | 服务条款适用 | 独立实现OAuth/Create/Capture REST适配器，硬编码sandbox |
| AG Grid Community 36.2.0 | node_modules/ag-grid-community/LICENSE.txt 为MIT；lockfile固定版本/完整性 | 实际本地加载，用于保存报价台账、筛选排序重开和CSV；不使用Enterprise |
| ag-stack36.2.0 / ag-charts-types14.2.0 | lockfile及随包许可MIT | AG Grid传递依赖，不使用付费图表 |
| [Qwen3-8B LICENSE](https://huggingface.co/Qwen/Qwen3-8B/blob/main/LICENSE) | Apache-2.0，官方模型页核验 | 测试复用既有本地GGUF，不随项目分发、不下载新权重；量化文件来源由共享资产维护 |

新增：服务端固定价格与预算边界、不可变可审核报价、明确批准后的sandbox闭环、幂等与持久记录、区分演练/真实AI、真实报价台账。AG Grid配置已实用接入；是否获赞助奖由评委决定。Render仅有未部署配置，不声称满足实际使用。

## 难度与投入判断（主观估计）

整体评审门槛高：付款+AI中央链路、完整产品及可信实际演示都要成立。赞助奖多于Twitch5个总名额，但并不意味着低竞争或高中奖率。登记人数不是提交数；没有可靠中奖概率。

预计用户操作25–50分钟（已有PayPal开发者/买家sandbox和视频账号情况下），重点为授权、实际sandbox测试、演示审核/公开上传及投稿；新账户/地区验证可能更久。Node应用无GPU要求；真实测试复用约5.225GB Qwen3-8B量化模型和RTX4060。早期3次推理约2.5–5.6秒；最终策略重测在较低GPU卸载设置下为48.562/3.414/2.489秒，首例含慢冷启动，不能外推性能。云AI可替代本地模型；无需训练。Docker/Render只是准备，付费starter磁盘方案尚未执行。
