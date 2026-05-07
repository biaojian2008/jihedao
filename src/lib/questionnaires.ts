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
    name: "教育与留学参谋",
    questions: [
      {
        id: "who",
        question: "留学规划的对象是？",
        type: "single",
        options: ["本人", "子女", "本人和子女都需要规划"],
      },
      {
        id: "study_goal",
        question: "留学的主要导向更接近？",
        type: "single",
        options: ["学术深造为主", "就业与当地移民衔接为主", "两者兼顾", "尚未明确"],
      },
      {
        id: "current_education",
        question: "目前的教育情况？请描述年级或学历、就读学校与课程体系（如国内高考/A-Level 等）。",
        type: "text",
      },
      {
        id: "target_country",
        question: "希望留学的目标国家或地区？（可多选）",
        type: "multi",
        options: [
          "美国",
          "英国",
          "加拿大",
          "澳大利亚",
          "新加坡",
          "日本",
          "韩国",
          "德国",
          "法国",
          "荷兰",
          "新西兰",
          "其他",
        ],
      },
      {
        id: "degree_level",
        question: "希望就读的学历层次是？",
        type: "single",
        options: ["小学", "初中", "高中", "本科", "硕士", "博士", "语言学校", "职业技术"],
      },
      {
        id: "major",
        question: "意向专业或研究方向？请尽量具体。",
        type: "text",
      },
      {
        id: "academic_performance",
        question: "目前的学业成绩、排名或预估水平？（可粗述；不愿透露可写「不愿透露」）",
        type: "text",
      },
      {
        id: "language_score",
        question: "目前的语言或标化考试成绩？没有请写「无」。",
        type: "text",
      },
      {
        id: "extracurricular",
        question: "有哪些课外活动、竞赛获奖或特长？没有可写「无」。",
        type: "text",
      },
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
        options: ["今年下半年", "明年", "两年后", "还没确定"],
      },
      {
        id: "budget",
        question: "留学预算每年大概是多少？（人民币，含学费与生活费）",
        type: "single",
        options: ["20万以下", "20-40万", "40-60万", "60万以上"],
      },
      {
        id: "scholarship",
        question: "是否有奖学金需求？",
        type: "single",
        options: ["非常需要，经济压力大", "有最好", "不需要"],
      },
      {
        id: "immigration_plan",
        question: "留学后是否有移民或长期居留意向？",
        type: "single",
        options: ["有明确移民计划", "在考虑中", "只是留学不打算移民", "还没想好"],
      },
      {
        id: "concerns",
        question: "您目前最担心的问题是什么？（可多选）",
        type: "multi",
        options: [
          "成绩不够",
          "语言不达标",
          "费用太高",
          "不知道选哪所学校",
          "签证问题",
          "适应海外生活",
          "毕业后就业",
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
