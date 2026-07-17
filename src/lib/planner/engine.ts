import { nodes } from "./routes-data";
import type {
  FamilyProfile,
  Plan,
  PlanKey,
  PlannerReport,
  PlanStep,
} from "./types";
import { countryBriefs } from "./routes-data";

/**
 * 确定性规则引擎：资格判断与三方案生成
 *
 * 所有硬条件判断（年龄窗口、预算、地理灵活性）在此完成，规则可解释、
 * 可复核；AI 不参与任何资格判断，只负责后续叙事表达。
 */

export const DISCLAIMER =
  "本报告由规则引擎根据您提供的信息生成，政策类信息标注了信源与核实日期，仍可能随官方调整而变化；标注「未人工核实」的内容仅供方向参考。本报告不构成任何形式的法律或财务意见，重大决策前请预约人工诊断逐项核实。";

/* ---------------- 表单答案 → 家庭画像 ---------------- */

const ENGLISH_MAP: Record<string, FamilyProfile["childEnglish"]> = {
  "零基础或很弱": "zero",
  "有基础，日常简单交流": "basic",
  "中等，能听懂部分英文课程": "medium",
  "较强，接近或达到全英文上课水平": "strong",
};

const BUDGET_MAP: Record<string, [number, number]> = {
  "10万以下": [5, 10],
  "10-20万": [10, 20],
  "20-40万": [20, 40],
  "40万以上": [40, 80],
};

const GOAL_MAP: Record<string, FamilyProfile["goal"]> = {
  "华侨生联考，回国读好大学": "hqlk",
  "海外读本科并就业": "overseas",
  "给家庭留一个海外发展的备份方案": "backup",
  "还没想清楚，想看方案对比": "unsure",
};

const PREF_MAP: Record<string, FamilyProfile["preference"]> = {
  "求稳：政策确定性优先，随时能退": "stable",
  "性价比：每一分预算都要花在刀刃上": "value",
  "上限优先：孩子的发展天花板最重要": "ceiling",
};

const RISK_MAP: Record<string, FamilyProfile["riskTolerance"]> = {
  "很低，不能接受路线中途作废": "low",
  "中等，可以接受有备选出口的风险": "mid",
  "较高，愿意为更高上限承担不确定性": "high",
};

const GEO_MAP: Record<string, FamilyProfile["geoFlexibility"]> = {
  "全家可以搬过去": "family",
  "一方家长可以长期陪读": "oneParent",
  "孩子可以单独就读寄宿学校": "childOnly",
  "近几年全家都走不开": "remoteOnly",
};

export function parseProfile(answers: Record<string, string>): FamilyProfile {
  const age = Number.parseInt(answers.child_age ?? "", 10);
  return {
    childAge: Number.isFinite(age) ? Math.min(Math.max(age, 1), 18) : 10,
    childGrade: answers.child_grade ?? "",
    childEnglish: ENGLISH_MAP[answers.child_english ?? ""] ?? "basic",
    childTraits: (answers.child_traits ?? "").split(/、|,/).filter(Boolean),
    parentEducation: answers.parent_education ?? "",
    parentJob: answers.parent_job ?? "",
    annualBudgetWan: BUDGET_MAP[answers.budget ?? ""] ?? [10, 20],
    goal: GOAL_MAP[answers.goal ?? ""] ?? "unsure",
    preference: PREF_MAP[answers.preference ?? ""] ?? "stable",
    riskTolerance: RISK_MAP[answers.risk ?? ""] ?? "mid",
    keepReturnOption: (answers.keep_return ?? "").startsWith("是"),
    geoFlexibility: GEO_MAP[answers.geo ?? ""] ?? "oneParent",
  };
}

/* ---------------- 硬条件规则（可解释、可复核） ---------------- */

/** 联考时间窗：办身份约1年 + 考前2年内实际居住满18个月 + 高三应考（约18岁） */
export function hqlkWindow(childAge: number): "open" | "tight" | "closed" {
  const yearsToExam = 18 - childAge;
  if (yearsToExam >= 5) return "open";
  if (yearsToExam >= 4) return "tight";
  return "closed";
}

function budgetWarning(profile: FamilyProfile, planLowPerYear: number, planName: string): string | null {
  const [, budgetHigh] = profile.annualBudgetWan;
  if (budgetHigh < planLowPerYear) {
    return `预算校验：${planName}每年最低约需 ${planLowPerYear} 万，超出您填写的预算上限（${budgetHigh} 万/年），存在资金缺口，建议下调城市/学校档位或推迟启动。`;
  }
  return null;
}

function geoWarnings(profile: FamilyProfile): string[] {
  const w: string[] = [];
  if (profile.geoFlexibility === "remoteOnly") {
    w.push(
      "地理校验：您选择了「近几年全家都走不开」——陪读方案不可行，路线只能以寄宿学校为前提（12 岁以下不建议），或把启动时间整体后移。"
    );
  }
  if (profile.geoFlexibility === "childOnly" && profile.childAge < 12) {
    w.push("地理校验：孩子未满 12 岁，单独寄宿风险高，多数顾问不建议；建议至少初期安排一方陪读。");
  }
  return w;
}

/* ---------------- 方案构建 ---------------- */

function schedule(nodeIds: string[], profile: FamilyProfile, notes: Record<string, string>): PlanStep[] {
  let cursorMonths = 0;
  return nodeIds.map((id) => {
    const node = nodes[id];
    const startYear = Math.floor(cursorMonths / 12);
    const step: PlanStep = {
      nodeId: id,
      startYear,
      childAgeAtStart: profile.childAge + startYear,
      ...(notes[id] ? { note: notes[id] } : {}),
    };
    const [lo, hi] = node.durationMonths;
    cursorMonths += Math.round((lo + hi) / 2);
    return step;
  });
}

function sumCost(nodeIds: string[]): [number, number] {
  const [lo, hi] = nodeIds.reduce<[number, number]>(
    (acc, id) => [acc[0] + nodes[id].costWan[0], acc[1] + nodes[id].costWan[1]],
    [0, 0]
  );
  return [Math.round(lo), Math.round(hi)];
}

function totalYears(steps: PlanStep[], lastNodeId: string): number {
  const last = steps[steps.length - 1];
  const [lo, hi] = nodes[lastNodeId].durationMonths;
  return last.startYear + Math.max(1, Math.round((lo + hi) / 2 / 12));
}

function buildStablePlan(profile: FamilyProfile): Plan {
  const langNote =
    profile.childEnglish === "strong"
      ? "孩子英语已接近全英文上课水平，此节点可压缩到 3 个月内，直接做入学测试摸底。"
      : profile.childEnglish === "zero"
        ? "孩子目前英语较弱，这一步是全计划的地基，建议给足 12 个月。"
        : "按孩子现状预留 6-12 个月系统提升。";

  const ids = ["prep-language", "prep-trial", "my-research", "my-school-apply", "my-visa", "my-settle", "my-igcse"];
  const notes: Record<string, string> = {
    "prep-language": langNote,
    "prep-trial": "稳健版的核心设计：先用几万块验证适应性，验证不过全身而退。",
    "my-research": "稳健版按新山/槟城等低成本城市规划，成本约为吉隆坡的一半。",
    "my-igcse": profile.keepReturnOption
      ? "您要求保留回国选项：入学后前 1-2 年同步保留国内学籍，每年评估一次是否继续。"
      : "每学年末设检查点，不合适可退回国内，损失可控。",
  };
  const steps = schedule(ids, profile, notes);
  const warnings = [...geoWarnings(profile)];
  const bw = budgetWarning(profile, 12, "稳健版（低成本城市）");
  if (bw) warnings.push(bw);

  return {
    key: "stable",
    title: "稳健版 · 先验证再迁移",
    tagline: "政策最确定、每一步都可退，用小成本验证换大决策的确定性",
    totalCostWan: sumCost(ids).map((v, i) => (i === 0 ? v : Math.round(v * 0.75))) as [number, number],
    totalYears: totalYears(steps, ids[ids.length - 1]),
    steps,
    tradeoff: "代价：节奏最慢，前 1-2 年孩子仍在国内体系内，国际课程衔接晚一年起步。",
    bet: "赌点：几乎不赌政策，赌的是孩子经过验证后能适应——而验证本身已把这个赌注降到最小。",
    exitSummary: "每个节点都有明确出口：验证期可全退；入学后前两年保留国内学籍可回流；最大损失控制在单学期费用。",
    fitWarnings: warnings,
    verifiedLevel: "verified",
  };
}

function buildBalancedPlan(profile: FamilyProfile): Plan {
  const window = hqlkWindow(profile.childAge);
  const warnings = [...geoWarnings(profile)];

  if (window === "closed") {
    // 时间窗已关闭：平衡版退化为「低成本国际教育 + 本地/海外性价比本科」
    const ids = ["prep-language", "my-research", "my-school-apply", "my-visa", "my-settle", "my-igcse", "my-alevel"];
    const notes: Record<string, string> = {
      "my-research": "按新山/槟城性价比城市规划；孩子年龄已超过联考身份+居住时间窗口，本方案不再纳入联考轨道。",
      "my-alevel": "出口按性价比排序：马来西亚本地私立大学（3-6 万/年）→ 马来西亚的英澳大学分校 → 英澳本部。",
    };
    const steps = schedule(ids, profile, notes);
    warnings.push(
      `时间窗校验：孩子当前 ${profile.childAge} 岁，距 18 岁应考不足 4 年，已无法满足「办身份（约 1 年）+ 考前 2 年内居住满 18 个月」的资格链条，联考轨道判定为不可行。`
    );
    const bw = budgetWarning(profile, 15, "平衡版");
    if (bw) warnings.push(bw);
    return {
      key: "balanced",
      title: "平衡版 · 性价比升学（联考窗口已过）",
      tagline: "预算利用最优：低成本城市 + A-Level + 分校/本地大学出口",
      totalCostWan: sumCost(ids),
      totalYears: totalYears(steps, ids[ids.length - 1]),
      steps,
      tradeoff: "代价：放弃联考回国红利（时间窗已关闭，这不是选择而是事实），本科档位取决于 A-Level 成绩。",
      bet: "赌点：赌 A-Level 体系下孩子的成绩产出，以及分校学历在就业市场的接受度。",
      exitSummary: "A-Level 成绩全球通用；每个升学出口之间可横向切换，无单点报废环节。",
      fitWarnings: warnings,
      verifiedLevel: "verified",
    };
  }

  const ids = [
    "prep-language",
    "my-research",
    "my-school-apply",
    "my-visa",
    "hq-status",
    "my-settle",
    "my-igcse",
    "hq-residence",
    "hq-exam-prep",
    "hq-exam",
    "cn-university",
  ];
  const notes: Record<string, string> = {
    "my-research": "平衡版按新山/槟城规划，把省下的学费投入联考双轨准备。",
    "hq-status": "与入学并行办理，身份口径务必按联招办当年简章逐字核对（死亡节点）。",
    "hq-residence": `孩子当前 ${profile.childAge} 岁，${window === "tight" ? "时间窗紧张：身份办理和居住累计必须无缝衔接，任何一年拖延都会挤掉容错空间。" : "时间充裕，但出入境台账从落地第一天就要建立。"}`,
    "hq-exam-prep": "国际课程 + 中文应试双线，是这条路对孩子消耗最大的阶段；A-Level 成绩同步保底。",
    "hq-exam": "双轨设计的意义：即使联考失手，A-Level 出口仍然打开。",
  };
  const steps = schedule(ids, profile, notes);
  if (window === "tight") {
    warnings.push(
      `时间窗校验：孩子当前 ${profile.childAge} 岁，距应考约 ${18 - profile.childAge} 年，资格链条（身份约 1 年 + 居住 18 个月 + 备考应考）刚好排满，属于「紧张但可行」，启动不能再拖。`
    );
  }
  const bw = budgetWarning(profile, 15, "平衡版");
  if (bw) warnings.push(bw);

  return {
    key: "balanced",
    title: "平衡版 · 联考双轨",
    tagline: "预算利用最优：低成本城市读国际课程，同步铺联考资格，一份投入两个出口",
    totalCostWan: sumCost(ids),
    totalYears: totalYears(steps, ids[ids.length - 1]),
    steps,
    tradeoff: "代价：孩子要在国际课程和中文应试之间双线作战；家庭出入境自由度被居住时间要求锁死。",
    bet: "赌点：赌联考政策在未来几年保持现有口径（近年报考人数上升、红利在收窄），以及居住时间管理零失误。",
    exitSummary: "联考任一环节失败均可切换到 A-Level 出口申请海外或马来西亚本地大学——这是双轨的保底价值。",
    fitWarnings: warnings,
    verifiedLevel: "verified",
  };
}

function buildAmbitiousPlan(profile: FamilyProfile): Plan {
  const ids = ["prep-language", "my-research", "my-school-apply", "my-visa", "my-settle", "my-igcse", "my-alevel", "overseas-uni"];
  const notes: Record<string, string> = {
    "my-research": "进取版按吉隆坡头部国际学校规划（IB/A-Level 强校），学术资源与同伴质量对标新加坡的七成、成本的一半。",
    "my-igcse": "头部学校学费 15-25 万/年，竞赛与课外履历从这一阶段就要开始铺。",
    "overseas-uni": "此节点资料未人工核实：各国本科费用与毕业工签政策需在申请前一年逐项确认（列入诊断清单）。",
  };
  const steps = schedule(ids, profile, notes);
  const warnings = [...geoWarnings(profile)];
  const bw = budgetWarning(profile, 25, "进取版（吉隆坡头部学校）");
  if (bw) warnings.push(bw);
  if (profile.riskTolerance === "low") {
    warnings.push("偏好校验：您的风险承受度为「很低」，进取版后段（海外本科+就业）不确定性最高，与您的偏好存在冲突，请重点对比稳健版。");
  }

  return {
    key: "ambitious",
    title: "进取版 · 上限优先",
    tagline: "孩子发展天花板最高：头部国际学校 → A-Level/IB → 英澳新港本科",
    totalCostWan: sumCost(ids).map((v, i) => (i === 0 ? Math.round(v * 1.2) : Math.round(v * 1.1))) as [number, number],
    totalYears: totalYears(steps, ids[ids.length - 1]),
    steps,
    tradeoff: "代价：总投入最高（本科阶段占大头），且全程无「回国应试」的保底出口，退路依赖 A-Level 成绩本身。",
    bet: "赌点：赌孩子的学术产出能配得上头部学校的投入，以及毕业时目标国家工签政策仍然打开。",
    exitSummary: "A-Level 后可降档到马来西亚本地/分校本科（成本立减一半）；本科毕业可回国就业，海外学历仍是资产。",
    fitWarnings: warnings,
    verifiedLevel: "partial",
  };
}

/* ---------------- 报告组装 ---------------- */

function orderPlans(plans: Plan[], profile: FamilyProfile): Plan[] {
  const pref: Record<FamilyProfile["preference"], PlanKey> = {
    stable: "stable",
    value: "balanced",
    ceiling: "ambitious",
  };
  const first = pref[profile.preference];
  return [...plans].sort((a, b) => (a.key === first ? -1 : b.key === first ? 1 : 0));
}

function collectDiagnosisNodes(plans: Plan[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const plan of plans) {
    for (const step of plan.steps) {
      const node = nodes[step.nodeId];
      if (node.needsHumanCheck && !seen.has(node.id)) {
        seen.add(node.id);
        items.push(`「${node.title}」— 当期政策细节与您家庭条件的匹配核验`);
      }
    }
  }
  items.push("目标学校当年学位、学费与入学测试要求的逐校确认");
  items.push("出入境与居住时间安排的逐月排期（资格生命线）");
  return items;
}

export function buildReport(answers: Record<string, string>): PlannerReport {
  const profile = parseProfile(answers);
  const plans = orderPlans(
    [buildStablePlan(profile), buildBalancedPlan(profile), buildAmbitiousPlan(profile)],
    profile
  );

  const goalLabel: Record<FamilyProfile["goal"], string> = {
    hqlk: "联考回国升学",
    overseas: "海外读本科并就业",
    backup: "海外发展备份",
    unsure: "方向待定",
  };

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    profileSummary: `孩子 ${profile.childAge} 岁（${profile.childGrade || "年级未填"}），英语${
      Object.entries(ENGLISH_MAP).find(([, v]) => v === profile.childEnglish)?.[0] ?? "情况未填"
    }；家庭目标：${goalLabel[profile.goal]}；预算 ${profile.annualBudgetWan[0]}-${profile.annualBudgetWan[1]} 万/年。`,
    plans,
    otherCountries: countryBriefs,
    diagnosisNodes: collectDiagnosisNodes(plans),
    disclaimer: DISCLAIMER,
  };
}
