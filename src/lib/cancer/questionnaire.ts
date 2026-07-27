/**
 * 癌症国际就医初筛问卷。
 * 复用参谋问卷的题型结构（text / single / multi），但独立于 questionnaires.ts，
 * 因为癌症流程是多步的（解析→人工确认→评估→医院匹配），不走通用一问一答引擎。
 */

export type CancerQuestionType = "text" | "single" | "multi";

export type CancerQuestion = {
  id: string;
  question: string;
  type: CancerQuestionType;
  options?: string[];
  placeholder?: string;
};

export const CANCER_QUESTIONNAIRE_NAME = "癌症国际就医参谋";

export const cancerQuestions: CancerQuestion[] = [
  {
    id: "cancer_type",
    question: "患者的癌症类型是？（如：非小细胞肺癌、乳腺癌、结直肠癌……尽量写具体）",
    type: "text",
    placeholder: "例：非小细胞肺癌",
  },
  {
    id: "subtype",
    question: "是否有明确的病理亚型或基因突变？有则填写，没有或不清楚填「无」。",
    type: "text",
    placeholder: "例：EGFR Exon20ins 突变 / HER2 阳性 / 无",
  },
  {
    id: "stage",
    question: "目前的分期是？",
    type: "single",
    options: ["I 期", "II 期", "III 期（局部晚期）", "IV 期（转移性）", "不清楚/待确认"],
  },
  {
    id: "prior_treatment",
    question: "既往接受过哪些治疗？效果如何？（手术、化疗、放疗、靶向、免疫等）没有填「无」。",
    type: "text",
    placeholder: "例：一线化疗+免疫6周期，进展",
  },
  {
    id: "current_situation",
    question: "目前在国内的诊疗情况与主治医生给的建议是？",
    type: "text",
  },
  {
    id: "report_text",
    question:
      "如有检查/病理报告，请把关键文字粘贴到这里（如病理诊断、基因检测结论、影像描述）。没有可填「无」。",
    type: "text",
    placeholder: "把报告里的文字复制过来，越具体解析越准",
  },
  {
    id: "core_concern",
    question: "您本次最想了解的核心问题是？（可多选）",
    type: "multi",
    options: [
      "国内标准方案和大致费用",
      "印度是否有可及/更经济的方案",
      "是否有国内暂未上市的药物或疗法",
      "费用对比",
      "第二诊疗意见方向",
    ],
  },
  {
    id: "budget",
    question: "可承受的治疗预算区间？（人民币）",
    type: "single",
    options: ["10万以下", "10-30万", "30-60万", "60万以上", "视情况而定"],
  },
  {
    id: "additional",
    question: "还有什么重要情况想补充？（没有可填「无」）",
    type: "text",
  },
];

/** 结构化解析后的字段（DeepSeek 解析 + 人工确认） */
export type CancerParsed = {
  cancer_type: string;
  subtype: string;
  stage: string;
  key_markers: string; // 关键指标（基因/受体/转移部位等）
  prior_lines: string; // 既往治疗线数概述
};
