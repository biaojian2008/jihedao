-- 印度肿瘤医院种子数据（公开信息）
-- ⚠️ 全部 verified=false：以下为公开资料整理，未经人工核实，不对患者展示。
--    运营者须核对官网/信源后在后台「核实通过」，患者端才会出现。
-- ⚠️ specialties 用较宽的癌种词，便于与指南 cancer_type 模糊匹配。
-- 执行前需先建表（20260727_cancer_intl_care.sql 或 repair）。

insert into india_hospitals
  (name, city, jci_accredited, specialties, cost_range, reputation_score, intl_patient_contact, source_url, verified)
values
  (
    'Tata Memorial Hospital', 'Mumbai', false,
    array['肺癌','乳腺癌','结直肠癌','肝癌','血液肿瘤','头颈肿瘤'],
    '{"note":"公立肿瘤专科，费用在印度属偏低，具体以医院国际部报价为准"}'::jsonb,
    null, 'https://tmc.gov.in', 'https://tmc.gov.in', false
  ),
  (
    'Apollo Cancer Centre', 'Chennai', true,
    array['肺癌','乳腺癌','结直肠癌','肝癌','前列腺癌'],
    '{"note":"私立集团，JCI 认证，靶向/免疫/质子治疗可及"}'::jsonb,
    null, 'https://www.apollohospitals.com', 'https://www.apollohospitals.com', false
  ),
  (
    'Fortis Memorial Research Institute', 'Gurugram', true,
    array['肺癌','乳腺癌','结直肠癌','血液肿瘤','骨髓移植'],
    '{"note":"私立，JCI 认证，国际患者部成熟"}'::jsonb,
    null, 'https://www.fortishealthcare.com', 'https://www.fortishealthcare.com', false
  ),
  (
    'Max Super Speciality Hospital (Saket)', 'New Delhi', true,
    array['肺癌','乳腺癌','结直肠癌','肝癌'],
    '{"note":"私立集团，肿瘤科完整，费用中等"}'::jsonb,
    null, 'https://www.maxhealthcare.in', 'https://www.maxhealthcare.in', false
  ),
  (
    'Medanta – The Medicity', 'Gurugram', true,
    array['肺癌','结直肠癌','肝癌','血液肿瘤','骨髓移植'],
    '{"note":"私立综合，JCI 认证，肝胆与移植较强"}'::jsonb,
    null, 'https://www.medanta.org', 'https://www.medanta.org', false
  ),
  (
    'HCG Cancer Centre', 'Bengaluru', false,
    array['肺癌','乳腺癌','头颈肿瘤','结直肠癌'],
    '{"note":"肿瘤专科连锁，放疗设备较全"}'::jsonb,
    null, 'https://www.hcgoncology.com', 'https://www.hcgoncology.com', false
  ),
  (
    'Rajiv Gandhi Cancer Institute', 'New Delhi', false,
    array['肺癌','乳腺癌','结直肠癌','血液肿瘤'],
    '{"note":"肿瘤专科，公私结合，病例量大"}'::jsonb,
    null, 'https://www.rgcirc.org', 'https://www.rgcirc.org', false
  );
