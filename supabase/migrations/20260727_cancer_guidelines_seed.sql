-- 癌症指南种子数据（3–5 种常见癌症）
-- ⚠️ 全部 verified=false：以下摘要由 AI 依据公开指南整理，未经人工核实，不对患者展示。
--    运营者须对照 source_url 原文逐条复核，确认后在后台置 verified=true、填 verified_at。
-- ⚠️ 版权：standard_treatment 仅为「事实要点摘要」，非 NCCN/ESMO 原文；详情以 source_url 为准。
-- 执行前需先执行 20260727_cancer_intl_care.sql 建表。

insert into cancer_guidelines
  (cancer_type, subtype, stage, source, source_url, standard_treatment, survival_data, china_availability, india_availability, verified)
values
  (
    '非小细胞肺癌', 'EGFR 敏感突变', 'IV 期（转移性）', 'NCCN',
    'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1450',
    '一线首选 EGFR-TKI 靶向治疗（如奥希替尼等三代药）；进展后依据耐药机制（如 T790M / MET 扩增）调整。对症支持与多学科评估贯穿全程。',
    '{"note":"生存数据随药物与分层差异大，以原文与主治医生评估为准"}'::jsonb,
    '三代 TKI 已在中国上市并部分纳入医保；具体报销比例按地区医保目录。',
    '同类靶向药与仿制药在印度可及，价格通常显著低于原研；需核实药品来源与合法进口。',
    false
  ),
  (
    '非小细胞肺癌', 'EGFR Exon20ins 突变', 'IV 期（转移性）', 'ESMO',
    'https://www.esmo.org/guidelines/guidelines-by-topic/lung-and-chest-tumours',
    'Exon20ins 对常规 EGFR-TKI 反应较差；国际上有针对性药物（如 amivantamab、mobocertinib 相关方案，部分已调整）。方案选择需结合最新可及性。',
    '{"note":"该亚型进展快，方案更新频繁，务必以最新指南为准"}'::jsonb,
    '部分针对性药物在中国上市滞后或未纳入医保，可及性有限。',
    '部分药物在印度可及性与价格具优势，是常见的跨境就医动因之一；须核实合法渠道。',
    false
  ),
  (
    '乳腺癌', 'HER2 阳性', 'II–III 期', 'CSCO',
    'https://www.csco.org.cn',
    '以抗 HER2 靶向治疗（曲妥珠单抗 ± 帕妥珠单抗）联合化疗为骨架，结合手术与放疗；新辅助/辅助按分期与病理反应决定。',
    '{"5y_note":"HER2+ 早中期经规范治疗预后较好，具体以分期与病理为准"}'::jsonb,
    '曲妥珠单抗等已在中国上市并有医保覆盖及生物类似药。',
    '抗 HER2 生物类似药在印度可及且价格较低；早中期通常国内即可规范治疗，跨境需求相对较弱。',
    false
  ),
  (
    '结直肠癌', 'RAS 野生型', 'IV 期（转移性）', 'NCCN',
    'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1428',
    '化疗（FOLFOX/FOLFIRI 等）联合靶向（RAS 野生型左半可考虑抗 EGFR，如西妥昔单抗；或抗血管生成）；可切除转移灶评估手术。',
    '{"note":"分子分型与原发部位影响靶向选择"}'::jsonb,
    '主流化疗与靶向药中国均可及，多数纳入医保。',
    '化疗与靶向仿制药在印度价格较低；国内可及性已较好，跨境主要出于费用考量。',
    false
  ),
  (
    '肝细胞癌', NULL, 'III–IV 期（中晚期）', 'ESMO',
    'https://www.esmo.org/guidelines/guidelines-by-topic/gastrointestinal-cancers',
    '中晚期以系统治疗为主（免疫联合抗血管生成，如阿替利珠单抗+贝伐珠单抗等），结合局部治疗（TACE/消融）按肝功能与分期综合决策。',
    '{"note":"肝功能 Child-Pugh 分级显著影响可选方案"}'::jsonb,
    '主流免疫与靶向方案中国可及，部分纳入医保。',
    '免疫与靶向药在印度可及性与价格具优势；须核实药品合法性与随访衔接。',
    false
  );
