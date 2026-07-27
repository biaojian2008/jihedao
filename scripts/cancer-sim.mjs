#!/usr/bin/env node
/**
 * 端到端模拟：用一个真实病例跑通「解析 → 检索指南/医院 → 中立评估」。
 * 说明：为了演示输出，本脚本检索指南/医院时忽略 verified 标志（把种子数据当作已核实）。
 *       真实上线时 API 只会取 verified=true 的数据——请务必在后台逐条签发后再上线。
 * 读取 .env.local 的 DEEPSEEK_* / SILICONFLOW_* / SUPABASE_*。
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DS_KEY = process.env.DEEPSEEK_API_KEY;
const DS_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/+$/, "");
const DS_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const SYSTEM = `你是「济和癌症国际就医参谋」，只做信息梳理与中立对比，绝不下诊断，绝不给出「值不值得去印度/出国」这类倾向性结论。只把国内标准路径、国际指南要点、可及性与费用客观并列，让患者和其主治医生自行判断。输出用小标题分段：【情况梳理】【国内标准路径与大致成本】【国际指南要点与其它地区可及性】【信息缺口与下一步】。不要输出免责声明。`;

// 示例病例
const patient = {
  cancer_type: "非小细胞肺癌",
  subtype: "EGFR Exon20ins 突变",
  stage: "IV 期（转移性）",
  report_text: "病理：肺腺癌；基因检测：EGFR Exon20 插入突变；胸部CT示双肺多发结节，纵隔淋巴结转移。",
  prior_treatment: "一线含铂化疗4周期后进展",
  budget: "30-60万",
};

async function ds(messages, max = 1500) {
  const res = await fetch(`${DS_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DS_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: DS_MODEL, messages, max_tokens: max }),
  });
  if (!res.ok) throw new Error(`deepseek HTTP ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices[0].message.content;
}

async function sb(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return res.json();
}

(async () => {
  console.log("=== 步骤1：DeepSeek 结构化解析 ===");
  const parseRaw = await ds(
    [
      { role: "system", content: `从患者信息提取结构化字段，严格只输出JSON：{"cancer_type":"","subtype":"","stage":"","key_markers":"","prior_lines":""}` },
      { role: "user", content: JSON.stringify(patient) },
    ],
    400
  );
  const parsed = JSON.parse(parseRaw.replace(/```json\n?|\n?```/g, "").trim());
  console.log(JSON.stringify(parsed, null, 2));

  console.log("\n=== 步骤2：检索指南与医院（模拟：忽略 verified）===");
  const guidelines = await sb(
    `cancer_guidelines?cancer_type=ilike.*${encodeURIComponent(parsed.cancer_type)}*&select=cancer_type,subtype,stage,source,source_url,standard_treatment,china_availability,india_availability`
  );
  const hospitals = await sb(
    `india_hospitals?select=name,city,jci_accredited,specialties,intl_patient_contact`
  );
  const matched = hospitals.filter(
    (h) => Array.isArray(h.specialties) && h.specialties.some((s) => parsed.cancer_type.includes(s) || s.includes(parsed.cancer_type))
  );
  console.log(`匹配指南 ${guidelines.length} 条，匹配医院 ${matched.length} 家`);

  const refs = guidelines
    .map((g, i) => `资料${i + 1}（${g.source}）｜${g.cancer_type}/${g.subtype || ""}/${g.stage || ""}\n标准方案：${g.standard_treatment}\n中国可及性：${g.china_availability}\n其它地区可及性：${g.india_availability}\n来源：${g.source_url}`)
    .join("\n\n");

  console.log("\n=== 步骤3：DeepSeek 中立评估 ===");
  const report = await ds([
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: `患者：${JSON.stringify(parsed)}\n预算：${patient.budget}\n\n参考资料（仅用以下资料）：\n${refs}\n\n请做中立信息梳理与对比。`,
    },
  ]);
  console.log("\n" + report);

  console.log("\n=== 匹配到的印度医院 ===");
  matched.forEach((h) => console.log(`· ${h.name}（${h.city}）${h.jci_accredited ? "[JCI]" : ""} 擅长：${(h.specialties || []).join("、")}`));

  console.log("\n【免责声明】以上由 AI 依据公开指南整理，仅供参考，请以持证医生诊断为准。");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
