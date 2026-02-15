/**
 * 根据帖子内容生成智能合约文本，供参与者一目了然
 */
export type ContractInput = {
  type: string;
  title: string;
  content: string;
  details?: string;
  author_collateral?: number;
  participant_freeze?: number;
  expected_duration?: string;
  returns_description?: string;
  repay_when?: string;
};

export function generateContractText(input: ContractInput, locale: "zh" | "en" | "ja" = "zh"): string {
  const t = getTranslations(locale);
  const lines: string[] = [];

  lines.push(t("contract.title"));
  lines.push("");

  lines.push(t("contract.party1"));
  lines.push(`  ${t("contract.publisher")}: ${input.title}`);
  lines.push("");

  lines.push(t("contract.party2"));
  lines.push(`  ${t("contract.content")}: ${input.content}`);
  if (input.details?.trim()) {
    lines.push(`  ${t("contract.details")}: ${input.details}`);
  }
  lines.push("");

  lines.push(t("contract.collateral"));
  lines.push(`  ${t("contract.authorStake")}: ${Number(input.author_collateral ?? 0)} 济和币`);
  lines.push(`  ${t("contract.participantFreeze")}: ${Number(input.participant_freeze ?? 0)} 济和币`);
  lines.push("");

  if (input.expected_duration?.trim()) {
    lines.push(`  ${t("contract.duration")}: ${input.expected_duration}`);
  }
  if (input.returns_description?.trim()) {
    lines.push(`  ${t("contract.returns")}: ${input.returns_description}`);
  }
  lines.push(`  ${t("contract.repayWhen")}: ${input.repay_when?.trim() || t("contract.repayDefault")}`);
  lines.push("");

  lines.push(t("contract.terms"));
  lines.push(`  1. ${t("contract.term1")}`);
  lines.push(`  2. ${t("contract.term2")}`);
  lines.push(`  3. ${t("contract.term3")}`);

  return lines.join("\n");
}

function getTranslations(locale: "zh" | "en" | "ja") {
  const texts: Record<string, Record<string, string>> = {
    zh: {
      "contract.title": "【济和智能合约】",
      "contract.party1": "一、标的",
      "contract.publisher": "发布内容",
      "contract.party2": "二、具体说明",
      "contract.content": "简介",
      "contract.details": "具体内容",
      "contract.collateral": "三、抵押与冻结",
      "contract.authorStake": "发布者抵押",
      "contract.participantFreeze": "参加者冻结",
      "contract.duration": "预计时长",
      "contract.returns": "收益说明",
      "contract.repayWhen": "归还时间",
      "contract.repayDefault": "项目完成时归还",
      "contract.terms": "四、约定条款",
      "contract.term1": "参加即同意以上条款，点击参加将自动冻结对应济和币。",
      "contract.term2": "中途退出可申请解冻，济和币将返还至您的账户。",
      "contract.term3": "项目完成后，发布者与参加者的抵押/冻结将一并解冻归还。",
    },
    en: {
      "contract.title": "【Jihe Smart Contract】",
      "contract.party1": "1. Subject",
      "contract.publisher": "Content",
      "contract.party2": "2. Details",
      "contract.content": "Summary",
      "contract.details": "Specifics",
      "contract.collateral": "3. Collateral & Freeze",
      "contract.authorStake": "Publisher stake",
      "contract.participantFreeze": "Participant freeze",
      "contract.duration": "Expected duration",
      "contract.returns": "Returns",
      "contract.repayWhen": "Repayment",
      "contract.repayDefault": "When project completes",
      "contract.terms": "4. Terms",
      "contract.term1": "Joining implies agreement. Your Jihe coins will be frozen upon joining.",
      "contract.term2": "You may exit and request unfreeze; coins will be returned.",
      "contract.term3": "Upon completion, all collateral/frozen amounts will be released.",
    },
    ja: {
      "contract.title": "【済和スマートコントラクト】",
      "contract.party1": "一、対象",
      "contract.publisher": "投稿内容",
      "contract.party2": "二、詳細",
      "contract.content": "概要",
      "contract.details": "具体的内容",
      "contract.collateral": "三、担保・凍結",
      "contract.authorStake": "投稿者担保",
      "contract.participantFreeze": "参加者凍結",
      "contract.duration": "予定期間",
      "contract.returns": "リターン",
      "contract.repayWhen": "返却時期",
      "contract.repayDefault": "プロジェクト完了時",
      "contract.terms": "四、条項",
      "contract.term1": "参加で上記に同意。参加時に済和コインが凍結されます。",
      "contract.term2": "途中退出可能。解凍後コインが返却されます。",
      "contract.term3": "完了時、担保・凍結分はすべて解凍返却されます。",
    },
  };
  return (key: string) => texts[locale][key] ?? texts.zh[key] ?? key;
}
