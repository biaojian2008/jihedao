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
      {
        id: "current_location",
        question: "您目前所在国家/地区是？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "nationality",
        question: "您的国籍是？（填写国家名即可；多重国籍可简要并列）",
        type: "text",
      },
      {
        id: "visa_status",
        question: "您目前在该国的合法居留身份更接近？",
        type: "single",
        options: [
          "旅游或短期访问",
          "学生签证",
          "工作签证或居留许可",
          "永久居民",
          "该国公民",
          "其他或未出境规划",
        ],
      },
      { id: "age", question: "您的年龄是？（填数字即可）", type: "text" },
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
      {
        id: "second_language",
        question:
          "除英语外，您是否掌握目标移民国官方语言或其他外语？（无则填「无」；掌握可写语种与大致水平）",
        type: "text",
      },
      {
        id: "target_country",
        question: "您有意向移民的目标国家是？（可填一国或多国，用顿号分隔）",
        type: "text",
      },
      {
        id: "purpose",
        question: "您移民的主要目的是？",
        type: "multi",
        options: ["工作", "子女教育", "资产保护", "生活环境", "政治安全"],
      },
      {
        id: "budget",
        question: "您的移民预算大概是多少？（单位：人民币万元）",
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
        id: "path_flexibility",
        question: "您是否接受「先留学或工签、再转永居」等较长路径？",
        type: "single",
        options: ["完全可以接受", "希望尽快取得身份、路径尽量短", "不确定，想听方案比较"],
      },
      {
        id: "timeline",
        question: "您希望多久内完成移民？",
        type: "single",
        options: ["1年内", "1-3年", "3年以上", "没有时间限制"],
      },
      {
        id: "compliance_history",
        question: "与移民申请相关的记录（择一项；涉及敏感信息可不展开细节）",
        type: "single",
        options: [
          "无拒签或重大刑事案件记录",
          "曾有签证拒签",
          "曾有重大刑事案件",
          "拒签与刑事案件均曾涉及",
          "不愿说明",
        ],
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
      {
        id: "current_location",
        question: "您目前资产主要在哪个国家/地区？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "target_location",
        question: "您希望将资产转移到哪个国家/地区？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "asset_type",
        question: "您的资产类型主要是？",
        type: "multi",
        options: ["现金", "房产", "股权", "加密货币", "其他"],
      },
      {
        id: "fund_source",
        question: "拟转移资金的主要来源是？（可多选，便于合规叙事提醒）",
        type: "multi",
        options: ["薪酬与储蓄", "投资收益", "家族赠与", "企业营收或分红", "出售资产所得", "其他"],
      },
      {
        id: "asset_scale",
        question: "您希望转移的资产规模大概是？（单位：人民币万元）",
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
        id: "joint_assets",
        question: "拟转移资产是否多为夫妻共同或家庭共有？",
        type: "single",
        options: ["是", "否", "部分共有"],
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
      {
        id: "tax_residency",
        question: "您目前的税务居民身份在哪个国家？（填写国家名即可）",
        type: "text",
      },
      {
        id: "us_tax_status",
        question: "您是否可能构成美国税务居民？（美国公民、绿卡持有者、或当年在美通常≥183天）",
        type: "single",
        options: ["否", "是", "不确定"],
      },
      {
        id: "income_source",
        question: "您的主要收入来源是？",
        type: "multi",
        options: ["工资", "生意", "投资", "版权", "其他"],
      },
      {
        id: "annual_income",
        question: "您的年收入大概是多少？（单位：人民币万元）",
        type: "single",
        options: ["50万以下", "50-100万", "100-500万", "500万以上"],
      },
      {
        id: "income_origin_note",
        question:
          "主要收入产生国与税务居民国是否一致？（一致可填「一致」；不一致请简要写明收入产生国与情况）",
        type: "text",
      },
      {
        id: "business_income_share",
        question: "您的收入是否显著来自您持股或实际控制的企业？",
        type: "single",
        options: ["是", "否", "部分"],
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
      {
        id: "business_nature",
        question: "公司业务实质更接近？（可多选）",
        type: "multi",
        options: [
          "国际贸易",
          "控股持股",
          "知识产权持有",
          "投资管理",
          "尚无实质业务、尚在规划",
          "其他",
        ],
      },
      {
        id: "business_location",
        question: "您的业务主要在哪些国家开展？（可填多国，用顿号分隔）",
        type: "text",
      },
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
        question: "您的年营业额大概是多少？（单位：人民币万元）",
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
        id: "economic_substance",
        question: "是否考虑在注册地配置员工或办公场所以满足经济实质要求？",
        type: "single",
        options: ["需要", "暂不需要", "不了解"],
      },
      {
        id: "budget",
        question: "您注册与维护架构的预算大概是多少？（人民币；以下为粗略区间）",
        type: "single",
        options: ["1万以下", "1-3万", "3万以上"],
      },
    ],
  },
  banking: {
    name: "银行与多账户参谋",
    questions: [
      {
        id: "existing_accounts",
        question: "您目前有哪些国家的银行账户？（无则填「无」；有则列国家名，顿号分隔）",
        type: "text",
      },
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
        id: "industry_source",
        question:
          "您的主要收入来源或行业大类是？（银行KYC常见问法，可填如：外贸、互联网、投资、薪资等）",
        type: "text",
      },
      {
        id: "main_currencies",
        question: "账户主要往来币种是？（可多选）",
        type: "multi",
        options: ["人民币", "美元", "港币", "欧元", "新加坡元", "英镑", "其他"],
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
        question: "您预计账户的月均流水是多少？（单位：人民币万元）",
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
    name: "法律与维权参谋",
    questions: [
      {
        id: "issue_type",
        question: "您遇到的法律问题属于哪个类别？",
        type: "single",
        options: [
          "劳动",
          "合同",
          "房产",
          "婚姻",
          "公司",
          "消费维权",
          "行政争议",
          "借贷与执行",
          "侵权与名誉",
          "知识产权",
          "跨境",
          "其他",
        ],
      },
      {
        id: "current_location",
        question: "您目前在哪个国家/地区？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "law_jurisdiction",
        question: "问题涉及哪个国家或地区的法律？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "party_type",
        question: "您是个人还是公司遇到这个问题？",
        type: "single",
        options: ["个人", "公司"],
      },
      {
        id: "counterparty",
        question: "争议相对方主要是？",
        type: "single",
        options: ["个人", "企业", "平台", "行政机关", "多方", "不清楚"],
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
        id: "procedure_stage",
        question: "您目前处于哪个阶段？",
        type: "single",
        options: [
          "尚未采取正式行动",
          "协商沟通中",
          "已向监管、平台或劳动监察等投诉",
          "仲裁程序中",
          "诉讼程序中",
          "执行阶段",
          "其他",
        ],
      },
      {
        id: "desired_outcome",
        question: "您希望达到什么结果？",
        type: "multi",
        options: ["维权", "和解", "预防", "了解自己的权利"],
      },
      {
        id: "budget",
        question: "您用于咨询或委托的预算范围是？（人民币万元）",
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
      {
        id: "care_acuity",
        question: "本次需求更偏哪一类？",
        type: "single",
        options: [
          "急性发作、手术或急诊为主",
          "慢性病长期管理",
          "体检或预防为主",
          "其他",
        ],
      },
      {
        id: "current_location",
        question: "您目前在哪个国家/地区？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "target_location",
        question: "您希望在哪个国家就医或购药？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "insurance",
        question: "您是否有海外医疗保险？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "insurance_scope",
        question: "医疗保险与目标就医地的关系更接近？",
        type: "single",
        options: [
          "覆盖目标地且可直付或理赔便利",
          "覆盖目标地但直付/理赔一般",
          "不覆盖境外或仅覆盖紧急",
          "无保险或不适用",
        ],
      },
      {
        id: "condition",
        question: "您需要就医的科室或病症是？（可填科室名或通俗病症描述）",
        type: "text",
      },
      {
        id: "specific_drug",
        question: "您是否需要特定药物？",
        type: "single",
        options: ["需要", "不需要"],
      },
      {
        id: "drug_name",
        question: "如需特定药物，药物名称是？（填通用名或英文商品名；不需要则填「无」）",
        type: "text",
      },
      {
        id: "budget",
        question: "您的就医预算大概是多少？（单位：人民币万元）",
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
        id: "study_goal",
        question: "留学的主要导向更接近？",
        type: "single",
        options: ["学术深造为主", "就业与当地移民衔接为主", "两者兼顾", "尚未明确"],
      },
      {
        id: "current_education",
        question: "目前就读年级或最高学历是？",
        type: "single",
        options: ["初中", "高中", "大专", "本科", "硕士"],
      },
      {
        id: "gpa_band",
        question: "目前在校成绩大致档位？（选一项即可）",
        type: "single",
        options: ["不愿透露", "中等", "中上", "优秀"],
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
      {
        id: "major",
        question: "意向专业或研究方向是？（可填大类或具体方向）",
        type: "text",
      },
      { id: "language_score", question: "语言或标化考试成绩？（没有则填「无」；已考请写考试名与分数）", type: "text" },
      {
        id: "test_plan",
        question: "语言或标化考试计划更接近？",
        type: "single",
        options: ["已考且成绩可用", "计划一年内考取", "暂不考或申请免考", "尚未确定"],
      },
      {
        id: "enrollment_time",
        question: "计划什么时间入学？",
        type: "single",
        options: ["今年", "明年", "两年后", "还没确定"],
      },
      {
        id: "budget",
        question: "留学预算每年大概是多少？（单位：人民币万元）",
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
