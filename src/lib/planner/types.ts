/**
 * 家庭全球发展路径规划器 — 类型定义
 *
 * 设计原则（见产品需求）：
 * - 资格判断由确定性规则完成（engine.ts），可解释、可复核
 * - 路径是节点图：每个节点带前置条件、准备清单、耗时、费用、风险、备选出口
 * - 信息分级：verified（人工核实）/ unverified（AI 整理，只给方向）
 * - 每条规则可溯源到官方原文和核实日期
 */

/** 家庭画像（由录入表单答案解析而来） */
export type FamilyProfile = {
  childAge: number;
  childGrade: string;
  childEnglish: "zero" | "basic" | "medium" | "strong";
  childTraits: string[];
  parentEducation: string;
  parentJob: string;
  /** 每年可投入预算区间（万元人民币） */
  annualBudgetWan: [number, number];
  /** 家庭目标 */
  goal: "hqlk" | "overseas" | "backup" | "unsure";
  /** 价值观偏好 */
  preference: "stable" | "value" | "ceiling";
  riskTolerance: "low" | "mid" | "high";
  /** 是否必须保留回国升学选项 */
  keepReturnOption: boolean;
  /** 家庭地理灵活性 */
  geoFlexibility: "family" | "oneParent" | "childOnly" | "remoteOnly";
};

/** 信源引用：每条规则可溯源 */
export type SourceRef = {
  name: string;
  url: string;
  /** 运营者人工核实日期（YYYY-MM-DD）；未核实则为空 */
  verifiedAt?: string;
};

/** 路径节点 */
export type PathNode = {
  id: string;
  title: string;
  summary: string;
  /** 前置条件（硬条件，规则引擎校验的对象） */
  prerequisites: string[];
  /** 准备清单：学什么、考什么、备什么材料 */
  checklist: string[];
  /** 耗时区间（月） */
  durationMonths: [number, number];
  /** 费用区间（万元人民币），一次性 + 阶段内总计 */
  costWan: [number, number];
  /** 失败风险描述 */
  risk: string;
  /** 死亡节点：单点失败导致全盘报废 */
  isDeathNode?: boolean;
  deathReason?: string;
  /** 备选出口：此节点失败/放弃时还能去哪 */
  exits: string[];
  /** 分岔口：此节点之后的路线选择 */
  forkLabel?: string;
  /** 是否经人工核实 */
  verified: boolean;
  sources?: SourceRef[];
  /** 政策易变节点：报告末尾列入「需人工核实与定制」清单 */
  needsHumanCheck?: boolean;
};

export type PlanKey = "stable" | "balanced" | "ambitious";

/** 方案中的一步：节点 + 时间安排 + 个性化批注 */
export type PlanStep = {
  nodeId: string;
  /** 从今年起算第 N 年开始（0 = 今年） */
  startYear: number;
  childAgeAtStart: number;
  /** 引擎针对该家庭生成的个性化说明 */
  note?: string;
};

export type Plan = {
  key: PlanKey;
  title: string;
  tagline: string;
  /** 全程总投入区间（万元） */
  totalCostWan: [number, number];
  /** 全程年数 */
  totalYears: number;
  steps: PlanStep[];
  /** 代价：选这条路要放弃什么 */
  tradeoff: string;
  /** 赌点：这条路赌的是什么 */
  bet: string;
  /** 退出机制概述 */
  exitSummary: string;
  /** 规则引擎的资格/预算/时间窗校验警告（可解释、可复核） */
  fitWarnings: string[];
  verifiedLevel: "verified" | "partial" | "unverified";
};

/** 未人工核实的国家概要：只给方向，不给执行细节 */
export type CountryBrief = {
  name: string;
  positioning: string;
  suitableFor: string;
  costLevel: string;
  mainUncertainty: string;
  verified: false;
};

/** 最终报告 */
export type PlannerReport = {
  version: 1;
  createdAt: string;
  profileSummary: string;
  plans: Plan[];
  otherCountries: CountryBrief[];
  /** 需人工核实与定制的节点（诊断转化入口） */
  diagnosisNodes: string[];
  /** AI 叙事（只基于系统提供的资料表达，可缺省） */
  narrative?: string;
  disclaimer: string;
};
