# 首页底部板块 CMS 配置 + PWA 图标配置

## 一、Supabase 里配置「为什么构建济和 DAO」等四大板块

### 1. 打开 Supabase 和 cms_config 表

1. 登录 [Supabase](https://supabase.com) → 进入你的项目。
2. 左侧点 **Table Editor**。
3. 选中表 **`cms_config`**（若没有，需先执行项目里的 `supabase/schema.sql` 建表）。

### 2. 表结构说明

`cms_config` 一般有两列：

- **key**（文本）：配置项名称，例如 `bottom_one_title`。
- **value**（**jsonb**）：该配置的值。Supabase 若将 value 设为 **jsonb**，则必须填**合法 JSON**：
  - **纯文字**：必须用双引号包成 JSON 字符串，例如 `"为什么构建「济和 DAO」?"`（不能只填 `为什么构建「济和 DAO」?`，否则会报 Value is invalid JSON）。
  - **列表**（`*_items`）：填 JSON 数组字符串，例如 `[{"name":"...","desc":"..."}]`。

### 3. 要添加的 key 与 value 示例

在 Table Editor 里点 **Insert row**，一行一行加。下面每一行都是一条记录：**key** 填左侧，**value** 填右侧（整段复制进 value 列）。

---

**第一块（为什么构建济和 DAO）**  
（value 为 jsonb 时，纯文字必须用双引号包成 JSON 字符串）

| key | value（整段复制到 value 列） |
|-----|--------|
| `bottom_one_title` | `"为什么构建「济和 DAO」？"` |
| `bottom_one_body` | `"在传统体系下，个体的卓越被标准化考试抹杀，信用被中心化机构剥夺。我们构建济和 DAO，是为了让超级个体拿回评价权与数字主权，在数字荒原中建立一个基于自由意志的自治区。"` |

---

**第二块（济和 DAO 的核心组件）**

| key | value（整段复制到 value 列） |
|-----|--------|
| `bottom_two_title` | `"济和 DAO 的核心组件"` |
| `bottom_two_items` | 见下方 JSON（整段复制，不要加外层引号） |

`bottom_two_items` 的 value（**必须为合法 JSON 字符串**）：

```json
[{"name":"技能存证 (SBT)","desc":"不可篡改的「灵魂护照」，记录你真实的成长轨迹。"},{"name":"主权社交 (Farcaster)","desc":"去中心化协议，确保你的社交资产不被任何平台封禁。"},{"name":"济和币 (Jihe Coin)","desc":"峡谷内的价值血液，衡量贡献、交换资源、参与治理。"}]
```

---

**第三块（它是如何运作的？）**

| key | value（整段复制到 value 列） |
|-----|--------|
| `bottom_three_title` | `"它是如何运作的？我们怎么使用它？"` |
| `bottom_three_items` | 见下方 JSON（整段复制，不要加外层引号） |

`bottom_three_items` 的 value：

```json
[{"name":"身份激活","desc":"通过 Farcaster 或邮箱登录，你即刻签署了峡谷协议，获得唯一的数字身份。"},{"name":"技能沉淀","desc":"当你在现实或数字世界完成一次创造或探索，系统会为你发放对应的 SBT，这些资产永久锁定在你的钱包中，成为你真实的信用资产。"},{"name":"价值流转","desc":"通过参与协作与贡献，你将获得济和币。你可以用它在峡谷内兑换 LUMI 能量补给、营地资源，与其他超级个体交换，或者支持其他超级个体的项目。"},{"name":"自主协作","desc":"利用 DAO 提供的协议工具，你可以发起自己的实验，寻找志同道合的超级个体，实现高效的去中心化协作。"}]
```

---

**第四块（落地实体：德阳济和营地）**

| key | value（整段复制到 value 列） |
|-----|--------|
| `bottom_four_title` | `"落地实体：德阳济和营地"` |
| `bottom_four_lead` | `"「峡谷」在云端，根在德阳。"` |
| `bottom_four_items` | 见下方 JSON（整段复制，不要加外层引号） |

`bottom_four_items` 的 value：

```json
[{"name":"集合营地","desc":"济和 DAO 的物理实验场。我们在这里进行童军训练与野外造作。"},{"name":"能量补给","desc":"由 LUMI 德阳本地牧场提供最纯粹的能量支撑。"},{"name":"核心理念","desc":"「学习只是成长的副产品」。在德阳的土地上造作，在数字的峡谷中永存。"}]
```

### 4. 操作步骤小结

1. Table Editor → 选表 **cms_config**。
2. 点 **Insert row**。
3. **key** 列填上表中的 key（如 `bottom_one_title`）。
4. **value** 列填上表中对应的 value；若是 JSON，整段粘贴为一行，不要换行。
5. 保存后，再插入下一行，直到 10 个 key 都加完（或只加你想改的那几个）。
6. 未在 `cms_config` 里配置的 key，首页会使用代码里的默认文案。

### 5. 修改已有配置

- 在 **cms_config** 里找到对应 **key** 的那一行，直接改 **value** 列，保存即可。
- 首页会从 Supabase 读这些 key，所以改完刷新网站就能看到新内容（无需重新部署，除非有缓存）。

---

## 二、PWA「设为桌面图标」：在 public 放两个图标文件

### 1. 需要哪两个文件

项目已配置 `public/manifest.json`，里面引用了：

- **`/icon-192.png`** → 对应文件路径：**`public/icon-192.png`**
- **`/icon-512.png`** → 对应文件路径：**`public/icon-512.png`**

即：在项目根目录下的 **`public`** 文件夹里，放这两个文件名**一字不差**的 PNG 图片。

### 2. 图片规格

- **icon-192.png**：宽高均为 **192 像素**（192×192）。
- **icon-512.png**：宽高均为 **512 像素**（512×512）。
- 格式：**PNG**，建议带透明通道；内容尽量简洁（Logo 或首字母），避免小图看不清。

### 3. 制作 / 导出步骤（任选一种方式）

**方式 A：用设计软件（Figma / PS 等）**

1. 新建 512×512 画布，设计图标（如「济和」Logo）。
2. 导出为 PNG，命名为 `icon-512.png`，保存到项目的 **`public`** 目录。
3. 再导出一份 192×192 的 PNG，命名为 `icon-192.png`，同样保存到 **`public`**。

**方式 B：用在线工具**

1. 打开 [realfavicongenerator.net](https://realfavicongenerator.net/) 或 [favicon.io](https://favicon.io/)。
2. 上传一张正方形图（建议至少 512×512），生成多种尺寸。
3. 下载包后，从中找到 192×192 和 512×512 的 PNG，分别改名为 `icon-192.png`、`icon-512.png`，复制到项目 **`public`** 目录。

**方式 C：用命令行（ImageMagick）**

若已安装 ImageMagick，在项目根目录执行（将 `你的图标.png` 换成你的源图路径）：

```bash
# 生成 512
convert 你的图标.png -resize 512x512 public/icon-512.png
# 生成 192
convert 你的图标.png -resize 192x192 public/icon-192.png
```

### 4. 放置位置检查

最终目录结构应为：

```
你的项目/
  public/
    manifest.json     （已有）
    icon-192.png     （你新放）
    icon-512.png     （你新放）
```

### 5. 验证「添加到主屏幕」

1. 重新部署或本地 `npm run build` + `npm run start`。
2. 用手机浏览器打开你的站点（如 https://www.jihedao.xyz）。
3. 在浏览器菜单里选「**添加到主屏幕**」或「**安装应用**」。
4. 确认主屏幕上的图标是你刚放的 `icon-192.png` / `icon-512.png`；若未放这两个文件，会显示浏览器默认图标。

---

## 三、总结

- **底部四大板块可后台修改**：在 Supabase 表 **cms_config** 里按上面表格添加或修改 **key** 和 **value**（items 为 JSON 字符串）。
- **PWA 桌面图标**：在 **`public/`** 下放置 **`icon-192.png`**（192×192）和 **`icon-512.png`**（512×512），即可在「添加到主屏幕」时使用自定义图标。
