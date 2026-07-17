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
        question: "您目前在哪个国家/地区居住？（填写国家或地区名即可）",
        type: "text",
      },
      {
        id: "nationality",
        question: "您的国籍是？如有多个请都填写。",
        type: "text",
      },
      {
        id: "visa_status",
        question: "您目前在居住国的合法居留身份更接近？",
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
      {
        id: "age",
        question: "您的年龄段是？",
        type: "single",
        options: ["18-25岁", "26-35岁", "36-45岁", "46-55岁", "55岁以上"],
      },
      {
        id: "education",
        question: "您的最高学历是？",
        type: "single",
        options: ["高中及以下", "大专", "本科", "硕士", "博士"],
      },
      {
        id: "occupation",
        question: "您目前的职业是？请描述具体工作内容与从事年限。",
        type: "text",
      },
      {
        id: "language",
        question:
          "您掌握哪些语言（含英语及目标国官方语言等）？大致水平如何？无则写「无」。",
        type: "text",
      },
      {
        id: "target_country",
        question: "您有意向移民的目标国家是？如有多个请列出。",
        type: "text",
      },
      {
        id: "purpose",
        question: "您移民的主要目的是？（可多选）",
        type: "multi",
        options: [
          "工作发展",
          "子女教育",
          "资产保护",
          "生活环境",
          "政治安全",
          "税务优化",
          "养老",
        ],
      },
      {
        id: "budget",
        question: "您的移民总预算大概是多少？（人民币，含主要费用）",
        type: "single",
        options: ["50万以下", "50-100万", "100-300万", "300-500万", "500万以上"],
      },
      {
        id: "assets",
        question: "您目前的主要资产情况？请描述大概金额与类型（可粗估）。",
        type: "text",
      },
      {
        id: "overseas_experience",
        question: "您是否有海外生活、工作或学习经历？请简要描述。",
        type: "text",
      },
      {
        id: "family_status",
        question: "您的家庭情况是？",
        type: "single",
        options: [
          "单身",
          "已婚无子女",
          "已婚有子女一同移民",
          "已婚有子女但子女留国内",
          "离异",
        ],
      },
      {
        id: "children",
        question: "如有子女，请描述年龄与目前就读情况；无则填「无」。",
        type: "text",
      },
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
        options: ["半年内", "1年内", "1-3年", "3年以上", "没有时间限制"],
      },
      {
        id: "compliance_history",
        question: "与移民申请相关的记录（择一项；敏感信息可不展开细节）",
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
        question: "您目前已经做了哪些准备？（可多选）",
        type: "multi",
        options: [
          "语言考试",
          "学历认证",
          "资产整理",
          "咨询过中介",
          "已有目标学校或工作",
          "还没开始准备",
        ],
      },
      {
        id: "concerns",
        question: "您目前最担心或最不确定的问题是什么？",
        type: "text",
      },
      {
        id: "additional",
        question: "还有什么重要情况或具体问题想补充？（没有可填「无」）",
        type: "text",
      },
    ],
  },

  assets: {
    name: "资产转移参谋",
    questions: [
      {
        id: "current_location",
        question: "您目前资产主要在哪个国家/地区？",
        type: "text",
      },
      {
        id: "target_location",
        question: "您希望将资产转移到哪些国家/地区？如有多个请列出。",
        type: "text",
      },
      {
        id: "asset_type",
        question: "您的资产类型主要有哪些？（可多选）",
        type: "multi",
        options: [
          "现金存款",
          "房产",
          "股票基金",
          "公司股权",
          "加密货币",
          "黄金贵金属",
          "保险",
          "其他",
        ],
      },
      {
        id: "fund_source",
        question: "拟转移资金的主要来源是？（可多选，便于合规叙事）",
        type: "multi",
        options: ["薪酬与储蓄", "投资收益", "家族赠与", "企业营收或分红", "出售资产所得", "其他"],
      },
      {
        id: "asset_detail",
        question: "请描述资产大概规模、币种与地区分布（可粗估）。",
        type: "text",
      },
      {
        id: "asset_scale",
        question: "您希望转移的资产规模更接近？（人民币）",
        type: "single",
        options: ["100万以下", "100-500万", "500-1000万", "1000万以上"],
      },
      {
        id: "purpose",
        question: "您转移资产的主要目的是？（可多选）",
        type: "multi",
        options: [
          "资产保护",
          "移民配套",
          "子女教育",
          "税务优化",
          "分散风险",
          "投资增值",
          "养老规划",
        ],
      },
      {
        id: "joint_assets",
        question: "拟转移资产是否多为夫妻共同或家庭共有？",
        type: "single",
        options: ["是", "否", "部分共有"],
      },
      {
        id: "urgency",
        question: "转移的紧迫程度如何？",
        type: "single",
        options: ["非常紧迫需要尽快", "半年内", "一年内", "慢慢规划不急"],
      },
      {
        id: "overseas_account",
        question: "您目前已有哪些境外账户或境外资产？请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "forex_context",
        question: "您是否了解外汇管制政策？此前是否尝试过转移、遇到过什么问题？",
        type: "text",
      },
      {
        id: "offshore_structure",
        question: "您是否已有离岸公司或信托结构？",
        type: "single",
        options: ["有，下一题请简述", "没有", "不了解这些"],
      },
      {
        id: "offshore_detail",
        question: "如有离岸结构，请描述主体、地区与用途；没有则填「无」。",
        type: "text",
      },
      {
        id: "concerns",
        question: "您最担心的风险或问题是？（可多选）",
        type: "multi",
        options: [
          "外汇管制限制",
          "税务申报问题",
          "资产被查封风险",
          "汇率损失",
          "中介不可信",
          "不知道从哪里开始",
        ],
      },
      {
        id: "advisor",
        question: "您是否有专业顾问在协助？请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "additional",
        question: "还有什么重要情况想补充？（没有可填「无」）",
        type: "text",
      },
    ],
  },

  tax: {
    name: "税务优化参谋",
    questions: [
      {
        id: "tax_residency",
        question: "您目前的税务居民身份在哪个国家？如有多个请都填写。",
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
        question: "您的主要收入来源有哪些？（可多选）",
        type: "multi",
        options: [
          "工资薪酬",
          "个体经营",
          "公司分红",
          "股票投资",
          "房租收入",
          "版权收入",
          "加密货币",
          "境外收入",
          "其他",
        ],
      },
      {
        id: "income_detail",
        question: "请描述收入结构、主要来源国与大概金额区间（可粗估）。",
        type: "text",
      },
      {
        id: "annual_income",
        question: "您的年收入规模更接近？（人民币）",
        type: "single",
        options: ["50万以下", "50-100万", "100-500万", "500万以上"],
      },
      {
        id: "income_origin_note",
        question:
          "主要收入产生国与税务居民国是否一致？（一致可填「一致」；不一致请简要说明）",
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
        question: "您是否有境外收入或境外资产？请简要描述；无则写「无」。",
        type: "text",
      },
      {
        id: "current_tax_issue",
        question: "您目前面临的主要税务问题或想解决的核心矛盾是什么？",
        type: "text",
      },
      {
        id: "multi_tax",
        question: "您是否已经在多个国家缴税？",
        type: "single",
        options: ["是", "否", "不确定"],
      },
      {
        id: "crs_knowledge",
        question: "您是否了解CRS共同申报准则对您的影响？",
        type: "single",
        options: ["完全了解", "听说过但不太清楚", "完全不了解"],
      },
      {
        id: "change_residency",
        question: "您是否有计划改变税务居民身份？",
        type: "single",
        options: ["有明确计划", "在考虑中", "没有", "不了解怎么操作"],
      },
      {
        id: "special_assets",
        question: "您是否有以下特殊资产？（可多选）",
        type: "multi",
        options: [
          "加密货币",
          "股权激励或期权",
          "海外房产",
          "信托资产",
          "艺术品收藏",
          "都没有",
        ],
      },
      {
        id: "inheritance",
        question: "您是否有遗产规划或财富传承需求？请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "past_issues",
        question: "您是否曾遇到税务稽查或处罚？请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "goal",
        question: "您最希望通过税务优化达到什么目标？",
        type: "text",
      },
      {
        id: "additional",
        question: "还有什么重要情况想补充？（没有可填「无」）",
        type: "text",
      },
    ],
  },

  offshore: {
    name: "离岸公司参谋",
    questions: [
      {
        id: "purpose",
        question: "您注册离岸公司的主要目的是？（可多选）",
        type: "multi",
        options: [
          "资产保护",
          "税务优化",
          "国际业务收款",
          "移民配套",
          "股权架构设计",
          "投资控股",
          "其他",
        ],
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
        id: "business_detail",
        question: "请描述业务性质、主要客户/供应商所在国家或地区。",
        type: "text",
      },
      {
        id: "existing_offshore",
        question: "您目前是否已有离岸公司？如有请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "preferred_location",
        question: "您倾向的注册地是？",
        type: "single",
        options: ["香港", "新加坡", "BVI", "开曼", "马耳他", "迪拜", "英国", "不清楚帮我推荐"],
      },
      {
        id: "annual_revenue",
        question: "您的年营业额或预计年营业额大概是多少？（人民币）",
        type: "single",
        options: ["100万以下", "100-500万", "500万-1000万", "1000万以上"],
      },
      {
        id: "need_bank",
        question: "您是否需要配套开设境外银行账户？",
        type: "single",
        options: ["需要，这是最重要的", "需要但不是最紧迫", "不需要", "不确定"],
      },
      {
        id: "china_connection",
        question: "您的业务与中国大陆的关联程度如何？请描述。",
        type: "text",
      },
      {
        id: "shareholders",
        question: "公司股东情况更接近？",
        type: "single",
        options: ["只有我一个人", "有中国大陆合伙人", "有境外合伙人", "有中外合伙人"],
      },
      {
        id: "compliance_knowledge",
        question: "您对离岸公司合规申报要求的了解程度？",
        type: "single",
        options: ["了解", "不太了解", "完全不了解"],
      },
      {
        id: "compliance_concern",
        question: "您对合规与申报有哪些顾虑？（可多选）",
        type: "multi",
        options: [
          "不知道需要申报什么",
          "担心信息被共享回中国",
          "担心税务负担",
          "担心维护成本太高",
          "没有特别顾虑",
        ],
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
        question: "您的预算大概是多少？（人民币，含注册与年维护费）",
        type: "single",
        options: ["1万以下", "1-3万", "3-5万", "5万以上"],
      },
      {
        id: "timeline",
        question: "您希望多久内完成注册？",
        type: "single",
        options: ["越快越好", "一个月内", "三个月内", "不急慢慢规划"],
      },
      {
        id: "additional",
        question: "您还有什么具体问题或特殊情况想说明？（没有可填「无」）",
        type: "text",
      },
    ],
  },

  banking: {
    name: "银行与多账户参谋",
    questions: [
      {
        id: "existing_accounts",
        question: "您目前已有哪些国家或地区的银行账户？请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "target_location",
        question: "您希望开设账户的国家或地区？（可多选）",
        type: "multi",
        options: ["香港", "新加坡", "美国", "英国", "欧洲", "阿联酋", "其他"],
      },
      {
        id: "purpose",
        question: "您开设境外账户的主要目的是？（可多选）",
        type: "multi",
        options: [
          "资产分散保护",
          "收取境外款项",
          "移民配套",
          "投资理财",
          "子女教育费用",
          "日常消费",
          "公司运营",
        ],
      },
      {
        id: "account_type",
        question: "您需要个人账户还是公司账户？",
        type: "single",
        options: ["个人账户", "公司账户", "两个都需要"],
      },
      {
        id: "industry_source",
        question:
          "您的主要收入来源或行业大类？（银行KYC常见问法，如：外贸、互联网、投资、薪资等）",
        type: "text",
      },
      {
        id: "offshore_company",
        question: "您是否已有境外公司或离岸公司？请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "employment_status",
        question: "您目前的身份与收入来源情况？（便于评估开户叙事）",
        type: "text",
      },
      {
        id: "main_currencies",
        question: "账户主要往来币种是？（可多选）",
        type: "multi",
        options: ["人民币", "美元", "港币", "欧元", "新加坡元", "英镑", "其他"],
      },
      {
        id: "overseas_status",
        question: "您是否有境外地址、居留身份或签证？请描述；无则写「无」。",
        type: "text",
      },
      {
        id: "monthly_flow",
        question: "您预计账户的月均流水更接近？（人民币）",
        type: "single",
        options: ["1万以下", "1-10万", "10-50万", "50万以上"],
      },
      {
        id: "fund_source",
        question: "账户内资金的主要来源是什么？",
        type: "text",
      },
      {
        id: "kyc_knowledge",
        question: "您是否了解银行的KYC与尽职调查要求？",
        type: "single",
        options: ["了解", "听说过", "不了解"],
      },
      {
        id: "rejected_before",
        question: "您是否曾被银行拒绝开户或账户被关闭？请描述经过；无则写「无」。",
        type: "text",
      },
      {
        id: "bank_type",
        question: "您偏向哪类银行或服务？（可多选）",
        type: "multi",
        options: ["传统实体银行", "数字银行（如 Wise、Revolut）", "私人银行", "企业银行", "都可以"],
      },
      {
        id: "concerns",
        question: "您最担心开户过程中的哪些问题？（可多选）",
        type: "multi",
        options: [
          "不符合开户条件",
          "KYC审查太严",
          "资金来源证明困难",
          "没有境外地址",
          "语言障碍",
          "不知道选哪家银行",
        ],
      },
      {
        id: "additional",
        question: "还有什么重要情况想补充？（没有可填「无」）",
        type: "text",
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
          "劳动纠纷",
          "合同纠纷",
          "房产纠纷",
          "婚姻家庭",
          "公司股权",
          "消费者维权",
          "行政争议",
          "借贷与执行",
          "侵权与名誉",
          "知识产权",
          "跨境纠纷",
          "刑事相关问题",
          "其他",
        ],
      },
      {
        id: "party_type",
        question: "您是个人还是主体遇到该问题？",
        type: "single",
        options: ["个人", "公司或其他组织"],
      },
      {
        id: "current_location",
        question: "您目前在哪个国家/地区？",
        type: "text",
      },
      {
        id: "law_jurisdiction",
        question: "问题主要适用或涉及哪个国家/地区的法律与程序？",
        type: "text",
      },
      {
        id: "counterparty",
        question: "争议相对方或主要对手方更接近？",
        type: "single",
        options: ["个人", "小公司", "大公司", "平台", "政府机构", "前配偶或家人", "多方", "不清楚"],
      },
      {
        id: "what_happened",
        question: "请尽量具体描述：发生了什么？对方做了什么或未履行什么？",
        type: "text",
      },
      {
        id: "your_loss",
        question: "您目前的损失、损害或核心诉求是什么？请尽量具体。",
        type: "text",
      },
      {
        id: "loss_amount",
        question: "涉及金额或争议标的更接近？",
        type: "single",
        options: ["1万以下", "1-10万", "10-50万", "50-100万", "100万以上", "无金钱损失"],
      },
      {
        id: "evidence",
        question: "您目前有哪些证据材料？（可多选）",
        type: "multi",
        options: [
          "书面合同",
          "聊天记录截图",
          "转账记录",
          "收据发票",
          "录音录像",
          "证人",
          "邮件记录",
          "没有证据或很少",
        ],
      },
      {
        id: "duration",
        question: "事情发生多久了？",
        type: "single",
        options: ["一周内", "一个月内", "三个月内", "半年内", "一年以上"],
      },
      {
        id: "negotiation_status",
        question: "与对方或相关方的协商进展如何？",
        type: "single",
        options: [
          "还没开始协商",
          "正在协商中",
          "对方拒绝协商",
          "协商破裂",
          "已达成协议但对方不履行",
        ],
      },
      {
        id: "legal_notice",
        question: "您是否已收到律师函、传票、处罚决定等正式法律文件？",
        type: "single",
        options: ["有", "没有"],
      },
      {
        id: "procedure_stage",
        question: "您目前处于哪个阶段？（择最接近的一项）",
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
        question: "您希望达到什么结果？（可多选）",
        type: "multi",
        options: [
          "退款或赔偿",
          "继续履行合同",
          "解除合同",
          "公开道歉",
          "追究刑事责任",
          "了解自己的权利与选项",
          "和解或调解",
          "其他",
        ],
      },
      {
        id: "lawyer_involved",
        question: "您目前是否已有律师介入？",
        type: "single",
        options: ["有正式委托律师", "咨询过但没有正式委托", "没有"],
      },
      {
        id: "urgency",
        question: "事情是否紧急？",
        type: "single",
        options: ["非常紧急有截止日期", "比较紧迫", "不太紧急", "只是想了解情况"],
      },
      {
        id: "budget",
        question: "您愿意投入的咨询或维权预算更接近？",
        type: "single",
        options: ["希望尽量低成本自助", "1万以下", "1-5万", "5万以上"],
      },
      {
        id: "additional",
        question: "还有什么重要信息想补充？（没有可填「无」）",
        type: "text",
      },
    ],
  },

  medical: {
    name: "药物与就医参谋",
    questions: [
      {
        id: "purpose",
        question: "您的主要需求是什么？（可多选）",
        type: "multi",
        options: [
          "治疗特定疾病",
          "购买特定药物",
          "海外体检",
          "海外手术",
          "寻求第二诊疗意见",
          "慢性病管理",
          "医疗旅游",
        ],
      },
      {
        id: "care_acuity",
        question: "本次需求更偏哪一类？（帮助判断缓急与路径）",
        type: "single",
        options: [
          "急性发作、手术或急诊为主",
          "慢性病长期管理",
          "体检或预防为主",
          "其他",
        ],
      },
      {
        id: "condition",
        question: "请描述您或家人的具体病情、科室需求或健康问题。",
        type: "text",
      },
      {
        id: "current_treatment",
        question: "您目前在常住地接受过哪些诊疗？效果如何？",
        type: "text",
      },
      {
        id: "specific_drug",
        question: "是否需要购买或使用特定药物？如是请写药物名称、用途与是否已在国内使用过。",
        type: "text",
      },
      {
        id: "current_location",
        question: "您目前在哪个国家/地区？",
        type: "text",
      },
      {
        id: "target_location",
        question: "您希望在哪个国家或地区就医或购药？如有偏好请说明原因。",
        type: "text",
      },
      {
        id: "insurance",
        question: "您是否有医疗保险？请描述类型、覆盖范围与是否含境外。",
        type: "text",
      },
      {
        id: "budget",
        question: "您的就医或购药预算更接近？（人民币）",
        type: "single",
        options: ["5万以下", "5-20万", "20-50万", "50万以上", "视情况而定"],
      },
      {
        id: "language",
        question: "您是否有语言障碍？能用什么语言沟通？",
        type: "text",
      },
      {
        id: "schedule",
        question: "您的时间安排情况如何？",
        type: "single",
        options: ["时间非常紧迫", "一个月内需要", "三个月内", "时间比较灵活"],
      },
      {
        id: "visa_need",
        question: "您是否需要协助了解签证与入境要求？",
        type: "single",
        options: ["需要", "不需要", "已经有签证"],
      },
      {
        id: "concerns",
        question: "您最担心的问题是什么？（可多选）",
        type: "multi",
        options: [
          "语言沟通困难",
          "费用太高",
          "不知道哪家医院好",
          "药物真假难辨",
          "入境携带药物限制",
          "医疗记录衔接问题",
        ],
      },
      {
        id: "additional",
        question: "还有什么重要情况想补充说明？（没有可填「无」）",
        type: "text",
      },
    ],
  },

  education: {
    name: "未来参谋",
    questions: [
      {
        id: "who",
        question: "这次规划的对象是？",
        type: "single",
        options: ["本人", "子女", "本人和子女都需要规划"],
      },
      {
        id: "current_stage",
        question: "规划对象目前的年龄和所处阶段？请描述年级/学历/职业状态，以及就读或工作的具体情况。",
        type: "text",
      },
      {
        id: "current_path",
        question: "目前走的是哪条路径？",
        type: "single",
        options: [
          "体制内学校",
          "国际学校或国际课程",
          "在家教育/自主学习",
          "已在工作",
          "其他",
        ],
      },
      {
        id: "future_goal",
        question: "对未来的主要期望是什么？（可多选）",
        type: "multi",
        options: [
          "掌握 AI 时代的核心技能",
          "进入海外名校深造",
          "海外就业与身份衔接",
          "自由职业/远程工作能力",
          "创业或经营自己的事业",
          "独立人格与身心健康",
          "尚未明确，想听建议",
        ],
      },
      {
        id: "education_stance",
        question: "对现行教育体制的态度更接近？",
        type: "single",
        options: [
          "基本认可，在体制内优化即可",
          "部分认可，想体制内外两条腿走路",
          "不认可，想走体制外路径",
          "不确定，想听分析",
        ],
      },
      {
        id: "study_abroad",
        question: "是否考虑留学？",
        type: "single",
        options: ["明确要留学", "作为备选路径之一", "暂不考虑", "不确定"],
      },
      {
        id: "target_region",
        question: "如果考虑海外，倾向的国家或地区？（可多选）",
        type: "multi",
        options: [
          "美国",
          "英国",
          "加拿大",
          "澳大利亚",
          "新加坡",
          "日本",
          "欧洲其他",
          "东南亚",
          "暂无倾向",
        ],
      },
      {
        id: "skills",
        question: "目前具备或正在培养的核心能力、特长或作品？（如编程、语言、体育、艺术、竞赛等，没有可写「无」）",
        type: "text",
      },
      {
        id: "ai_attitude",
        question: "如何看待 AI 对未来教育和职业的冲击？",
        type: "single",
        options: [
          "机会大于威胁，想主动拥抱",
          "有焦虑，不知道该怎么准备",
          "影响被高估了，按原计划走",
          "没怎么想过",
        ],
      },
      {
        id: "geo_flexibility",
        question: "家庭的地理灵活性如何？",
        type: "single",
        options: [
          "可以举家搬迁或长期陪读",
          "孩子可以单独出去，家庭留在国内",
          "近几年只能以国内/远程为主",
          "不确定",
        ],
      },
      {
        id: "budget",
        question: "每年可投入的教育与成长预算大概是多少？（人民币）",
        type: "single",
        options: ["10万以下", "10-30万", "30-60万", "60万以上"],
      },
      {
        id: "timeline",
        question: "希望在多长时间内形成清晰的路径规划？",
        type: "single",
        options: ["半年内要做出关键决定", "一两年内逐步调整", "三五年长期布局", "还没确定"],
      },
      {
        id: "concerns",
        question: "您目前最担心的问题是什么？（可多选）",
        type: "multi",
        options: [
          "选错路径耽误孩子",
          "AI 让现在学的东西过时",
          "费用压力",
          "脱离体制后无法回头",
          "孩子的意愿和动力",
          "身份、签证等外部限制",
          "信息太多不知道听谁的",
        ],
      },
      {
        id: "additional",
        question: "还有什么特殊情况或具体问题想说明？（没有可填「无」）",
        type: "text",
      },
    ],
  },
};

export type CanmouDomain = keyof typeof questionnaires;

export function isCanmouDomain(d: string): d is CanmouDomain {
  return d in questionnaires;
}
