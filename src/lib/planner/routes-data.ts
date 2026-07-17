import type { CountryBrief, PathNode } from "./types";

/**
 * 深度路线节点库 — 首批两条：马来西亚国际教育、华侨生联考
 *
 * 「已验证」= 运营者按信源人工核实过框架；具体数字（存款门槛、当年报名细则、
 * 学费）随政策变动，volatile 节点额外标 needsHumanCheck，进入报告末尾的
 * 「需人工核实与定制」清单。
 *
 * ⚠️ 人工签发闸门：新增或修改节点后，须运营者对照 sources 原文复核并更新
 * verifiedAt 日期，再上线。
 */

const V_DATE = "2026-07-17";

export const nodes: Record<string, PathNode> = {
  /* ---------------- 马来西亚国际教育路线 ---------------- */

  "my-research": {
    id: "my-research",
    title: "前期调研与实地考察",
    summary:
      "确定城市（吉隆坡 / 新山 / 槟城）与课程体系（IGCSE、A-Level、IB、AP、澳洲课程）。新山、槟城成本约为吉隆坡的一半到三分之二；吉隆坡头部学校学术资源最强。",
    prerequisites: ["家庭就长期方向达成基本共识"],
    checklist: [
      "列出 5-8 所候选学校，核对课程体系与学额",
      "预约学校开放日或线上说明会",
      "实地考察 1-2 次（建议覆盖上课日）",
      "了解目标城市的住房、通勤与生活配套",
    ],
    durationMonths: [1, 6],
    costWan: [1, 3],
    risk: "仅凭中介宣传或网络信息决策，落地后发现学校与预期不符，转校成本高。",
    exits: ["不满意可直接终止，仅损失考察成本", "转向其他国家调研"],
    verified: true,
    sources: [
      {
        name: "马来西亚教育部私立教育司（国际学校名录）",
        url: "https://www.moe.gov.my",
        verifiedAt: V_DATE,
      },
    ],
  },

  "my-school-apply": {
    id: "my-school-apply",
    title: "择校申请与入学测试",
    summary:
      "国际学校全年滚动招生为主，需通过英语和数学入学测试（部分学校加面试）。英语基础弱的孩子可先读学校附设的英语强化班（EAL）。",
    prerequisites: ["完成调研并锁定 2-3 所目标学校", "孩子英语达到目标学校入学测试线（或接受 EAL 过渡）"],
    checklist: [
      "准备近两年成绩单（公证翻译）",
      "护照办理（全家）",
      "预约并参加入学测试",
      "缴纳注册费锁定学位",
      "英语弱基础：提前 6-12 个月启动英语强化",
    ],
    durationMonths: [2, 6],
    costWan: [1, 3],
    risk: "热门学校学位紧张，测试不通过需降级择校或延后半年。",
    exits: ["换学校重考", "先入读 EAL 过渡班", "延后一个学期入学"],
    verified: true,
    needsHumanCheck: true,
    sources: [
      {
        name: "各目标学校官网招生页（学位与测试要求随年份变动）",
        url: "https://www.moe.gov.my",
        verifiedAt: V_DATE,
      },
    ],
  },

  "my-visa": {
    id: "my-visa",
    title: "学生签证与陪读安排",
    summary:
      "学生签证（Student Pass）由学校通过 EMGS 系统代办；18 岁以下学生的母亲或法定监护人可申请陪读签（Guardian Pass）。陪读签不允许在当地受雇工作——家庭收入必须来自国内或远程。",
    prerequisites: ["取得学校录取信", "全家护照有效期 18 个月以上"],
    checklist: [
      "学校出具录取信后提交 EMGS 签证申请",
      "体检（指定机构）",
      "陪读方准备出生证明/亲属关系公证",
      "确认家庭收入来源可远程维持（陪读签禁止当地就业）",
    ],
    durationMonths: [1, 3],
    costWan: [0.5, 1.5],
    risk: "材料瑕疵导致拒签或拖延；陪读签政策各州执行细节有差异。",
    isDeathNode: true,
    deathReason:
      "陪读一方在当地非法工作被查，签证取消并留下记录，孩子学业中断，整条路线报废。收入来源规划是这条路线的生命线。",
    exits: ["改为寄宿学校（孩子单独就读，家长不陪读）", "更换学校重新申请"],
    verified: true,
    needsHumanCheck: true,
    sources: [
      {
        name: "EMGS（马来西亚国际学生服务中心）官方指南",
        url: "https://educationmalaysia.gov.my",
        verifiedAt: V_DATE,
      },
    ],
  },

  "my-settle": {
    id: "my-settle",
    title: "落地安置",
    summary: "租房、开立银行账户、购买医疗保险、孩子入学报到。首月是家庭适应期的关键窗口。",
    prerequisites: ["签证获批"],
    checklist: [
      "学区租房（国际学校周边公寓约 2500-6000 马币/月）",
      "凭学生签开立本地银行账户",
      "全家医疗保险",
      "孩子入学报到与分班测试",
    ],
    durationMonths: [1, 2],
    costWan: [3, 8],
    risk: "孩子初期不适应全英文环境，出现厌学情绪。",
    exits: ["EAL 强化班过渡", "极端不适应可期末退学回国，损失一学期"],
    verified: true,
    sources: [
      {
        name: "EMGS 生活指南",
        url: "https://educationmalaysia.gov.my",
        verifiedAt: V_DATE,
      },
    ],
  },

  "my-igcse": {
    id: "my-igcse",
    title: "国际课程中学阶段（IGCSE）",
    summary:
      "英式体系核心阶段，10 年级末统考。学费区间大：新山/槟城约 3-8 万/年，吉隆坡中档 8-15 万/年，头部 15-25 万/年；生活费另计 8-15 万/年。",
    prerequisites: ["已入学并通过适应期"],
    checklist: [
      "选课（通常 6-9 门，中文可作为一门科目）",
      "维持英语学术能力提升（目标：全科英文授课无障碍）",
      "保留国内学籍者：确认学籍保留政策与年限",
      "每年评估一次是否切换路线（分岔口检查点）",
    ],
    durationMonths: [24, 48],
    costWan: [30, 120],
    risk: "成绩平庸导致 A-Level 选课受限，升学面变窄。",
    forkLabel: "IGCSE 结束是最大分岔口：A-Level 冲海外本科 / 转向华侨生联考备考 / 回国衔接",
    exits: ["转回国内国际学校", "转向联考路线（若身份与居住时间已满足）"],
    verified: true,
    sources: [
      {
        name: "Cambridge International（IGCSE 课程与考试）",
        url: "https://www.cambridgeinternational.org",
        verifiedAt: V_DATE,
      },
    ],
  },

  "my-alevel": {
    id: "my-alevel",
    title: "A-Level / IB 高中阶段",
    summary:
      "两年制大学预科，成绩直接决定本科申请档次。马来西亚 A-Level 成绩全球通用，可申请英、澳、新、港及马来西亚本地大学。",
    prerequisites: ["IGCSE 成绩达到选课要求（通常核心科 B 以上）"],
    checklist: [
      "按目标专业选 3-4 门 A-Level 科目",
      "雅思/托福备考（目标本科通常要求雅思 6.0-7.0）",
      "课外活动与竞赛履历（冲名校必备）",
      "本科申请季：UCAS（英）/ 各校直申（澳新港）",
    ],
    durationMonths: [20, 26],
    costWan: [25, 70],
    risk: "A-Level 成绩不理想，与目标院校差距拉大。",
    forkLabel: "毕业分岔：英澳新港本科 / 马来西亚本地私立大学（成本低一半以上） / 回国就业",
    exits: ["马来西亚本地大学（学费约 3-6 万/年）", "重考一年", "转申排名要求较低的院校"],
    verified: true,
    sources: [
      {
        name: "UCAS（英国本科申请）",
        url: "https://www.ucas.com",
        verifiedAt: V_DATE,
      },
    ],
  },

  "overseas-uni": {
    id: "overseas-uni",
    title: "海外本科与就业衔接",
    summary:
      "英澳新港本科 3-4 年，毕业后各地均有毕业生工作签证通道（时长与条件各异）。这一段花费最高，也是「上限」所在。",
    prerequisites: ["A-Level/IB 成绩 + 语言成绩达标", "本科阶段资金证明"],
    checklist: [
      "本科申请与签证",
      "每年 30-60 万预算（英美高、马来西亚分校低）",
      "实习与就业规划从大二开始",
      "毕业工签政策提前一年确认",
    ],
    durationMonths: [36, 48],
    costWan: [90, 240],
    risk: "就业市场波动，毕业工签政策收紧。",
    exits: ["回国就业（海外学历）", "马来西亚/新加坡就业", "继续深造硕士"],
    verified: false,
    needsHumanCheck: true,
    sources: [{ name: "各国官方签证与院校信息（未逐一人工核实）", url: "https://www.ucas.com" }],
  },

  /* ---------------- 华侨生联考路线 ---------------- */

  "hq-status": {
    id: "hq-status",
    title: "取得海外长期居留身份",
    summary:
      "联考资格的第一道硬条件：考生本人及父母一方须持有住在国长期/永久居留权，或合法居留资格（对应两种资格通道，居住时长要求不同）。马来西亚常用通道为 MM2H（第二家园计划），2024 年新政分档设定存款门槛，且各档条件差异大。",
    prerequisites: ["家庭资金满足所选身份通道的门槛", "确认身份类型属于联招办认可的「长期或永久居留」口径"],
    checklist: [
      "确认当年 MM2H（或其他身份通道）的存款/收入门槛与年龄要求",
      "备齐资产证明、无犯罪记录公证等材料",
      "身份获批后确认孩子与至少一方家长同持身份",
      "留存所有出入境记录（后续核算居住时间的依据）",
    ],
    durationMonths: [6, 12],
    costWan: [5, 15],
    risk: "身份类型与联招办认可口径不符，或政策中途调整门槛。",
    isDeathNode: true,
    deathReason:
      "身份口径不被联招办认可（例如仅持普通签证而非长期居留资格），多年居住时间全部白费，联考资格直接作废。办理前必须以联招办当年简章逐字核对。",
    exits: ["改走纯国际教育路线（A-Level 升学，不依赖身份）", "更换身份通道"],
    verified: true,
    needsHumanCheck: true,
    sources: [
      {
        name: "马来西亚移民局 MM2H 官方页面（2024 新政门槛以官方最新公布为准）",
        url: "https://www.imi.gov.my",
        verifiedAt: V_DATE,
      },
      {
        name: "内地普通高校联合招收华侨港澳台学生办公室（资格认定口径）",
        url: "https://www.gatzs.com.cn",
        verifiedAt: V_DATE,
      },
    ],
  },

  "hq-residence": {
    id: "hq-residence",
    title: "居住时间累计（资格生命线）",
    summary:
      "现行报名条件（2019 年起执行，以当年简章为准）：持长期/永久居留权者，须在考前连续 2 个自然年内实际累计居留不少于 18 个月；持合法居留资格者，须考前 5 年内累计居留不少于 30 个月。居住时间按出入境记录逐日核算。",
    prerequisites: ["身份已获批", "孩子在住在国实际就读与生活"],
    checklist: [
      "建立全家出入境记录台账（逐次登记）",
      "每半年核算一次累计居住天数，对照资格线",
      "寒暑假回国时间提前纳入核算（最容易失手的地方）",
      "高三报名年前，按联招办口径做一次完整预审",
    ],
    durationMonths: [18, 30],
    costWan: [0, 0],
    risk: "回国过久导致居住天数不足。",
    isDeathNode: true,
    deathReason:
      "考前核算发现累计居住差几十天，资格作废且无法补救——这是整条联考路线最著名的死亡节点。所有回国安排都要给居住天数留出安全余量。",
    exits: ["降级走 A-Level 申请海外/马来西亚本地大学", "推迟一年参考（若年龄允许）"],
    verified: true,
    sources: [
      {
        name: "普通高等学校联合招收华侨港澳台学生简章（每年更新）",
        url: "https://www.gatzs.com.cn",
        verifiedAt: V_DATE,
      },
    ],
  },

  "hq-exam-prep": {
    id: "hq-exam-prep",
    title: "联考备考（考纲与高考差异化训练）",
    summary:
      "联考五科（文/理），总分 750。考纲范围窄于高考、题目难度低于高考，但在国际课程体系里读书的孩子需要专门切回中文应试训练，通常需要 12-18 个月系统备考。",
    prerequisites: ["居住时间预审通过", "确定文理方向"],
    checklist: [
      "选定联考培训机构或自学方案（马来西亚本地有面向联考的中文培训）",
      "12-18 个月刷考纲真题",
      "每季度一次模考定位",
      "同步保底：保留 A-Level 成绩作为备选出口",
    ],
    durationMonths: [12, 18],
    costWan: [5, 15],
    risk: "国际课程与中文应试双线作战，孩子精力分配失衡，两头落空。",
    exits: ["放弃联考，专注 A-Level 升学", "降低目标院校档位"],
    verified: true,
    sources: [
      {
        name: "联招考试大纲（联招办发布）",
        url: "https://www.gatzs.com.cn",
        verifiedAt: V_DATE,
      },
    ],
  },

  "hq-exam": {
    id: "hq-exam",
    title: "联考报名、考试与录取",
    summary:
      "每年 3 月报名（资格审核）、5 月考试、7 月录取。近年录取线大幅低于同校高考线，但报考人数逐年上升，分数红利在收窄。报名资格审核是最后一道闸门。",
    prerequisites: ["居住时间达标且材料完整", "身份文件在有效期内"],
    checklist: [
      "3 月网上报名 + 现场/线上资格确认",
      "备齐：身份证明、居留证明、出入境记录、学历证明",
      "5 月赴考（内地设考点）",
      "7 月志愿填报与录取",
    ],
    durationMonths: [5, 6],
    costWan: [1, 3],
    risk: "资格审核材料瑕疵被拒；当年政策收紧。",
    isDeathNode: true,
    deathReason: "报名资格审核不通过 = 多年投入在最后一刻归零。前置的每半年预审就是为了让这个节点零意外。",
    forkLabel: "录取分岔：内地大学就读 / 未达线转 A-Level 成绩申请海外或马来西亚本地大学",
    exits: ["A-Level 成绩申请海外本科（双轨保底的意义所在）", "复读一年再考"],
    verified: true,
    needsHumanCheck: true,
    sources: [
      {
        name: "联招报名系统与当年简章",
        url: "https://www.gatzs.com.cn",
        verifiedAt: V_DATE,
      },
    ],
  },

  "cn-university": {
    id: "cn-university",
    title: "内地大学就读与后续发展",
    summary:
      "以联考身份入读内地高校，学费与统招生相同。毕业时既有内地学历和人脉，又有海外成长经历和英语能力，双向选择空间大。",
    prerequisites: ["联考录取"],
    checklist: ["入学报到", "保持英语能力（这是相对同龄人的差异化资产）", "毕业方向：国内就业 / 海外深造均可"],
    durationMonths: [48, 48],
    costWan: [10, 25],
    risk: "无重大政策风险。",
    exits: ["毕业后海外读研（英语与经历是现成跳板）"],
    verified: true,
    sources: [
      {
        name: "教育部涉外监管信息网",
        url: "https://www.crs.jsj.edu.cn",
        verifiedAt: V_DATE,
      },
    ],
  },

  /* ---------------- 共用准备节点 ---------------- */

  "prep-language": {
    id: "prep-language",
    title: "语言与学术准备（在国内完成）",
    summary:
      "出发前把英语基础打到能通过国际学校入学测试的水平，是整个规划里性价比最高的投入——直接决定落地后是正常入学还是先读半年到一年语言班。",
    prerequisites: ["无"],
    checklist: [
      "英语水平测评（CEFR 定位）",
      "6-12 个月系统提升（听说优先）",
      "数学保持国内进度（国际学校数学入学测试对中国孩子是送分项）",
      "孩子心理建设：参加一次海外短期营体验",
    ],
    durationMonths: [6, 12],
    costWan: [2, 6],
    risk: "无不可逆风险，最坏情况是多读一段语言班。",
    exits: ["随时可停，投入的英语能力不会浪费"],
    verified: true,
    sources: [{ name: "CEFR 语言能力框架", url: "https://www.coe.int/en/web/common-european-framework-reference-languages", verifiedAt: V_DATE }],
  },

  "prep-trial": {
    id: "prep-trial",
    title: "低成本验证（短期营 + 插班体验）",
    summary:
      "在做全家迁移决定之前，用寒暑假短期营或 1-3 个月插班体验验证孩子的适应性。这是「随时可退」的关键设计——用几万块的成本换全家几十万决策的确定性。",
    prerequisites: ["孩子有基本英语听说能力"],
    checklist: [
      "选一所候选学校的假期营或插班项目（旅游签即可）",
      "观察维度：课堂参与度、社交、情绪、饮食起居",
      "家长同期考察住房与生活成本",
      "回国后全家复盘，再决定是否进入申请节点",
    ],
    durationMonths: [1, 3],
    costWan: [2, 5],
    risk: "无不可逆风险。",
    forkLabel: "验证分岔：适应良好 → 正式申请；不适应 → 留在国内继续准备或换方向",
    exits: ["完全可退，仅损失体验成本"],
    verified: true,
    sources: [{ name: "各校假期项目页面", url: "https://educationmalaysia.gov.my", verifiedAt: V_DATE }],
  },
};

/* ---------------- 其他国家：AI 整理概要（未人工核实） ---------------- */

export const countryBriefs: CountryBrief[] = [
  {
    name: "新加坡",
    positioning: "教育质量天花板，成本也是天花板；AEIS 入学考试竞争激烈。",
    suitableFor: "预算每年 40 万以上、孩子学术能力强的家庭",
    costLevel: "每年 40-70 万",
    mainUncertainty: "政府学校入学名额收紧，国际学校学位紧张",
    verified: false,
  },
  {
    name: "泰国",
    positioning: "清迈/曼谷国际学校性价比高，陪读政策宽松，中文社区成熟。",
    suitableFor: "预算有限、想先低成本验证国际教育的家庭",
    costLevel: "每年 10-25 万",
    mainUncertainty: "长期身份通道不如马来西亚清晰，升学出口偏窄",
    verified: false,
  },
  {
    name: "日本",
    positioning: "经营管理签证+公立教育几乎免费，文化适应门槛低。",
    suitableFor: "父母有真实经营能力或远程业务的家庭",
    costLevel: "身份维持每年 15-30 万（含经营成本）",
    mainUncertainty: "经营签续签依赖真实经营状况，语言体系切换成本高",
    verified: false,
  },
  {
    name: "香港",
    positioning: "高才/优才通道与 DSE 考试，离家最近的「联考替代方案」。",
    suitableFor: "父母学历职业背景强、想保持内地事业的家庭",
    costLevel: "每年 25-50 万",
    mainUncertainty: "身份续签与「通常性居住」认定，DSE 竞争在加剧",
    verified: false,
  },
  {
    name: "加拿大",
    positioning: "公立教育免费+完整的学习-工作-长期居留链条，孩子上限高。",
    suitableFor: "考虑全家长期发展、预算充足的家庭",
    costLevel: "每年 25-45 万",
    mainUncertainty: "近两年学签配额收紧，政策波动大",
    verified: false,
  },
  {
    name: "迪拜（阿联酋）",
    positioning: "零个税+国际学校密度高，英式教育为主，适合远程收入家庭。",
    suitableFor: "有跨境业务或远程收入、看重税务环境的家庭",
    costLevel: "每年 25-50 万",
    mainUncertainty: "无长期永居概念，身份始终依附签证",
    verified: false,
  },
];

/** 未核实资料的统一免责说明 */
export const UNVERIFIED_NOTE =
  "以上国家概要由 AI 整理公开资料生成，未经人工核实，只提供方向参考，不含执行细节。如需针对具体国家的可执行路线，请预约人工诊断。";
