import { TestTemplate } from '../types';

export const BATCH2_TEST_TEMPLATES: TestTemplate[] = [
  // 99. Malaria Parasite Dual Antigen
  {
    id: 'tmpl-mp-dual-99',
    testCode: 'MP-DUAL-99',
    testName: 'Malaria Parasite Dual Antigen',
    category: 'Hematology',
    sampleType: 'EDTA Whole Blood (Lavender Top 2 ml) / Fingerstick Whole Blood',
    sampleTubeColor: 'purple',
    price: 300,
    tatHours: 2,
    description: 'Rapid immunochromatographic qualitative test for the simultaneous differential detection of Plasmodium falciparum Histidine-Rich Protein II (HRP-II) and Pan-Plasmodium / Plasmodium vivax Lactate Dehydrogenase (pLDH) antigens.',
    specimenPrep: 'No fasting required. Venipuncture or capillary fingerstick blood collected in EDTA tube. Test promptly.',
    clinicalSignificance: 'Rapid differential diagnosis of acute malaria caused by P. falciparum and non-falciparum (P. vivax, P. malariae, P. ovale) species, critical for prompt antimalarial initiation.',
    parameters: [
      { id: 'p-mp-dual-pf', name: 'Malaria P. falciparum Antigen (HRP-2)', unit: 'Result', refRangeText: 'Negative / Non-Reactive', method: 'Immunochromatography' },
      { id: 'p-mp-dual-pv', name: 'Malaria Pan / P. vivax Antigen (pLDH)', unit: 'Result', refRangeText: 'Negative / Non-Reactive', method: 'Immunochromatography' },
      { id: 'p-mp-dual-ctrl', name: 'Test Control Band Validity', unit: 'Status', refRangeText: 'Valid (Internal Quality Control passed)', method: 'Visual Membrane Flow' },
    ],
  },

  // 100. Malarial Parasites by Peripheral Smear (PS for MP), EDTA Blood
  {
    id: 'tmpl-mp-smear-100',
    testCode: 'MP-SMEAR-100',
    testName: 'Malarial Parasites by Peripheral Smear (PS for MP), EDTA Blood',
    category: 'Hematology',
    sampleType: 'EDTA Whole Blood (Lavender Top 2 ml)',
    sampleTubeColor: 'purple',
    price: 200,
    tatHours: 3,
    description: 'Microscopic examination of Romanowsky/Giemsa-stained thick and thin blood films under 1000x oil immersion for morphological identification and parasitemia staging of Plasmodium species.',
    specimenPrep: 'Prepare thick and thin smears immediately following blood collection to preserve parasite morphology and avoid anticoagulant artifacts.',
    clinicalSignificance: 'Gold standard confirmatory method for malaria species identification (P. vivax, P. falciparum, P. malariae, P. ovale), parasite density calculation, and monitoring therapeutic response.',
    parameters: [
      { id: 'p-psmp-thick', name: 'Thick Blood Smear Examination (Screening)', unit: 'Result', refRangeText: 'No Malarial Parasites seen in 100 oil immersion fields', method: 'Giemsa Stained Microscopy' },
      { id: 'p-psmp-thin', name: 'Thin Blood Smear (Species Identification)', unit: 'Result', refRangeText: 'No asexual forms (ring, trophozoite, schizont, gametocyte) seen', method: 'Leishman / Giemsa Stained Microscopy' },
      { id: 'p-psmp-density', name: 'Parasite Density / Parasitemia Index', unit: 'Parasites/µL', refRangeText: 'Nil Detected (< 10 parasites/µL)', method: 'Microscopic Count against 200 WBCs' },
    ],
  },

  // 101. Phosphorous, Serum
  {
    id: 'tmpl-phos-101',
    testCode: 'PHOS-101',
    testName: 'Phosphorous, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 250,
    tatHours: 4,
    description: 'Quantitative measurement of inorganic phosphorus (phosphate) in human serum.',
    specimenPrep: 'Overnight fasting (8-10 hours) preferred. Separate serum from red cells within 1 hour to prevent phosphate leakage from erythrocytes.',
    clinicalSignificance: 'Essential for evaluating parathyroid disorders (hyperparathyroidism, hypoparathyroidism), chronic kidney disease (CKD-MBD), vitamin D disorders, and bone metabolism.',
    parameters: [
      { id: 'p-phos-val', name: 'Phosphorus (Inorganic Phosphate), Serum', unit: 'mg/dL', refRangeMin: 2.5, refRangeMax: 4.5, refRangeText: '2.5 - 4.5 (Adults) / 4.0 - 7.0 (Children)', method: 'Phosphomolybdate UV / Enzymatic', criticalLow: 1.0, criticalHigh: 8.0 },
    ],
  },

  // 102. Progesterone, Serum
  {
    id: 'tmpl-prog-102',
    testCode: 'PROG-102',
    testName: 'Progesterone, Serum',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 650,
    tatHours: 6,
    description: 'Quantitative chemiluminescent measurement of progesterone steroid hormone in serum.',
    specimenPrep: 'Specify clinical indication and phase of menstrual cycle (e.g., Mid-luteal / Day 21) or gestational age at sample collection.',
    clinicalSignificance: 'Assessing ovulation and corpus luteum function, evaluating luteal phase defects, monitoring early pregnancy viability, and ectopic pregnancy workup.',
    parameters: [
      { id: 'p-prog-val', name: 'Progesterone, Serum', unit: 'ng/mL', refRangeMin: 1.8, refRangeMax: 24.0, refRangeText: 'Follicular: 0.2 - 1.5 | Mid-Luteal: 5.0 - 24.0 | Postmenopausal: < 0.5 | 1st Trimester: 11.0 - 44.0', method: 'Chemiluminescence Immunoassay (CLIA)' },
    ],
  },

  // 103. Prolactin, Serum
  {
    id: 'tmpl-prl-103',
    testCode: 'PRL-103',
    testName: 'Prolactin, Serum',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 500,
    tatHours: 5,
    description: 'Quantitative measurement of anterior pituitary hormone prolactin in serum.',
    specimenPrep: 'Collect resting morning sample (patient awake for at least 2 hours, rested 30 minutes before venipuncture). Minimize stress.',
    clinicalSignificance: 'Evaluation of hyperprolactinemia, pituitary adenomas (prolactinomas), galactorrhea, amenorrhea, oligomenorrhea, female infertility, and male hypogonadism/gynecomastia.',
    parameters: [
      { id: 'p-prl-val', name: 'Prolactin, Serum', unit: 'ng/mL', refRangeMin: 4.8, refRangeMax: 23.3, refRangeText: 'Non-pregnant Females: 4.8 - 23.3 | Males: 4.0 - 15.2 | Postmenopausal: 1.8 - 20.3', method: 'Chemiluminescent Microparticle Immunoassay (CMIA)', criticalHigh: 100.0 },
    ],
  },

  // 104. Protein, 24 Hours, Urine
  {
    id: 'tmpl-prot24-104',
    testCode: 'PROT24-104',
    testName: 'Protein, 24 Hours, Urine',
    category: 'Biochemistry',
    sampleType: '24-Hour Urine Collection (Container without preservatives, 2.5L)',
    sampleTubeColor: 'yellow',
    price: 400,
    tatHours: 6,
    description: 'Quantitative determination of total protein excreted in a timed 24-hour urine collection.',
    specimenPrep: 'Discard first morning urine on day 1. Collect all urine voided over the next 24 hours including first morning void on day 2. Keep refrigerated.',
    clinicalSignificance: 'Definitive quantification of proteinuria for diagnosing nephrotic syndrome, pre-eclampsia, diabetic nephropathy, glomerulonephritis, and monitoring renal therapeutic response.',
    parameters: [
      { id: 'p-prot24-vol', name: '24-Hour Urine Total Volume', unit: 'mL/24hr', refRangeMin: 800, refRangeMax: 2000, refRangeText: '800 - 2000', method: 'Volumetric Measurement' },
      { id: 'p-prot24-conc', name: 'Urine Protein Concentration', unit: 'mg/dL', refRangeMin: 1.0, refRangeMax: 14.0, refRangeText: '< 14.0', method: 'Pyrogallol Red-Molybdate Colorimetric' },
      { id: 'p-prot24-tot', name: 'Total 24-Hour Protein Excretion', unit: 'mg/24hr', refRangeMin: 30.0, refRangeMax: 150.0, refRangeText: '< 150.0 (Normal) | 150 - 500 (Mild) | 500 - 3000 (Moderate) | > 3500 (Nephrotic Range)', method: 'Calculated (Concentration × Volume / 100)', criticalHigh: 3500.0 },
    ],
  },

  // 105. Rheumatoid Factor (RA), Serum
  {
    id: 'tmpl-ra-105',
    testCode: 'RA-105',
    testName: 'Rheumatoid Factor (RA), Serum',
    category: 'Immunology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 450,
    tatHours: 4,
    description: 'Quantitative measurement of IgM antibodies directed against the Fc region of human IgG (Rheumatoid Factor).',
    specimenPrep: 'Standard venipuncture. Serum separated within 2 hours. Avoid gross lipemia and hemolysis.',
    clinicalSignificance: 'Diagnostic and prognostic classification of Rheumatoid Arthritis (RA) and Sjögren syndrome; differentiating inflammatory from degenerative arthropathies.',
    parameters: [
      { id: 'p-ra-val', name: 'Rheumatoid Factor (RF / RA Quantitative)', unit: 'IU/mL', refRangeMin: 0.0, refRangeMax: 14.0, refRangeText: '< 14.0 (Negative) | 14.0 - 20.0 (Borderline) | > 20.0 (Positive)', method: 'Immunoturbidimetry / Nephelometry' },
    ],
  },

  // 106. SGOT, Serum
  {
    id: 'tmpl-sgot-106',
    testCode: 'SGOT-106',
    testName: 'SGOT, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 180,
    tatHours: 3,
    description: 'Quantitative kinetic enzymatic determination of Aspartate Aminotransferase (AST / SGOT) in serum.',
    specimenPrep: 'Non-hemolyzed serum sample. Hemolysis causes falsely elevated levels due to high erythrocyte AST content.',
    clinicalSignificance: 'Evaluation of hepatocellular injury, acute viral and toxic hepatitis, alcoholic liver disease, myocardial injury, and skeletal muscle trauma.',
    parameters: [
      { id: 'p-sgot-val', name: 'SGOT / AST (Aspartate Aminotransferase)', unit: 'U/L', refRangeMin: 5.0, refRangeMax: 40.0, refRangeText: '5.0 - 40.0 (Males) / 5.0 - 35.0 (Females)', method: 'IFCC with Pyridoxal Phosphate Kinetic UV', criticalHigh: 500.0 },
    ],
  },

  // 107. SGPT, Serum
  {
    id: 'tmpl-sgpt-107',
    testCode: 'SGPT-107',
    testName: 'SGPT, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 180,
    tatHours: 3,
    description: 'Quantitative kinetic enzymatic determination of Alanine Aminotransferase (ALT / SGPT) in serum.',
    specimenPrep: 'Non-hemolyzed serum. Stable at 2-8°C for up to 3 days.',
    clinicalSignificance: 'Highly specific biomarker for hepatocellular parenchymal injury, acute and chronic viral hepatitis, NAFLD/NASH, and drug-induced hepatotoxicity.',
    parameters: [
      { id: 'p-sgpt-val', name: 'SGPT / ALT (Alanine Aminotransferase)', unit: 'U/L', refRangeMin: 5.0, refRangeMax: 45.0, refRangeText: '5.0 - 45.0 (Males) / 5.0 - 35.0 (Females)', method: 'IFCC without Pyridoxal Phosphate Kinetic UV', criticalHigh: 500.0 },
    ],
  },

  // 108. Sugar (Fasting, Blood), Plasma
  {
    id: 'tmpl-fbs-108',
    testCode: 'FBS-108',
    testName: 'Sugar (Fasting, Blood), Plasma',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma (Grey Top Sodium Fluoride / Potassium Oxalate 2 ml)',
    sampleTubeColor: 'gray',
    price: 90,
    tatHours: 2,
    description: 'Quantitative measurement of fasting blood glucose concentration in sodium fluoride preserved plasma.',
    specimenPrep: 'Strict 8 to 12 hours overnight fasting. Water permitted. Invert fluoride tube immediately to inhibit in vitro glycolysis.',
    clinicalSignificance: 'Primary screening and diagnosis of diabetes mellitus, impaired fasting glucose (pre-diabetes), and hypoglycemia.',
    parameters: [
      { id: 'p-fbs-val', name: 'Fasting Blood Sugar (Glucose)', unit: 'mg/dL', refRangeMin: 70.0, refRangeMax: 99.0, refRangeText: '70.0 - 99.0 (Normal) | 100.0 - 125.0 (Pre-Diabetes) | ≥ 126.0 (Diabetes)', method: 'Hexokinase / GOD-POD Enzymatic', criticalLow: 50.0, criticalHigh: 350.0 },
    ],
  },

  // 109. Sugar (Post Prandial, Blood), Plasma
  {
    id: 'tmpl-ppbs-109',
    testCode: 'PPBS-109',
    testName: 'Sugar (Post Prandial, Blood), Plasma',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma (Grey Top Sodium Fluoride / Potassium Oxalate 2 ml)',
    sampleTubeColor: 'gray',
    price: 90,
    tatHours: 2,
    description: 'Quantitative measurement of post-prandial blood glucose exactly 2 hours after the start of a meal.',
    specimenPrep: 'Collect blood sample exactly 2 hours after starting a standard meal. Avoid vigorous exercise during the 2-hour waiting interval.',
    clinicalSignificance: 'Assessing post-prandial glycemic excursions, insulin sensitivity, glycemic control in diagnosed diabetic patients, and gestational diabetes screening.',
    parameters: [
      { id: 'p-ppbs-val', name: 'Post Prandial Blood Sugar (PPBS 2hr)', unit: 'mg/dL', refRangeMin: 70.0, refRangeMax: 139.0, refRangeText: '< 140.0 (Normal) | 140.0 - 199.0 (Impaired Glucose Tolerance) | ≥ 200.0 (Diabetes)', method: 'Hexokinase / GOD-POD Enzymatic', criticalHigh: 400.0 },
    ],
  },

  // 110. Sugar (Random Blood), Plasma
  {
    id: 'tmpl-rbs-110',
    testCode: 'RBS-110',
    testName: 'Sugar (Random Blood), Plasma',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma (Grey Top Sodium Fluoride / Potassium Oxalate 2 ml)',
    sampleTubeColor: 'gray',
    price: 90,
    tatHours: 1,
    description: 'Quantitative measurement of blood glucose drawn at any random time regardless of meal status.',
    specimenPrep: 'Can be collected at any time. Note time of last meal on lab requisition slip.',
    clinicalSignificance: 'Rapid triage evaluation of suspected acute hypoglycemia, diabetic ketoacidosis (DKA), hyperosmolar hyperglycemic state (HHS), or acute diabetes screening.',
    parameters: [
      { id: 'p-rbs-val', name: 'Random Blood Sugar (RBS)', unit: 'mg/dL', refRangeMin: 70.0, refRangeMax: 140.0, refRangeText: '70.0 - 140.0 (Normal) | ≥ 200.0 with symptoms indicative of Diabetes', method: 'Hexokinase / GOD-POD Enzymatic', criticalLow: 50.0, criticalHigh: 400.0 },
    ],
  },

  // 111. Testosterone, Total, Serum
  {
    id: 'tmpl-testo-111',
    testCode: 'TESTO-111',
    testName: 'Testosterone, Total, Serum',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 600,
    tatHours: 5,
    description: 'Quantitative determination of total testosterone (circulating free plus protein-bound testosterone) in serum.',
    specimenPrep: 'Early morning fasting collection (between 7:00 AM and 10:00 AM) strongly recommended due to pronounced diurnal variation.',
    clinicalSignificance: 'Investigation of hypogonadism, delayed puberty, erectile dysfunction in males; workup of PCOS, hirsutism, virilization, and ovarian/adrenal tumors in females.',
    parameters: [
      { id: 'p-testo-val', name: 'Testosterone, Total', unit: 'ng/dL', refRangeMin: 240.0, refRangeMax: 870.0, refRangeText: 'Adult Males (18-49y): 240.0 - 870.0 | Adult Females: 15.0 - 70.0', method: 'Chemiluminescence Immunoassay (CLIA)' },
    ],
  },

  // 112. Thyroid - Anti TPO (Thyroid Peroxidase) / Antithyroid Microsomal Antibody, Serum
  {
    id: 'tmpl-antitpo-112',
    testCode: 'ANTITPO-112',
    testName: 'Thyroid - Anti TPO (Thyroid Peroxidase) / Antithyroid Microsomal Antibody, Serum',
    category: 'Immunology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 800,
    tatHours: 6,
    description: 'Quantitative measurement of autoantibodies directed against thyroid peroxidase (TPO) enzyme in serum.',
    specimenPrep: 'Non-hemolyzed, non-lipemic serum. Fasting not strictly required.',
    clinicalSignificance: 'Hallmark serological marker for Hashimoto thyroiditis, autoimmune thyroiditis, postpartum thyroiditis, and distinguishing autoimmune from non-autoimmune subclinical hypothyroidism.',
    parameters: [
      { id: 'p-antitpo-val', name: 'Anti-Thyroid Peroxidase (Anti-TPO) Antibody', unit: 'IU/mL', refRangeMin: 0.0, refRangeMax: 34.0, refRangeText: '< 34.0 (Negative) | 34.0 - 50.0 (Equivocal) | > 50.0 (Positive)', method: 'Chemiluminescent Immunoassay (CLIA)' },
    ],
  },

  // 113. Free T3
  {
    id: 'tmpl-ft3-113',
    testCode: 'FT3-113',
    testName: 'Free T3',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 350,
    tatHours: 4,
    description: 'Quantitative measurement of the unbound, biologically active fraction of triiodothyronine (Free T3) in human serum.',
    specimenPrep: 'Morning fasting sample preferred. If patient is on thyroid medications, draw blood prior to morning dose.',
    clinicalSignificance: 'Evaluation of hyperthyroidism, T3 thyrotoxicosis, peripheral conversion defects, and non-thyroidal illness syndrome (euthyroid sick syndrome).',
    parameters: [
      { id: 'p-ft3-val', name: 'Free Triiodothyronine (FT3)', unit: 'pg/mL', refRangeMin: 2.0, refRangeMax: 4.4, refRangeText: '2.0 - 4.4', method: 'Chemiluminescence Immunoassay (CLIA)' },
    ],
  },

  // 114. Free T4
  {
    id: 'tmpl-ft4-114',
    testCode: 'FT4-114',
    testName: 'Free T4',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 350,
    tatHours: 4,
    description: 'Quantitative measurement of the unbound, biologically active fraction of thyroxine (Free T4) in serum, unaffected by TBG variations.',
    specimenPrep: 'Morning collection before thyroid hormone replacement dosage. Fasting preferred.',
    clinicalSignificance: 'Accurate evaluation of thyroid gland function in patients with altered thyroid binding globulin (pregnancy, oral contraceptives, nephrotic syndrome); central vs primary hypothyroidism.',
    parameters: [
      { id: 'p-ft4-val', name: 'Free Thyroxine (FT4)', unit: 'ng/dL', refRangeMin: 0.82, refRangeMax: 1.77, refRangeText: '0.82 - 1.77', method: 'Chemiluminescence Immunoassay (CLIA)' },
    ],
  },

  // 115. Thyroid - Thyroid Stimulating Hormone (TSH), Serum
  {
    id: 'tmpl-tsh-115',
    testCode: 'TSH-115',
    testName: 'Thyroid - Thyroid Stimulating Hormone (TSH), Serum',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 250,
    tatHours: 4,
    description: 'Ultra-sensitive 3rd generation quantitative chemiluminescent measurement of thyroid stimulating hormone (Thyrotropin) in serum.',
    specimenPrep: 'Morning collection between 8:00 AM and 10:00 AM preferred due to circadian TSH peak. Biotin supplements should be avoided 48h prior.',
    clinicalSignificance: 'First-line screening test for suspected primary hypothyroidism, subclinical hypothyroidism, and hyperthyroidism; monitoring levothyroxine dose titration.',
    parameters: [
      { id: 'p-tsh-val', name: 'TSH - 3rd Generation Ultra-Sensitive', unit: 'µIU/mL', refRangeMin: 0.35, refRangeMax: 4.94, refRangeText: '0.35 - 4.94 (Adults) | 0.2 - 2.5 (1st Trimester Pregnancy)', method: 'Chemiluminescence (CLIA) 3rd Generation', criticalLow: 0.01, criticalHigh: 20.0 },
    ],
  },

  // 116. Thyroid - Thyroxine (T4), Serum
  {
    id: 'tmpl-t4-116',
    testCode: 'T4-116',
    testName: 'Thyroid - Thyroxine (T4), Serum',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 200,
    tatHours: 4,
    description: 'Quantitative measurement of Total Thyroxine (T4, total bound plus free) in serum.',
    specimenPrep: 'Morning fasting sample preferred. Note if patient is pregnant or on estrogen/contraceptive therapy.',
    clinicalSignificance: 'Assessing thyroid status, diagnosing hypothyroidism and hyperthyroidism, and monitoring response to antithyroid drug therapy.',
    parameters: [
      { id: 'p-t4-val', name: 'Total Thyroxine (Total T4)', unit: 'µg/dL', refRangeMin: 4.87, refRangeMax: 11.72, refRangeText: '4.87 - 11.72', method: 'Chemiluminescence Immunoassay (CLIA)' },
    ],
  },

  // 117. Thyroid - Tri lodo Thyronine (T3 Total), Serum
  {
    id: 'tmpl-t3-117',
    testCode: 'T3-117',
    testName: 'Thyroid - Tri lodo Thyronine (T3 Total), Serum',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 200,
    tatHours: 4,
    description: 'Quantitative determination of Total Triiodothyronine (T3, total bound plus free) in serum.',
    specimenPrep: 'Standard serum sample. Fasting preferred.',
    clinicalSignificance: 'Evaluating suspected hyperthyroidism, T3-toxicosis (elevated T3 with normal T4), and assessing severity of toxic nodular goiter.',
    parameters: [
      { id: 'p-t3-val', name: 'Total Triiodothyronine (Total T3)', unit: 'ng/dL', refRangeMin: 80.0, refRangeMax: 200.0, refRangeText: '80.0 - 200.0 (0.80 - 2.00 ng/mL)', method: 'Chemiluminescence Immunoassay (CLIA)' },
    ],
  },

  // 118. Typhi Dot IgG Antibody, Serum
  {
    id: 'tmpl-tdot-igg-118',
    testCode: 'TDOT-IGG-118',
    testName: 'Typhi Dot IgG Antibody, Serum',
    category: 'Serology',
    sampleType: 'Serum (Plain Clot Tube 3 ml)',
    sampleTubeColor: 'red',
    price: 250,
    tatHours: 3,
    description: 'Rapid qualitative immunochromatographic / dot enzyme immunoassay for specific IgG antibodies against the 50 kD outer membrane protein (OMP) of Salmonella enterica serotype Typhi.',
    specimenPrep: 'Clean venipuncture. Serum separated within 2 hours.',
    clinicalSignificance: 'Indicates past typhoid infection, convalescence, or reinfection; aids in retrospective enteric fever diagnosis and differential diagnosis of persistent pyrexia.',
    parameters: [
      { id: 'p-tdot-igg-val', name: 'Typhidot IgG Antibody', unit: 'Result', refRangeText: 'Negative / Non-Reactive', method: 'Dot Enzyme Immunoassay (Dot-EIA) / Rapid Lateral Flow' },
      { id: 'p-tdot-igg-interp', name: 'Clinical Interpretation', unit: 'Interpretation', refRangeText: 'Negative indicates no past or convalescent immune response to S. typhi OMP.', method: 'Qualitative Assessment' },
    ],
  },

  // 119. Typhi Dot IgM Antibody Serum
  {
    id: 'tmpl-tdot-igm-119',
    testCode: 'TDOT-IGM-119',
    testName: 'Typhi Dot IgM Antibody Serum',
    category: 'Serology',
    sampleType: 'Serum (Plain Clot Tube 3 ml)',
    sampleTubeColor: 'red',
    price: 250,
    tatHours: 3,
    description: 'Rapid qualitative dot enzyme immunoassay detecting specific IgM antibodies against Salmonella typhi 50 kD outer membrane protein (OMP) antigen in early enteric fever.',
    specimenPrep: 'Sample can be drawn as early as day 2 to 3 of acute sustained fever.',
    clinicalSignificance: 'Sensitive marker of acute, early enteric (typhoid) fever before conventional Widal agglutination titers become significant (turns positive earlier than Widal).',
    parameters: [
      { id: 'p-tdot-igm-val', name: 'Typhidot IgM Antibody', unit: 'Result', refRangeText: 'Negative / Non-Reactive', method: 'Dot Enzyme Immunoassay (Dot-EIA) / Rapid Lateral Flow' },
      { id: 'p-tdot-igm-interp', name: 'Clinical Interpretation', unit: 'Interpretation', refRangeText: 'Negative indicates no detectable acute IgM antibodies against S. typhi.', method: 'Qualitative Assessment' },
    ],
  },

  // 120. TORCH Panel GRP
  {
    id: 'tmpl-torch-120',
    testCode: 'TORCH-120',
    testName: 'TORCH Panel GRP',
    category: 'Serology',
    sampleType: 'Serum (SST Gel Clot Tube 4 ml)',
    sampleTubeColor: 'gold',
    price: 1800,
    tatHours: 8,
    description: 'Comprehensive 10-parameter serological IgG and IgM antibody profile against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Virus 1 & 2 (HSV-1 & HSV-2).',
    specimenPrep: 'Non-hemolyzed fasting or non-fasting serum. Essential prenatal baseline or congenital anomaly workup.',
    clinicalSignificance: 'Antenatal screening for maternal infections capable of crossing the placenta and causing congenital anomalies, intrauterine growth restriction (IUGR), hydrops fetalis, or spontaneous miscarriage.',
    parameters: [
      { id: 'p-toxo-igg', name: 'Toxoplasma gondii IgG Antibody', unit: 'IU/mL', refRangeMin: 0.0, refRangeMax: 7.2, refRangeText: '< 7.2 (Negative) | 7.2 - 8.8 (Equivocal) | > 8.8 (Positive)', method: 'CLIA / ELISA' },
      { id: 'p-toxo-igm', name: 'Toxoplasma gondii IgM Antibody', unit: 'Index', refRangeMin: 0.0, refRangeMax: 0.8, refRangeText: '< 0.8 (Negative) | 0.8 - 1.0 (Equivocal) | > 1.0 (Positive)', method: 'CLIA / ELISA' },
      { id: 'p-rub-igg', name: 'Rubella Virus IgG Antibody (Immunity)', unit: 'IU/mL', refRangeMin: 0.0, refRangeMax: 10.0, refRangeText: '< 10.0 (Non-Immune) | ≥ 10.0 (Immune / Protective)', method: 'CLIA / ELISA' },
      { id: 'p-rub-igm', name: 'Rubella Virus IgM Antibody (Acute)', unit: 'Index', refRangeMin: 0.0, refRangeMax: 0.8, refRangeText: '< 0.8 (Negative) | 0.8 - 1.0 (Borderline) | > 1.0 (Positive)', method: 'CLIA / ELISA' },
      { id: 'p-cmv-igg', name: 'Cytomegalovirus (CMV) IgG Antibody', unit: 'U/mL', refRangeMin: 0.0, refRangeMax: 12.0, refRangeText: '< 12.0 (Negative) | ≥ 14.0 (Positive - Past Exposure)', method: 'CLIA / ELISA' },
      { id: 'p-cmv-igm', name: 'Cytomegalovirus (CMV) IgM Antibody (Acute)', unit: 'Index', refRangeMin: 0.0, refRangeMax: 0.7, refRangeText: '< 0.7 (Negative) | 0.7 - 1.0 (Equivocal) | > 1.0 (Positive)', method: 'CLIA / ELISA' },
      { id: 'p-hsv1-igg', name: 'Herpes Simplex Virus 1 (HSV-1) IgG', unit: 'Index', refRangeMin: 0.0, refRangeMax: 0.9, refRangeText: '< 0.9 (Negative) | > 1.1 (Positive)', method: 'CLIA / ELISA' },
      { id: 'p-hsv1-igm', name: 'Herpes Simplex Virus 1 (HSV-1) IgM', unit: 'Index', refRangeMin: 0.0, refRangeMax: 0.9, refRangeText: '< 0.9 (Negative) | > 1.1 (Positive)', method: 'CLIA / ELISA' },
      { id: 'p-hsv2-igg', name: 'Herpes Simplex Virus 2 (HSV-2) IgG', unit: 'Index', refRangeMin: 0.0, refRangeMax: 0.9, refRangeText: '< 0.9 (Negative) | > 1.1 (Positive)', method: 'CLIA / ELISA' },
      { id: 'p-hsv2-igm', name: 'Herpes Simplex Virus 2 (HSV-2) IgM', unit: 'Index', refRangeMin: 0.0, refRangeMax: 0.9, refRangeText: '< 0.9 (Negative) | > 1.1 (Positive)', method: 'CLIA / ELISA' },
    ],
  },

  // 121. Urea, Serum
  {
    id: 'tmpl-urea-121',
    testCode: 'UREA-121',
    testName: 'Urea, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 150,
    tatHours: 3,
    description: 'Quantitative enzymatic determination of urea in serum.',
    specimenPrep: 'Avoid excessive dietary protein surge 24 hours prior. Non-hemolyzed serum.',
    clinicalSignificance: 'Assessing glomerular filtration and renal clearance, diagnosing pre-renal azotemia, dehydration, gastrointestinal hemorrhage, and chronic renal insufficiency.',
    parameters: [
      { id: 'p-urea-val', name: 'Urea, Serum', unit: 'mg/dL', refRangeMin: 15.0, refRangeMax: 40.0, refRangeText: '15.0 - 40.0', method: 'Urease-GLDH Enzymatic Kinetic UV', criticalHigh: 150.0 },
    ],
  },

  // 122. Uric Acid, Serum
  {
    id: 'tmpl-uric-122',
    testCode: 'URIC-122',
    testName: 'Uric Acid, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gel Clot Tube 3.5 ml)',
    sampleTubeColor: 'gold',
    price: 180,
    tatHours: 3,
    description: 'Quantitative measurement of uric acid (the major end-product of purine catabolism) in serum.',
    specimenPrep: 'Overnight fasting 8-10 hours recommended. Avoid alcohol consumption 24 hours prior.',
    clinicalSignificance: 'Diagnosis and management of gout, hyperuricemia, renal calculi (uric acid stones), monitoring tumor lysis syndrome in chemotherapy, and toxemia of pregnancy.',
    parameters: [
      { id: 'p-uric-val', name: 'Uric Acid, Serum', unit: 'mg/dL', refRangeMin: 3.5, refRangeMax: 7.2, refRangeText: '3.5 - 7.2 (Males) / 2.6 - 6.0 (Females)', method: 'Uricase / PAP Enzymatic Colorimetric', criticalHigh: 12.0 },
    ],
  },

  // 123. Widal test (Slide Method), Serum
  {
    id: 'tmpl-widal-123',
    testCode: 'WIDAL-123',
    testName: 'Widal test (Slide Method), Serum',
    category: 'Serology',
    sampleType: 'Serum (Plain Clot Tube 3 ml)',
    sampleTubeColor: 'red',
    price: 180,
    tatHours: 2,
    description: 'Rapid semiquantitative slide agglutination test for detecting agglutinating somatic "O" and flagellar "H" antibodies against Salmonella typhi and Salmonella paratyphi A & B.',
    specimenPrep: 'Collect after 7-10 days of sustained fever when antibody titers reach diagnostic thresholds. Clear unhemolyzed serum.',
    clinicalSignificance: 'Rapid screen for enteric fever (Typhoid and Paratyphoid). Clinically significant diagnostic baseline titer in endemic regions is typically ≥ 1:160 for S. typhi O and H antigens.',
    parameters: [
      { id: 'p-widal-to', name: 'S. typhi "O" Somatic Antigen Titer', unit: 'Titer', refRangeText: '< 1:80 (Non-significant) | ≥ 1:160 (Clinically Significant)', method: 'Rapid Slide Agglutination' },
      { id: 'p-widal-th', name: 'S. typhi "H" Flagellar Antigen Titer', unit: 'Titer', refRangeText: '< 1:80 (Non-significant) | ≥ 1:160 (Clinically Significant)', method: 'Rapid Slide Agglutination' },
      { id: 'p-widal-ah', name: 'S. paratyphi "AH" Antigen Titer', unit: 'Titer', refRangeText: '< 1:80 (Non-significant)', method: 'Rapid Slide Agglutination' },
      { id: 'p-widal-bh', name: 'S. paratyphi "BH" Antigen Titer', unit: 'Titer', refRangeText: '< 1:80 (Non-significant)', method: 'Rapid Slide Agglutination' },
      { id: 'p-widal-interp', name: 'Slide Widal Impression', unit: 'Result', refRangeText: 'Negative / Non-significant agglutination', method: 'Semiquantitative Visual Slide Clumping' },
    ],
  },
];
