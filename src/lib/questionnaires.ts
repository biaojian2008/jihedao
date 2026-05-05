export type QuestionType = "text" | "single" | "multi";

export type QuestionItem = {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
};

export type QuestionnaireDef = {
  name: string;
  questions: QuestionItem[];
};

export const questionnaires: Record<string, QuestionnaireDef> = {
  immigration: {
    name: "移民参谋",
    questions: [
      { id: "current_location", question: "您目前所在国家/地区是？", type: "text" },
      { id: "nationality", question: "您的国籍是？", type: "text" },
      { id: "age", question: "您的年龄是？", type: "text" },
      {
        id: "education",
        question: "您的最高学历是？",
        type: "single",
        options: ["高中", "大专", "本科", "硕士", "博士"],
      },
      { id: "occupation", question: "您目前的职业和从事年限是？", type: "text" },
      {
        id: "language",
        question: "您的英语或其他语言水平如何？",
        type: "single",
        options: ["无", "基础", "日常交流", "流利", "母语级别"],
      },
      { id: "target_country", question: "您有意向移民的目标国家是？", type: "text" },
      {
        id: "purpose",
        question: "您移民的主要目的是？",
        type: "multi",
        options: ["工作", "子女教育", "资产保护", "生活环境", "政治安全"],
      },
      {
        id: "budget",
        question: "您的移民预算大概是多少？",
        type: "single",
        options: ["50万以下", "50-100万", "100-500万", "500万以上"],
      },
      {
        id: "overseas_experience",
        question: "您是否有海外工作或学习经历？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "marital_status",
        question: "您是否已婚？配偶是否一同移民？",
        type: "single",
        options: ["未婚", "已婚一同移民", "已婚单独移民"],
      },
      { id: "children", question: "您是否有子女？", type: "single", options: ["没有", "有"] },
      {
        id: "timeline",
        question: "您希望多久内完成移民？",
        type: "single",
        options: ["1年内", "1-3年", "3年以上", "没有时间限制"],
      },
      {
        id: "preparation",
        question: "您目前是否已经开始准备任何移民材料？",
        type: "single",
        options: ["还没有", "已经开始"],
      },
    ],
  },
  assets: {
    name: "资产转移参谋",
    questions: [
      { id: "current_location", question: "您目前资产主要在哪个国家/地区？", type: "text" },
      { id: "target_location", question: "您希望将资产转移到哪个国家/地区？", type: "text" },
      {
        id: "asset_type",
        question: "您的资产类型主要是？",
        type: "multi",
        options: ["现金", "房产", "股权", "加密货币", "其他"],
      },
      {
        id: "asset_scale",
        question: "您希望转移的资产规模大概是？",
        type: "single",
        options: ["100万以下", "100-500万", "500-1000万", "1000万以上"],
      },
      {
        id: "purpose",
        question: "您转移资产的主要目的是？",
        type: "multi",
        options: ["资产保护", "移民配套", "子女教育", "税务规划", "其他"],
      },
      {
        id: "overseas_account",
        question: "您目前是否已有境外账户？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "forex_knowledge",
        question: "您是否了解所在国家的外汇管制政策？",
        type: "single",
        options: ["了解", "不太了解", "完全不了解"],
      },
      {
        id: "offshore_structure",
        question: "您是否有离岸公司或信托结构？",
        type: "single",
        options: ["有", "没有", "不了解这些"],
      },
      {
        id: "timeline",
        question: "您对资产转移的时间要求是？",
        type: "single",
        options: ["越快越好", "半年内", "一年内", "不急"],
      },
      {
        id: "advisor",
        question: "您是否有专业顾问在协助您？",
        type: "single",
        options: ["有", "没有"],
      },
    ],
  },
  tax: {
    name: "税务优化参谋",
    questions: [
      { id: "tax_residency", question: "您目前的税务居民身份在哪个国家？", type: "text" },
      {
        id: "income_source",
        question: "您的主要收入来源是？",
        type: "multi",
        options: ["工资", "生意", "投资", "版权", "其他"],
      },
      {
        id: "annual_income",
        question: "您的年收入大概是多少？",
        type: "single",
        options: ["50万以下", "50-100万", "100-500万", "500万以上"],
      },
      {
        id: "overseas_income",
        question: "您是否有境外收入或境外资产？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "multi_tax",
        question: "您是否已经在多个国家缴税？",
        type: "single",
        options: ["是", "否"],
      },
      {
        id: "crs_knowledge",
        question: "您是否了解CRS共同申报准则？",
        type: "single",
        options: ["了解", "听说过", "完全不了解"],
      },
      {
        id: "change_residency",
        question: "您是否有计划改变税务居民身份？",
        type: "single",
        options: ["有", "没有", "不确定"],
      },
      {
        id: "crypto",
        question: "您是否有加密货币资产？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "equity",
        question: "您是否有股权激励或期权？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "inheritance",
        question: "您是否有遗产规划的需求？",
        type: "single",
        options: ["有", "没有", "以后再说"],
      },
    ],
  },
  offshore: {
    name: "离岸公司参谋",
    questions: [
      {
        id: "purpose",
        question: "您注册离岸公司的主要目的是？",
        type: "multi",
        options: ["资产保护", "税务优化", "国际业务", "移民配套"],
      },
      { id: "business_location", question: "您的业务主要在哪些国家开展？", type: "text" },
      {
        id: "existing_offshore",
        question: "您目前是否已有离岸公司？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "preferred_location",
        question: "您倾向的注册地是？",
        type: "single",
        options: ["BVI", "开曼", "香港", "新加坡", "其他", "不清楚"],
      },
      {
        id: "annual_revenue",
        question: "您的年营业额大概是多少？",
        type: "single",
        options: ["100万以下", "100-500万", "500万以上"],
      },
      {
        id: "need_bank",
        question: "您是否需要配套银行账户？",
        type: "single",
        options: ["需要", "不需要", "不确定"],
      },
      {
        id: "compliance_knowledge",
        question: "您是否了解离岸公司的合规申报要求？",
        type: "single",
        options: ["了解", "不太了解", "完全不了解"],
      },
      {
        id: "china_business",
        question: "您的业务是否涉及中国大陆客户或供应商？",
        type: "single",
        options: ["是", "否"],
      },
      {
        id: "asset_separation",
        question: "您是否需要离岸公司与个人资产隔离？",
        type: "single",
        options: ["需要", "不需要", "不了解这个"],
      },
      {
        id: "budget",
        question: "您的预算大概是多少？",
        type: "single",
        options: ["1万以下", "1-3万", "3万以上"],
      },
    ],
  },
  banking: {
    name: "银行与多账户参谋",
    questions: [
      { id: "existing_accounts", question: "您目前有哪些国家的银行账户？", type: "text" },
      {
        id: "target_location",
        question: "您希望开设哪个国家或地区的账户？",
        type: "multi",
        options: ["香港", "新加坡", "美国", "欧洲", "其他"],
      },
      {
        id: "purpose",
        question: "您开设境外账户的主要目的是？",
        type: "multi",
        options: ["资产分散", "收款", "移民配套", "投资", "其他"],
      },
      {
        id: "offshore_company",
        question: "您是否有境外公司或离岸公司？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "employment_status",
        question: "您目前的身份是？",
        type: "single",
        options: ["受雇", "自雇", "公司股东", "自由职业", "其他"],
      },
      {
        id: "overseas_address",
        question: "您是否有境外地址或居留身份？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "monthly_flow",
        question: "您预计账户的月均流水是多少？",
        type: "single",
        options: ["1万以下", "1-10万", "10万以上"],
      },
      {
        id: "kyc_knowledge",
        question: "您是否了解银行的KYC要求？",
        type: "single",
        options: ["了解", "听说过", "不了解"],
      },
      {
        id: "rejected_before",
        question: "您是否曾经被银行拒绝开户或账户被关闭？",
        type: "single",
        options: ["有过", "没有"],
      },
      {
        id: "bank_type",
        question: "您需要网络银行还是实体银行？",
        type: "single",
        options: ["网络银行", "实体银行", "都可以"],
      },
    ],
  },
  legal: {
    name: "法律参谋",
    questions: [
      {
        id: "issue_type",
        question: "您遇到的法律问题属于哪个类别？",
        type: "single",
        options: ["劳动", "合同", "房产", "婚姻", "公司", "跨境", "其他"],
      },
      { id: "current_location", question: "您目前在哪个国家/地区？", type: "text" },
      { id: "law_jurisdiction", question: "问题涉及哪个国家的法律？", type: "text" },
      {
        id: "party_type",
        question: "您是个人还是公司遇到这个问题？",
        type: "single",
        options: ["个人", "公司"],
      },
      {
        id: "duration",
        question: "事情发生多久了？",
        type: "single",
        options: ["一周内", "一个月内", "半年内", "更久"],
      },
      {
        id: "lawyer_involved",
        question: "您目前是否已有律师介入？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "legal_notice",
        question: "您是否已经收到任何法律文件或通知？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "desired_outcome",
        question: "您希望达到什么结果？",
        type: "multi",
        options: ["维权", "和解", "预防", "了解自己的权利"],
      },
      {
        id: "budget",
        question: "您的预算范围是？",
        type: "single",
        options: ["1万以下", "1-5万", "5万以上"],
      },
      {
        id: "urgency",
        question: "事情是否紧急？",
        type: "single",
        options: ["非常紧急", "有点紧急", "不紧急"],
      },
    ],
  },
  medical: {
    name: "药物与就医参谋",
    questions: [
      {
        id: "purpose",
        question: "您就医或购药的主要目的是？",
        type: "single",
        options: ["慢性病", "急症", "体检", "手术", "购买特定药物"],
      },
      { id: "current_location", question: "您目前在哪个国家/地区？", type: "text" },
      { id: "target_location", question: "您希望在哪个国家就医或购药？", type: "text" },
      {
        id: "insurance",
        question: "您是否有海外医疗保险？",
        type: "single",
        options: ["有", "没有"],
      },
      { id: "condition", question: "您需要就医的科室或病症是？", type: "text" },
      {
        id: "specific_drug",
        question: "您是否需要特定药物？",
        type: "single",
        options: ["需要", "不需要"],
      },
      { id: "drug_name", question: "如需特定药物，药物名称是？", type: "text" },
      {
        id: "budget",
        question: "您的就医预算大概是多少？",
        type: "single",
        options: ["5万以下", "5-20万", "20万以上"],
      },
      {
        id: "language_barrier",
        question: "您是否有语言障碍？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "schedule",
        question: "您的时间安排是否灵活？",
        type: "single",
        options: ["灵活", "不太灵活", "时间紧迫"],
      },
    ],
  },
  education: {
    name: "教育与留学参谋",
    questions: [
      {
        id: "who",
        question: "留学的是本人还是子女？",
        type: "single",
        options: ["本人", "子女"],
      },
      {
        id: "current_education",
        question: "目前就读年级或最高学历是？",
        type: "single",
        options: ["初中", "高中", "大专", "本科", "硕士"],
      },
      {
        id: "target_country",
        question: "希望留学的目标国家是？",
        type: "multi",
        options: ["美国", "英国", "加拿大", "澳大利亚", "新加坡", "其他"],
      },
      {
        id: "degree_level",
        question: "希望就读的学历层次是？",
        type: "single",
        options: ["高中", "本科", "硕士", "博士", "语言学校"],
      },
      { id: "major", question: "意向专业或研究方向是？", type: "text" },
      { id: "language_score", question: "语言考试成绩是？没有则填无", type: "text" },
      {
        id: "enrollment_time",
        question: "计划什么时间入学？",
        type: "single",
        options: ["今年", "明年", "两年后", "还没确定"],
      },
      {
        id: "budget",
        question: "留学预算每年大概是多少？",
        type: "single",
        options: ["20万以下", "20-50万", "50万以上"],
      },
      {
        id: "scholarship",
        question: "是否有奖学金需求？",
        type: "single",
        options: ["需要", "不需要", "有更好"],
      },
      {
        id: "immigration_plan",
        question: "留学后是否有移民意向？",
        type: "single",
        options: ["有", "没有", "还没想好"],
      },
    ],
  },
};

export type CanmouDomain = keyof typeof questionnaires;

export function isCanmouDomain(d: string): d is CanmouDomain {
  return d in questionnaires;
}
