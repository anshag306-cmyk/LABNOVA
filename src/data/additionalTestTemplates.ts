import { TestTemplate } from '../types';

export const ADDITIONAL_TEST_TEMPLATES: TestTemplate[] = [
  // 66. Coagulation - APTT (Activated Partial Thromboplastin Time), Citrated P
  {
    id: 'tmpl-aptt-66',
    testCode: 'APTT-66',
    testName: 'Coagulation - APTT (Activated Partial Thromboplastin Time), Citrated P',
    category: 'Coagulation',
    sampleType: 'Citrated Plasma (Light Blue Top 3.2% Sodium Citrate 2.7 ml)',
    sampleTubeColor: 'blue',
    price: 450,
    tatHours: 3,
    description: 'Intrinsic and common coagulation pathway evaluation, measuring the time required for fibrin clot formation.',
    specimenPrep: 'Collect exact 9:1 blood to citrate ratio. Double centrifugation recommended to obtain platelet-poor plasma.',
    clinicalSignificance: 'Monitoring unfractionated heparin therapy, screening for intrinsic factor deficiencies (VIII, IX, XI, XII), and workup for lupus anticoagulant or unexplained bleeding.',
    parameters: [
      { id: 'p-aptt-pat', name: 'APTT (Patient Time)', unit: 'Seconds', refRangeMin: 26.0, refRangeMax: 36.0, refRangeText: '26.0 - 36.0', method: 'Photo-optical Clot Detection', criticalHigh: 70.0 },
      { id: 'p-aptt-ctrl', name: 'APTT (Control Time)', unit: 'Seconds', refRangeMin: 28.0, refRangeMax: 32.0, refRangeText: '28.0 - 32.0', method: 'Photo-optical Clot Detection' },
      { id: 'p-aptt-rat', name: 'APTT Ratio (Patient/Control)', unit: 'Ratio', refRangeMin: 0.85, refRangeMax: 1.15, refRangeText: '0.85 - 1.15', method: 'Calculated' },
    ],
  },

  // 67. Direct Coomb Test (DAT)
  {
    id: 'tmpl-coombs-dir-67',
    testCode: 'COOMBS-DIR-67',
    testName: 'Direct Coomb Test',
    category: 'Hematology',
    sampleType: 'EDTA Whole Blood (Lavender Top 2 ml)',
    sampleTubeColor: 'purple',
    price: 400,
    tatHours: 4,
    description: 'Direct Antiglobulin Test (DAT) detecting in vivo coating of patient red blood cells with antibodies (IgG) and/or complement components (C3d).',
    specimenPrep: 'Do not centrifuge or freeze. Deliver sample promptly to blood bank/hematology unit.',
    clinicalSignificance: 'Diagnosis of Autoimmune Hemolytic Anemia (AIHA), Hemolytic Disease of the Fetus and Newborn (HDFN), drug-induced immune hemolysis, and hemolytic transfusion reactions.',
    parameters: [
      { id: 'p-dct-res', name: 'Direct Antiglobulin Reaction (Polyspecific AHG)', unit: '', refRangeText: 'Negative', method: 'Column Agglutination Technology (CAT) / Tube Method' },
      { id: 'p-dct-igg', name: 'Anti-IgG Specific Reaction', unit: '', refRangeText: 'Negative', method: 'Column Agglutination' },
      { id: 'p-dct-c3d', name: 'Anti-C3d (Complement) Specific Reaction', unit: '', refRangeText: 'Negative', method: 'Column Agglutination' },
    ],
  },

  // 68. Coombs Test - Indirect (ICT), Serum
  {
    id: 'tmpl-coombs-ind-68',
    testCode: 'COOMBS-IND-68',
    testName: 'Coombs Test - Indirect (ICT), Serum',
    category: 'Hematology',
    sampleType: 'Serum (Plain Red Top 3 ml)',
    sampleTubeColor: 'red',
    price: 450,
    tatHours: 4,
    description: 'Indirect Antiglobulin Test (IAT) detecting circulating irregular, unexpected red cell antibodies free in patient serum.',
    specimenPrep: 'Standard venipuncture. Separate serum within 2 hours. Avoid hemolysis.',
    clinicalSignificance: 'Essential prenatal screening for Rh-negative pregnant women, pre-transfusion compatibility cross-matching, and evaluation of irregular erythrocyte alloantibodies.',
    parameters: [
      { id: 'p-ict-res', name: 'Indirect Antiglobulin Antibody Screen', unit: '', refRangeText: 'Negative', method: 'Column Agglutination Technology (CAT)' },
      { id: 'p-ict-titer', name: 'Antibody Titer (if reactive)', unit: 'Titer', refRangeText: 'Negative (< 1:2)', method: 'Doubling Dilution Agglutination' },
    ],
  },

  // 69. Creatinine, Serum
  {
    id: 'tmpl-creat-serum-69',
    testCode: 'CREAT-SERUM-69',
    testName: 'Creatinine, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (Plain Red / Gold SST 3 ml)',
    sampleTubeColor: 'amber',
    price: 200,
    tatHours: 3,
    description: 'Specific quantitative assay of serum creatinine to evaluate renal glomerular filtration rate and nitrogenous clearance.',
    specimenPrep: 'Overnight fasting preferred. Avoid strenuous physical exertion and creatine supplements 24 hours prior.',
    clinicalSignificance: 'Primary clinical indicator for diagnosis, staging, and longitudinal tracking of acute kidney injury and chronic kidney disease.',
    parameters: [
      { id: 'p-creat-ser', name: 'Serum Creatinine', unit: 'mg/dL', refRangeMin: 0.60, refRangeMax: 1.20, refRangeText: '0.60 - 1.20 (Male) | 0.50 - 1.00 (Female)', method: 'Enzymatic IDMS-Traceable / Modified Jaffe', criticalLow: 0.40, criticalHigh: 4.00 },
      { id: 'p-creat-egfr', name: 'Estimated GFR (eGFR - CKD-EPI 2021)', unit: 'mL/min/1.73m²', refRangeMin: 90.0, refRangeMax: 120.0, refRangeText: '≥ 90.0 (Normal / Stage 1)', method: 'CKD-EPI 2021 Equation' },
    ],
  },

  // 70. CPK
  {
    id: 'tmpl-cpk-tot-70',
    testCode: 'CPK-TOT-70',
    testName: 'CPK',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gold Top 3 ml)',
    sampleTubeColor: 'amber',
    price: 450,
    tatHours: 4,
    description: 'Quantitative determination of total Creatine Phosphokinase (CPK / CK) activity in serum.',
    specimenPrep: 'Avoid intramuscular injections and intense physical exercise 24 hours before phlebotomy.',
    clinicalSignificance: 'Assessment of skeletal muscle trauma, rhabdomyolysis, muscular dystrophies, polymyositis, and acute myocardial injury.',
    parameters: [
      { id: 'p-cpk-tot', name: 'Total CPK / Creatine Kinase (CK)', unit: 'U/L', refRangeMin: 26, refRangeMax: 192, refRangeText: '39 - 308 (Male) | 26 - 192 (Female)', method: 'IFCC UV Kinetic (NAC-Activated)', criticalHigh: 1000 },
    ],
  },

  // 71. Creatine Phosphokinase (CPK-MB), Serum
  {
    id: 'tmpl-cpk-mb-71',
    testCode: 'CPK-MB-71',
    testName: 'Creatine Phosphokinase (CPK-MB), Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gold Top 3 ml)',
    sampleTubeColor: 'amber',
    price: 600,
    tatHours: 3,
    description: 'Specific quantitative measurement of the MB myocardial isoenzyme of creatine phosphokinase.',
    specimenPrep: 'Collect immediately upon presentation with suspected acute coronary syndrome. Serial sampling at 3-6 hr intervals may be indicated.',
    clinicalSignificance: 'Cardiospecific enzyme evaluation for acute myocardial infarction, reinfarction detection, and perioperative myocardial necrosis assessment.',
    parameters: [
      { id: 'p-cpk-mb-act', name: 'CPK-MB Catalytic Activity', unit: 'U/L', refRangeMin: 0, refRangeMax: 25, refRangeText: '< 25.0 U/L', method: 'Immunoinhibition Kinetic UV', criticalHigh: 50 },
      { id: 'p-cpk-mb-mass', name: 'CPK-MB Mass Concentration', unit: 'ng/mL', refRangeMin: 0, refRangeMax: 5.0, refRangeText: '< 5.0 ng/mL', method: 'Chemiluminescent Immunoassay (CLIA)', criticalHigh: 10.0 },
      { id: 'p-cpk-mb-idx', name: 'Relative Index (CK-MB / Total CK)', unit: '%', refRangeMin: 0, refRangeMax: 3.0, refRangeText: '< 3.0% (Myocardial necrosis risk if > 5.0%)', method: 'Calculated' },
    ],
  },

  // 72. Aerobic Blood Culture (Bactec)
  {
    id: 'tmpl-bcult-aer-72',
    testCode: 'BCULT-AER-72',
    testName: 'Aerobic Blood Culture (Bactec)',
    category: 'Microbiology',
    sampleType: 'Whole Blood in Bactec Plus Aerobic Culture Bottle (8-10 ml)',
    sampleTubeColor: 'blue',
    price: 1200,
    tatHours: 72,
    description: 'Continuous automated fluorometric monitoring of blood specimens for recovery and isolation of aerobic and facultative anaerobic bacteremia/fungemia.',
    specimenPrep: 'Strict aseptic technique with chlorhexidine/alcohol skin antisepsis before venipuncture. Inoculate 8-10 mL blood into bottle. Keep at ambient temperature; do not refrigerate.',
    clinicalSignificance: 'Gold standard investigation for sepsis, infective endocarditis, catheter-associated bloodstream infections (CLABSI), and pyrexia of unknown origin (PUO).',
    parameters: [
      { id: 'p-bc-aer-mon', name: 'Automated Incubation & System', unit: '', refRangeText: 'Bactec Automated Continuous Fluorometric Monitoring (5 Days)', method: 'Continuous CO2 Sensor Detection' },
      { id: 'p-bc-aer-24h', name: 'Interim Status at 24 Hours', unit: '', refRangeText: 'No growth detected at 24 hours', method: 'Automated Sensor Detection' },
      { id: 'p-bc-aer-48h', name: 'Interim Status at 48 Hours', unit: '', refRangeText: 'No growth detected at 48 hours', method: 'Automated Sensor Detection' },
      { id: 'p-bc-aer-final', name: 'Final Aerobic Culture (5 Days)', unit: '', refRangeText: 'Sterile / No growth of aerobic bacteria at 5 days', method: 'Automated Continuous Monitoring' },
      { id: 'p-bc-aer-org', name: 'Organism Isolated', unit: '', refRangeText: 'None Isolated (Sterile)', method: 'MALDI-TOF / Automated VITEK 2' },
      { id: 'p-bc-aer-ast', name: 'Antibiotic Susceptibility', unit: '', refRangeText: 'Not Applicable (Sterile)', method: 'CLSI Standards / Automated MIC' },
    ],
  },

  // 73. Culture & Sensitivity, Pus
  {
    id: 'tmpl-cult-pus-73',
    testCode: 'CULT-PUS-73',
    testName: 'Culture & Sensitivity, Pus',
    category: 'Microbiology',
    sampleType: 'Pus Aspirate / Wound Swab in Sterile Container / Amies Transport Medium',
    sampleTubeColor: 'yellow',
    price: 800,
    tatHours: 48,
    description: 'Isolation, identification, and antibiogram susceptibility testing of pyogenic aerobic and facultative pathogens from purulent exudates and abscesses.',
    specimenPrep: 'Aspirate pus with sterile syringe whenever possible; collect from active base of wound after cleansing superficial contamination.',
    clinicalSignificance: 'Guiding targeted antimicrobial therapy in skin/soft tissue infections, postoperative surgical site infections, diabetic foot ulcers, and abscesses.',
    parameters: [
      { id: 'p-pus-gram', name: 'Direct Smear (Gram Stain)', unit: '', refRangeText: 'Occasional pus cells; no bacteria detected', method: 'Gram Stain High Power Microscopy' },
      { id: 'p-pus-cult', name: 'Aerobic Bacterial Culture (48h)', unit: '', refRangeText: 'No pathogenic bacterial growth after 48 hours incubation', method: 'Blood & MacConkey Agar Incubated at 37°C' },
      { id: 'p-pus-org', name: 'Pathogen Isolated', unit: '', refRangeText: 'None Isolated / Sterile', method: 'Biochemical / Automated VITEK 2' },
      { id: 'p-pus-ast', name: 'Antimicrobial Susceptibility (Antibiogram)', unit: '', refRangeText: 'Not Applicable (No pathogen isolated)', method: 'Kirby-Bauer Disc Diffusion (CLSI Guidelines)' },
    ],
  },

  // 74. Culture & Sensitivity, Sputum
  {
    id: 'tmpl-cult-spt-74',
    testCode: 'CULT-SPT-74',
    testName: 'Culture & Sensitivity, Sputum',
    category: 'Microbiology',
    sampleType: 'Early Morning Deep Cough Sputum (15 ml Sterile Cup)',
    sampleTubeColor: 'yellow',
    price: 850,
    tatHours: 48,
    description: 'Microscopic specimen validation (Bartlett criteria), bacteriological culture, and susceptibility testing of lower respiratory secretions.',
    specimenPrep: 'Rinse mouth with sterile water prior to collection. Instruct patient to cough deeply from the bronchial tree. Saliva is unacceptable.',
    clinicalSignificance: 'Identification of causative bacterial pathogens in community-acquired and hospital-acquired pneumonia, bronchiectasis, and chronic obstructive pulmonary exacerbations.',
    parameters: [
      { id: 'p-spt-bartlett', name: 'Specimen Quality Score (Bartlett Criteria)', unit: '', refRangeText: '> 25 PMNs, < 10 Epithelial cells/lpf (Representative deep sputum)', method: 'Gram Stain 100X Microscopy' },
      { id: 'p-spt-gram', name: 'Direct Gram Stain Finding', unit: '', refRangeText: 'Mixed respiratory commensal flora seen', method: 'Microscopy' },
      { id: 'p-spt-cult', name: 'Aerobic Sputum Culture (48 Hours)', unit: '', refRangeText: 'Normal respiratory commensal flora grown; no predominant pathogen', method: 'Blood, Chocolate & MacConkey Agar at 37°C' },
      { id: 'p-spt-org', name: 'Primary Pathogen Isolated', unit: '', refRangeText: 'None Isolated', method: 'Biochemical / Automated Panel' },
      { id: 'p-spt-ast', name: 'Antibiotic Sensitivity', unit: '', refRangeText: 'Not Applicable', method: 'CLSI Disc Diffusion Method' },
    ],
  },

  // 75. Culture and Senstivity, Urine
  {
    id: 'tmpl-cult-urn-75',
    testCode: 'CULT-URN-75',
    testName: 'Culture and Senstivity, Urine',
    category: 'Microbiology',
    sampleType: 'Midstream Clean Catch Urine in Sterile Container (15 ml)',
    sampleTubeColor: 'yellow',
    price: 750,
    tatHours: 48,
    description: 'Quantitative colony counting, phenotypic organism identification, and antibiotic susceptibility testing for urinary tract infections.',
    specimenPrep: 'Clean periurethral area prior to voiding. Collect middle portion of urine flow directly into sterile cup. Deliver to lab within 1 hour or refrigerate at 4°C.',
    clinicalSignificance: 'Definitive diagnosis of cystitis, pyelonephritis, asymptomatic bacteriuria in pregnancy, and catheter-associated urinary tract infections (CAUTI).',
    parameters: [
      { id: 'p-urn-pus', name: 'Sediment Wet Mount Pus Cells', unit: '/hpf', refRangeMin: 0, refRangeMax: 5, refRangeText: '0 - 5 /hpf', method: 'Centrifuged Sediment Microscopy' },
      { id: 'p-urn-count', name: 'Semiquantitative Colony Count', unit: 'CFU/mL', refRangeText: '< 10,000 CFU/mL (Not Significant)', method: 'Calibrated Loop Inoculation (0.001 mL)' },
      { id: 'p-urn-cult', name: 'Urine Culture (48 Hours at 37°C)', unit: '', refRangeText: 'No pathogenic bacterial growth after 48 hours incubation', method: 'CLED & Blood Agar Inoculation' },
      { id: 'p-urn-org', name: 'Uropathogen Isolated', unit: '', refRangeText: 'None Isolated / Sterile', method: 'Biochemical / Automated VITEK' },
      { id: 'p-urn-ast', name: 'Antimicrobial Sensitivity (Antibiogram)', unit: '', refRangeText: 'Not Applicable (Sterile)', method: 'Kirby-Bauer CLSI Disc Diffusion' },
    ],
  },

  // 76. Anaerobic Blood Culture (Bactec)
  {
    id: 'tmpl-bcult-ana-76',
    testCode: 'BCULT-ANA-76',
    testName: 'Anaerobic Blood Culture (Bactec)',
    category: 'Microbiology',
    sampleType: 'Whole Blood in Bactec Lytic Anaerobic Culture Bottle (8-10 ml)',
    sampleTubeColor: 'purple',
    price: 1400,
    tatHours: 120,
    description: 'Automated continuous fluorometric detection of obligate and facultative anaerobic bacteremia in blood specimens.',
    specimenPrep: 'Strict aseptic skin prep. Inoculate 8-10 mL whole blood directly into anaerobic bottle without introducing air. Maintain at room temperature.',
    clinicalSignificance: 'Investigation of deep intra-abdominal sepsis, gynecologic infections, necrotizing fasciitis, brain abscesses, and bacteremia caused by Bacteroides, Clostridium, or Fusobacterium.',
    parameters: [
      { id: 'p-bc-ana-sys', name: 'Automated Incubation System', unit: '', refRangeText: 'Bactec FX Continuous Fluorometric Monitoring (7 Days)', method: 'Continuous Infrared Sensor' },
      { id: 'p-bc-ana-48h', name: 'Interim Status at 48 Hours', unit: '', refRangeText: 'No anaerobic bacterial growth detected', method: 'Automated Monitoring' },
      { id: 'p-bc-ana-final', name: 'Final Anaerobic Culture (7 Days)', unit: '', refRangeText: 'Sterile - No anaerobic bacterial growth after 7 days incubation', method: 'Automated Continuous Sensing' },
      { id: 'p-bc-ana-org', name: 'Anaerobic Organism Isolated', unit: '', refRangeText: 'None Isolated (Sterile)', method: 'Anaerobic Identification Chamber' },
      { id: 'p-bc-ana-ast', name: 'Susceptibility', unit: '', refRangeText: 'Not Applicable (Sterile)', method: 'Broth Microdilution / E-Test' },
    ],
  },

  // 77. Culture & sensitivity, Aerobic bacteria, Throat Swab
  {
    id: 'tmpl-cult-thr-77',
    testCode: 'CULT-THR-77',
    testName: 'Culture & sensitivity, Aerobic bacteria, Throat Swab',
    category: 'Microbiology',
    sampleType: 'Posterior Pharynx / Tonsillar Swab in Amies Transport Medium',
    sampleTubeColor: 'red',
    price: 750,
    tatHours: 48,
    description: 'Isolation and identification of Group A Beta-Hemolytic Streptococci (Streptococcus pyogenes) and other pathogenic aerobic bacteria from upper respiratory mucosa.',
    specimenPrep: 'Depress tongue; vigorously swab posterior pharynx, bilateral tonsillar pillars, and any inflamed exudative areas without touching tongue or buccal mucosa.',
    clinicalSignificance: 'Confirmation of streptococcal pharyngitis/tonsillitis, prevention of post-streptococcal acute rheumatic fever and glomerulonephritis, and antibiotic susceptibility guidance.',
    parameters: [
      { id: 'p-thr-smear', name: 'Direct Smear Examination', unit: '', refRangeText: 'Normal oral flora morphology', method: 'Gram Stain' },
      { id: 'p-thr-strep', name: 'Beta-Hemolytic Streptococcus Screen', unit: '', refRangeText: 'Negative for Streptococcus pyogenes (Group A Strep)', method: 'Sheep Blood Agar with Bacitracin Disc' },
      { id: 'p-thr-cult', name: 'Aerobic Throat Culture (48h)', unit: '', refRangeText: 'Normal upper respiratory commensal flora grown; no pathogen isolated', method: 'Blood Agar & Chocolate Agar 37°C' },
      { id: 'p-thr-org', name: 'Pathogen Isolated', unit: '', refRangeText: 'None', method: 'Identification' },
      { id: 'p-thr-ast', name: 'Antibiotic Sensitivity', unit: '', refRangeText: 'Not Applicable', method: 'CLSI Disc Diffusion' },
    ],
  },

  // 78. Hemogram(CBC+ESR)
  {
    id: 'tmpl-hemogram-78',
    testCode: 'HEMOGRAM-78',
    testName: 'Hemogram(CBC+ESR)',
    category: 'Hematology',
    sampleType: 'EDTA Whole Blood (Lavender Top 3 ml)',
    sampleTubeColor: 'purple',
    price: 450,
    tatHours: 4,
    description: 'Unified hematologic profile combining automated Complete Blood Count differential with Westergren Erythrocyte Sedimentation Rate.',
    specimenPrep: 'Do not freeze. Invert tube gently 8-10 times immediately after venipuncture to ensure complete anticoagulation.',
    clinicalSignificance: 'Comprehensive baseline evaluation for systemic infection, chronic inflammatory disorders, anemias, hematologic neoplasms, and connective tissue diseases.',
    parameters: [
      { id: 'p-hg-hb', name: 'Hemoglobin (Hb)', unit: 'g/dL', refRangeMin: 13.0, refRangeMax: 17.0, refRangeText: '13.0 - 17.0 (M) / 12.0 - 15.5 (F)', method: 'Photometric Cyanmethemoglobin', criticalLow: 7.0, criticalHigh: 20.0 },
      { id: 'p-hg-rbc', name: 'Total RBC Count', unit: 'mil/mcL', refRangeMin: 4.5, refRangeMax: 5.9, refRangeText: '4.50 - 5.90', method: 'Electrical Impedance' },
      { id: 'p-hg-pcv', name: 'Packed Cell Volume (PCV / Hematocrit)', unit: '%', refRangeMin: 40.0, refRangeMax: 50.0, refRangeText: '40.0 - 50.0', method: 'Calculated' },
      { id: 'p-hg-mcv', name: 'Mean Corpuscular Volume (MCV)', unit: 'fL', refRangeMin: 80.0, refRangeMax: 100.0, refRangeText: '80.0 - 100.0', method: 'Calculated' },
      { id: 'p-hg-mch', name: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', refRangeMin: 27.0, refRangeMax: 33.0, refRangeText: '27.0 - 33.0', method: 'Calculated' },
      { id: 'p-hg-mchc', name: 'MCHC', unit: 'g/dL', refRangeMin: 32.0, refRangeMax: 36.0, refRangeText: '32.0 - 36.0', method: 'Calculated' },
      { id: 'p-hg-rdw', name: 'RDW-CV', unit: '%', refRangeMin: 11.5, refRangeMax: 14.5, refRangeText: '11.5 - 14.5', method: 'Automated Cytometry' },
      { id: 'p-hg-wbc', name: 'Total Leukocyte Count (TLC / WBC)', unit: '/mcL', refRangeMin: 4000, refRangeMax: 11000, refRangeText: '4,000 - 11,000', method: 'Flow Cytometry Laser', criticalLow: 2000, criticalHigh: 25000 },
      { id: 'p-hg-neu', name: 'Neutrophils', unit: '%', refRangeMin: 45, refRangeMax: 70, refRangeText: '45 - 70', method: 'Differential Cytometry' },
      { id: 'p-hg-lym', name: 'Lymphocytes', unit: '%', refRangeMin: 20, refRangeMax: 40, refRangeText: '20 - 40', method: 'Differential Cytometry' },
      { id: 'p-hg-mon', name: 'Monocytes', unit: '%', refRangeMin: 2, refRangeMax: 8, refRangeText: '2 - 8', method: 'Differential Cytometry' },
      { id: 'p-hg-eos', name: 'Eosinophils', unit: '%', refRangeMin: 1, refRangeMax: 6, refRangeText: '1 - 6', method: 'Differential Cytometry' },
      { id: 'p-hg-bas', name: 'Basophils', unit: '%', refRangeMin: 0, refRangeMax: 1, refRangeText: '0 - 1', method: 'Differential Cytometry' },
      { id: 'p-hg-plt', name: 'Platelet Count', unit: '/mcL', refRangeMin: 150000, refRangeMax: 450000, refRangeText: '150,000 - 450,000', method: 'Electrical Impedance', criticalLow: 50000, criticalHigh: 800000 },
      { id: 'p-hg-mpv', name: 'Mean Platelet Volume (MPV)', unit: 'fL', refRangeMin: 7.0, refRangeMax: 11.0, refRangeText: '7.0 - 11.0', method: 'Automated Cytometry' },
      { id: 'p-hg-esr', name: 'Erythrocyte Sedimentation Rate (ESR)', unit: 'mm/1st hr', refRangeMin: 0, refRangeMax: 20, refRangeText: '0 - 15 (Male) | 0 - 20 (Female)', method: 'Automated Modified Westergren' },
    ],
  },

  // 79. Dengue IgG
  {
    id: 'tmpl-dengue-igg-79',
    testCode: 'DENGUE-IGG-79',
    testName: 'Dengue IgG',
    category: 'Serology',
    sampleType: 'Serum (SST Gold Top 2 ml)',
    sampleTubeColor: 'amber',
    price: 500,
    tatHours: 3,
    description: 'Specific serologic measurement of Dengue IgG antibodies in human serum.',
    specimenPrep: 'Collect blood upon presentation. In secondary dengue, IgG rises rapidly within 2-4 days of onset.',
    clinicalSignificance: 'Differentiates primary from secondary dengue infection. Elevated or quadrupling IgG indicates secondary dengue, carrying higher risk for Dengue Hemorrhagic Fever (DHF).',
    parameters: [
      { id: 'p-dengue-igg-res', name: 'Dengue IgG Antibody Result', unit: '', refRangeText: 'Negative / Non-Reactive', method: 'Immunochromatographic / MAC-ELISA' },
      { id: 'p-dengue-igg-idx', name: 'Dengue IgG Index / S/CO', unit: 'Ratio', refRangeMin: 0, refRangeMax: 0.90, refRangeText: '< 0.90 (Negative) | 0.90 - 1.10 (Equivocal) | ≥ 1.10 (Positive)', method: 'ELISA Optical Density' },
    ],
  },

  // 80. Dengue IgM
  {
    id: 'tmpl-dengue-igm-80',
    testCode: 'DENGUE-IGM-80',
    testName: 'Dengue IgM',
    category: 'Serology',
    sampleType: 'Serum (SST Gold Top 2 ml)',
    sampleTubeColor: 'amber',
    price: 500,
    tatHours: 3,
    description: 'Quantitative/qualitative determination of Dengue Virus-specific IgM antibodies in human serum.',
    specimenPrep: 'Optimal testing window is Day 5 or later after onset of fever when IgM levels become detectable.',
    clinicalSignificance: 'Primary serologic diagnostic marker for acute or recent Dengue virus infection.',
    parameters: [
      { id: 'p-dengue-igm-res', name: 'Dengue IgM Antibody Result', unit: '', refRangeText: 'Negative / Non-Reactive', method: 'Immunochromatographic / MAC-ELISA' },
      { id: 'p-dengue-igm-idx', name: 'Dengue IgM Index / S/CO', unit: 'Ratio', refRangeMin: 0, refRangeMax: 0.90, refRangeText: '< 0.90 (Negative) | 0.90 - 1.10 (Equivocal) | ≥ 1.10 (Positive)', method: 'ELISA Optical Density' },
    ],
  },

  // 81. Dengue NS1
  {
    id: 'tmpl-dengue-ns1-81',
    testCode: 'DENGUE-NS1-81',
    testName: 'Dengue NS1',
    category: 'Serology',
    sampleType: 'Serum (SST Gold Top 2 ml)',
    sampleTubeColor: 'amber',
    price: 550,
    tatHours: 2,
    description: 'Detection of Dengue non-structural protein 1 (NS1) antigen circulating in peripheral blood.',
    specimenPrep: 'Collect within Days 1 to 5 of acute febrile illness onset for highest analytical sensitivity.',
    clinicalSignificance: 'Early confirmation of acute Dengue infection before anti-dengue IgM antibodies appear.',
    parameters: [
      { id: 'p-dengue-ns1-res', name: 'Dengue NS1 Antigen Result', unit: '', refRangeText: 'Negative / Non-Reactive', method: 'Rapid Immunochromatographic Assay / ELISA' },
      { id: 'p-dengue-ns1-idx', name: 'NS1 Signal / Cut-off Index', unit: 'Ratio', refRangeMin: 0, refRangeMax: 0.90, refRangeText: '< 0.90 (Negative) | ≥ 1.10 (Positive)', method: 'Spectrophotometric ELISA' },
    ],
  },

  // 82. DHEA-S
  {
    id: 'tmpl-dheas-82',
    testCode: 'DHEAS-82',
    testName: 'DHEA-S',
    category: 'Endocrinology',
    sampleType: 'Serum (Plain Red / SST 2 ml)',
    sampleTubeColor: 'amber',
    price: 950,
    tatHours: 8,
    description: 'Chemiluminescent measurement of Dehydroepiandrosterone Sulfate (DHEA-S), the major circulating adrenal androgen.',
    specimenPrep: 'Morning draw preferred. Stable without marked diurnal variation unlike cortisol.',
    clinicalSignificance: 'Differential diagnosis of hyperandrogenism, polycystic ovary syndrome (PCOS), adrenocortical tumors, hirsutism, and congenital adrenal hyperplasia.',
    parameters: [
      { id: 'p-dheas-val', name: 'DHEA-S (Dehydroepiandrosterone Sulfate)', unit: 'ug/dL', refRangeMin: 80.0, refRangeMax: 450.0, refRangeText: '80.0 - 560.0 (Male) | 35.0 - 430.0 (Female)', method: 'Chemiluminescent Immunoassay (CLIA)' },
    ],
  },

  // 83. Estradiol (E2)
  {
    id: 'tmpl-estradiol-83',
    testCode: 'ESTRADIOL-83',
    testName: 'Estradiol (E2)',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gold Top 2 ml)',
    sampleTubeColor: 'amber',
    price: 650,
    tatHours: 6,
    description: 'Chemiluminescent measurement of 17-beta estradiol, the most potent bioactive estrogen.',
    specimenPrep: 'Specify menstrual cycle day or gestational age. Morning sample recommended.',
    clinicalSignificance: 'Evaluation of ovarian function, in vitro fertilization (IVF) follicle monitoring, menstrual irregularities, precocious puberty, and gynecomastia.',
    parameters: [
      { id: 'p-estradiol-val', name: 'Serum Estradiol (E2)', unit: 'pg/mL', refRangeMin: 15.0, refRangeMax: 350.0, refRangeText: 'Follicular: 19.5 - 144.2 | Mid-cycle: 63.9 - 356.7 | Luteal: 55.8 - 214.2 | Post-menopausal: < 32.2 | Male: 11.3 - 43.2', method: 'Chemiluminescent Immunoassay (CLIA)' },
    ],
  },

  // 84. Ferritin
  {
    id: 'tmpl-ferritin-84',
    testCode: 'FERRITIN-84',
    testName: 'Ferritin',
    category: 'Biochemistry',
    sampleType: 'Serum (Plain Red / SST 2 ml)',
    sampleTubeColor: 'amber',
    price: 600,
    tatHours: 4,
    description: 'Quantitative determination of serum ferritin concentration reflecting total body intracellular iron stores.',
    specimenPrep: 'Overnight fasting preferred. Avoid iron supplements 24 hours prior to sampling.',
    clinicalSignificance: 'Most sensitive marker for iron deficiency anemia (low ferritin) and evaluation of iron overload syndromes such as hemochromatosis and acute phase reactions.',
    parameters: [
      { id: 'p-ferritin-val', name: 'Serum Ferritin', unit: 'ng/mL', refRangeMin: 20.0, refRangeMax: 300.0, refRangeText: '30.0 - 400.0 (Male) | 13.0 - 150.0 (Female)', method: 'Particle-Enhanced Immunoturbidimetric / CLIA', criticalLow: 10.0, criticalHigh: 1000.0 },
    ],
  },

  // 85. Folic Acid
  {
    id: 'tmpl-folate-85',
    testCode: 'FOLATE-85',
    testName: 'Folic Acid',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gold Top 3 ml - Protect from light)',
    sampleTubeColor: 'amber',
    price: 850,
    tatHours: 6,
    description: 'Chemiluminescent measurement of serum folate to assess nutritional status and cellular DNA methylation capacity.',
    specimenPrep: 'Fasting specimen required. Protect sample from direct light exposure. Centrifuge and separate serum promptly.',
    clinicalSignificance: 'Differential diagnosis of megaloblastic macrocytic anemia, neural tube defect risk assessment in pregnancy, and malabsorption syndromes.',
    parameters: [
      { id: 'p-folate-val', name: 'Serum Folic Acid (Folate)', unit: 'ng/mL', refRangeMin: 4.6, refRangeMax: 18.7, refRangeText: '4.6 - 18.7 (Normal) | < 3.4 (Deficient)', method: 'Chemiluminescent Competitive Immunoassay (CLIA)', criticalLow: 3.0 },
    ],
  },

  // 86. FSH
  {
    id: 'tmpl-fsh-86',
    testCode: 'FSH-86',
    testName: 'FSH',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gold Top 2 ml)',
    sampleTubeColor: 'amber',
    price: 500,
    tatHours: 6,
    description: 'Quantitative chemiluminescent determination of Follicle Stimulating Hormone secreted by the anterior pituitary gland.',
    specimenPrep: 'Record phase of menstrual cycle (Day 2-4 baseline preferred for fertility workup).',
    clinicalSignificance: 'Diagnosis of primary versus secondary hypogonadism, ovarian reserve assessment, infertility investigation, amenorrhea, and menopausal status.',
    parameters: [
      { id: 'p-fsh-val', name: 'Follicle Stimulating Hormone (FSH)', unit: 'mIU/mL', refRangeMin: 1.5, refRangeMax: 12.4, refRangeText: 'Follicular: 3.5 - 12.5 | Ovulatory: 4.7 - 21.5 | Luteal: 1.7 - 7.7 | Postmenopausal: 25.8 - 134.8 | Male: 1.5 - 12.4', method: 'Chemiluminescent Immunoassay (CLIA)' },
    ],
  },

  // 87. G6PD Quantitative, EDTA Blood
  {
    id: 'tmpl-g6pd-87',
    testCode: 'G6PD-87',
    testName: 'G6PD Quantitative, EDTA Blood',
    category: 'Hematology',
    sampleType: 'EDTA Whole Blood (Lavender Top 2 ml)',
    sampleTubeColor: 'purple',
    price: 750,
    tatHours: 6,
    description: 'Kinetic spectrophotometric quantitative measurement of Glucose-6-Phosphate Dehydrogenase catalytic activity in red blood cells normalized to hemoglobin.',
    specimenPrep: 'Test should ideally not be performed during or immediately following an acute hemolytic episode or recent blood transfusion.',
    clinicalSignificance: 'Diagnosis of hereditary X-linked G6PD enzymopathy, screening prior to initiating oxidative medications (dapsone, primaquine, rasburicase), and investigation of neonatal jaundice.',
    parameters: [
      { id: 'p-g6pd-act', name: 'G6PD Enzyme Activity', unit: 'U/g Hb', refRangeMin: 4.6, refRangeMax: 13.5, refRangeText: '4.6 - 13.5 U/g Hb (Normal) | < 2.0 (Severe Deficiency)', method: 'Kinetic UV Spectrophotometry (340 nm)', criticalLow: 2.0 },
      { id: 'p-g6pd-hb', name: 'Total Blood Hemoglobin (Normalization)', unit: 'g/dL', refRangeMin: 12.0, refRangeMax: 17.0, refRangeText: '12.0 - 17.0', method: 'Cyanmethemoglobin' },
    ],
  },

  // 88. Karyotyping
  {
    id: 'tmpl-karyo-88',
    testCode: 'KARYO-88',
    testName: 'Karyotyping',
    category: 'Molecular Diagnostics',
    sampleType: 'Sodium Heparin Whole Blood (Green Top 5 ml - Sterile)',
    sampleTubeColor: 'green',
    price: 3500,
    tatHours: 168,
    description: 'Cytogenetic chromosomal analysis (G-banding / GTG technique) of phytohemagglutinin-stimulated peripheral blood T-lymphocytes.',
    specimenPrep: 'Collect strictly under sterile conditions in sodium heparin (NOT EDTA). Do not freeze. Ship at room temperature immediately.',
    clinicalSignificance: 'Detection of numerical and structural chromosomal aberrations: Down syndrome (Trisomy 21), Turner syndrome (45,X), Klinefelter syndrome (47,XXY), recurrent pregnancy loss, and unexplained infertility.',
    parameters: [
      { id: 'p-karyo-meta', name: 'Metaphases Counted & Analyzed', unit: 'Cells', refRangeMin: 20, refRangeMax: 30, refRangeText: '20 - 30 Metaphases', method: 'Automated Cytogenetic Imaging' },
      { id: 'p-karyo-res', name: 'Banding Technique & Resolution', unit: 'BPH', refRangeText: 'GTG-Banding at 450 - 550 Band Resolution', method: 'G-Banding Light Microscopy' },
      { id: 'p-karyo-form', name: 'Karyotype Formula (ISCN 2020)', unit: '', refRangeText: '46,XX (Normal Female) / 46,XY (Normal Male)', method: 'ISCN Cytogenetic Nomenclature' },
      { id: 'p-karyo-diag', name: 'Diagnostic Interpretation', unit: '', refRangeText: 'APPARENTLY NORMAL CHROMOSOMAL CONSTITUTION (No numerical or structural aneuploidy detected)', method: 'Consultant Cytogeneticist Review' },
    ],
  },

  // 89. Hemoglobinopathy by HPLC, EDTA Blood
  {
    id: 'tmpl-hplc-hemo-89',
    testCode: 'HPLC-HEMO-89',
    testName: 'Hemoglobinopathy by HPLC, EDTA Blood',
    category: 'Hematology',
    sampleType: 'EDTA Whole Blood (Lavender Top 3 ml)',
    sampleTubeColor: 'purple',
    price: 1100,
    tatHours: 8,
    description: 'High-Performance Liquid Chromatography (HPLC) automated separation and quantitation of normal and abnormal hemoglobin fractions.',
    specimenPrep: 'Stable for 7 days at 2-8°C. Ensure patient has not received blood transfusion in preceding 3 months.',
    clinicalSignificance: 'Definitive screening and quantification for Beta Thalassemia Trait/Major (elevated HbA2 > 3.5%), Sickle Cell Disease/Trait (HbS), HbE, and other structural hemoglobin variants.',
    parameters: [
      { id: 'p-hplc-hba0', name: 'Hb A0 Percentage', unit: '%', refRangeMin: 85.0, refRangeMax: 95.0, refRangeText: '85.0 - 95.0', method: 'Cation-Exchange HPLC (Bio-Rad Variant II)' },
      { id: 'p-hplc-hba2', name: 'Hb A2 Percentage', unit: '%', refRangeMin: 1.8, refRangeMax: 3.5, refRangeText: '1.8 - 3.5 (Normal) | > 3.5 (Beta Thalassemia Trait)', method: 'Cation-Exchange HPLC' },
      { id: 'p-hplc-hbf', name: 'Hb F (Fetal Hemoglobin)', unit: '%', refRangeMin: 0.0, refRangeMax: 1.0, refRangeText: '< 1.0 (Adult)', method: 'Cation-Exchange HPLC' },
      { id: 'p-hplc-var', name: 'Variant Hemoglobins (HbS / HbD / HbE / HbC)', unit: '%', refRangeText: 'Not Detected (Retention Window Absent)', method: 'Retention Time Analysis' },
      { id: 'p-hplc-interp', name: 'Chromatographic Impression', unit: '', refRangeText: 'Normal adult hemoglobin chromatogram. No abnormal hemoglobin variant identified.', method: 'Consultant Hematopathologist Review' },
    ],
  },

  // 90. HbA1c, EDTA Blood
  {
    id: 'tmpl-hba1c-edta-90',
    testCode: 'HBA1C-EDTA-90',
    testName: 'HbA1c, EDTA Blood',
    category: 'Biochemistry',
    sampleType: 'EDTA Whole Blood (Lavender Top 2 ml)',
    sampleTubeColor: 'purple',
    price: 450,
    tatHours: 3,
    description: 'Reference HPLC quantitation of glycated hemoglobin percentage reflecting average blood glucose levels over preceding 8-12 weeks.',
    specimenPrep: 'No fasting required. Collect EDTA whole blood. Do not freeze.',
    clinicalSignificance: 'Gold standard index for diabetes diagnosis, glycemic control assessment, and long-term microvascular complication risk stratification.',
    parameters: [
      { id: 'p-hba1c-edta', name: 'HbA1c (Glycosylated Hemoglobin)', unit: '%', refRangeMin: 4.0, refRangeMax: 5.6, refRangeText: '< 5.7 (Normal) | 5.7 - 6.4 (Pre-diabetes) | ≥ 6.5 (Diabetes)', method: 'HPLC / NGSP & IFCC Certified Ion-Exchange', criticalHigh: 12.0 },
      { id: 'p-hba1c-eag', name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', refRangeMin: 70, refRangeMax: 126, refRangeText: '70 - 126 (Normal)', method: 'Calculated (28.7 × HbA1c - 46.7)' },
    ],
  },

  // 91. Hepatitis C-HCV RNA (Quantitative) by PCR, Plasma
  {
    id: 'tmpl-hcv-rna-91',
    testCode: 'HCV-RNA-91',
    testName: 'Hepatitis C-HCV RNA (Quantitative) by PCR, Plasma',
    category: 'Molecular Diagnostics',
    sampleType: 'EDTA Plasma (Lavender Top 4 ml - Centrifuged within 4h)',
    sampleTubeColor: 'purple',
    price: 3800,
    tatHours: 24,
    description: 'Real-Time Quantitative Reverse Transcription PCR (RT-qPCR) measuring Hepatitis C Virus RNA viral load in human plasma.',
    specimenPrep: 'Collect EDTA blood, centrifuge within 4 hours, separate plasma and freeze at -20°C or below immediately.',
    clinicalSignificance: 'Confirmation of active HCV viremia, baseline viral load before starting Direct-Acting Antiviral (DAA) therapy, and evaluation of Sustained Virological Response (SVR12 / SVR24).',
    parameters: [
      { id: 'p-hcv-rna-vl', name: 'HCV RNA Viral Load', unit: 'IU/mL', refRangeText: 'Target Not Detected (< 15 IU/mL Lower Limit of Quantitation)', method: 'Real-Time Quantitative TaqMan RT-PCR' },
      { id: 'p-hcv-rna-log', name: 'Log10 Viral Load', unit: 'Log10 IU/mL', refRangeText: 'Target Not Detected', method: 'Calculated' },
      { id: 'p-hcv-rna-lin', name: 'Linear Dynamic Range', unit: 'IU/mL', refRangeText: '15 to 100,000,000 IU/mL', method: 'Real-Time RT-PCR' },
      { id: 'p-hcv-rna-ctrl', name: 'Internal Control Amplification', unit: '', refRangeText: 'Valid / Detected', method: 'Fluorogenic Probe Assay' },
    ],
  },

  // 92. HIV I & II Antibody Screening
  {
    id: 'tmpl-hiv-ab-92',
    testCode: 'HIV-AB-92',
    testName: 'HIV I & II Antibody Screening',
    category: 'Infectious Diseases',
    sampleType: 'Serum (SST Gold Top 3 ml)',
    sampleTubeColor: 'amber',
    price: 450,
    tatHours: 3,
    description: 'Third-generation immunoassay screening for specific antibodies against Human Immunodeficiency Virus Type 1 and Type 2.',
    specimenPrep: 'Pre-test counseling and informed consent mandatory. Routine venipuncture.',
    clinicalSignificance: 'Initial serological screening for HIV-1 and HIV-2 antibodies. Reactive specimens require confirmatory supplemental immunoblot/western blot testing.',
    parameters: [
      { id: 'p-hiv-ab-res', name: 'HIV-1 & HIV-2 Antibodies', unit: '', refRangeText: 'Non-Reactive / Negative', method: '3rd Generation ELISA / Rapid Immunochromatographic Assay' },
      { id: 'p-hiv-ab-ctrl', name: 'Procedural Control Line', unit: '', refRangeText: 'Valid', method: 'Internal Assay Control' },
    ],
  },

  // 93. HLA B27 By PCR, EDTA Blood
  {
    id: 'tmpl-hlab27-pcr-93',
    testCode: 'HLAB27-PCR-93',
    testName: 'HLA B27 By PCR, EDTA Blood',
    category: 'Molecular Diagnostics',
    sampleType: 'EDTA Whole Blood (Lavender Top 3 ml)',
    sampleTubeColor: 'purple',
    price: 2200,
    tatHours: 24,
    description: 'High-specificity Real-Time PCR assay for the qualitative detection of human leukocyte antigen HLA-B*27 alleles.',
    specimenPrep: 'Store and transport at 2-8°C. Do not freeze whole blood before DNA extraction.',
    clinicalSignificance: 'Strong genetic marker aiding in the diagnosis of Ankylosing Spondylitis, reactive arthritis (Reiter syndrome), psoriatic arthritis, and acute anterior uveitis.',
    parameters: [
      { id: 'p-hla-b27-res', name: 'HLA-B*27 Allele DNA Detection', unit: '', refRangeText: 'Negative / Not Detected', method: 'Real-Time Sequence-Specific Primer (SSP) PCR' },
      { id: 'p-hla-b27-ctrl', name: 'Internal Control Gene (Beta-Globin)', unit: '', refRangeText: 'Positive / Amplified', method: 'Dual-Color Real-Time Fluorometry' },
      { id: 'p-hla-b27-interp', name: 'Clinical Interpretation', unit: '', refRangeText: 'Negative for HLA-B*27 allele. Significantly reduces likelihood of Ankylosing Spondylitis.', method: 'Molecular Diagnostics Sign-off' },
    ],
  },

  // 94. Lipase, Serum
  {
    id: 'tmpl-lipase-94',
    testCode: 'LIPASE-94',
    testName: 'Lipase, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (SST Gold Top 3 ml)',
    sampleTubeColor: 'amber',
    price: 500,
    tatHours: 3,
    description: 'Quantitative enzymatic determination of pancreatic lipase catalytic activity in human serum.',
    specimenPrep: 'Overnight fasting preferred. Avoid opiate medications prior to testing as they may elevate pancreatic pressures.',
    clinicalSignificance: 'Superior sensitivity and specificity over amylase for diagnosing acute pancreatitis; remains elevated longer (8-14 days) following acute attack.',
    parameters: [
      { id: 'p-lipase-val', name: 'Serum Lipase', unit: 'U/L', refRangeMin: 13, refRangeMax: 60, refRangeText: '13.0 - 60.0 U/L', method: 'Enzymatic Colorimetric (Methylresorufin substrate)', criticalHigh: 200 },
    ],
  },

  // 95. Cholesterol (Total)
  {
    id: 'tmpl-chol-tot-95',
    testCode: 'CHOL-TOT-95',
    testName: 'Cholesterol (Total)',
    category: 'Biochemistry',
    sampleType: 'Serum (10-12 hr Fasting, SST Gold Top 3 ml)',
    sampleTubeColor: 'amber',
    price: 200,
    tatHours: 3,
    description: 'Quantitative enzymatic determination of total circulating cholesterol in human serum.',
    specimenPrep: 'Strict 10-12 hour water-only fasting recommended for standard cardiovascular risk calculation.',
    clinicalSignificance: 'Assessment of cardiovascular disease risk, hypercholesterolemia, familial dyslipidemia, and response to lipid-lowering statin therapy.',
    parameters: [
      { id: 'p-chol-tot-val', name: 'Total Cholesterol', unit: 'mg/dL', refRangeMin: 125, refRangeMax: 200, refRangeText: '< 200.0 (Desirable) | 200 - 239 (Borderline High) | ≥ 240 (High)', method: 'Enzymatic CHOD-PAP Photometric', criticalHigh: 300 },
    ],
  },

  // 96. Triglyceride, Serum
  {
    id: 'tmpl-trig-serum-96',
    testCode: 'TRIG-SERUM-96',
    testName: 'Triglyceride, Serum',
    category: 'Biochemistry',
    sampleType: 'Serum (10-12 hr Fasting, SST Gold Top 3 ml)',
    sampleTubeColor: 'amber',
    price: 250,
    tatHours: 3,
    description: 'Quantitative enzymatic measurement of serum neutral triglycerides reflecting circulating very-low-density lipoproteins and chylomicrons.',
    specimenPrep: 'Mandatory 10-12 hour fasting. Refrain from alcohol consumption for 24 hours before test.',
    clinicalSignificance: 'Evaluation of atherogenic dyslipidemia, metabolic syndrome, and assessment of acute pancreatitis risk when values exceed 500-1000 mg/dL.',
    parameters: [
      { id: 'p-trig-serum-val', name: 'Serum Triglycerides', unit: 'mg/dL', refRangeMin: 50, refRangeMax: 150, refRangeText: '< 150.0 (Normal) | 150 - 199 (Borderline High) | 200 - 499 (High) | ≥ 500 (Very High)', method: 'Enzymatic GPO-PAP Photometric', criticalHigh: 500 },
    ],
  },

  // 97. Lupus Anticoagulant, Plasma
  {
    id: 'tmpl-lupus-ac-97',
    testCode: 'LUPUS-AC-97',
    testName: 'Lupus Anticoagulant, Plasma',
    category: 'Coagulation',
    sampleType: 'Platelet-Poor Citrated Plasma (Light Blue Top 3.2% Citrate 3 ml)',
    sampleTubeColor: 'blue',
    price: 2200,
    tatHours: 8,
    description: 'Functional phospholipid-dependent coagulation assay utilizing Dilute Russell Viper Venom Time (dRVVT) Screen and Confirm tests.',
    specimenPrep: 'Double centrifugation required to yield platelet-poor plasma (< 10,000 platelets/mcL). Patient should not be on direct oral anticoagulants or high-dose heparin.',
    clinicalSignificance: 'Laboratory criterion for Antiphospholipid Syndrome (APS). Evaluation of unexplained arterial/venous thromboembolism, recurrent first-trimester miscarriages, and late fetal loss.',
    parameters: [
      { id: 'p-lupus-drvvt-scr', name: 'dRVVT Screen Time', unit: 'Seconds', refRangeMin: 30.0, refRangeMax: 45.0, refRangeText: '30.0 - 45.0', method: 'Dilute Russell Viper Venom Time (dRVVT)' },
      { id: 'p-lupus-drvvt-cnf', name: 'dRVVT Confirm Time', unit: 'Seconds', refRangeMin: 28.0, refRangeMax: 40.0, refRangeText: '28.0 - 40.0', method: 'dRVVT Phospholipid Neutralization' },
      { id: 'p-lupus-drvvt-rat', name: 'Normalized dRVVT Screen / Confirm Ratio', unit: 'Ratio', refRangeMin: 0.80, refRangeMax: 1.20, refRangeText: '< 1.20 (Negative) | 1.20 - 1.38 (Moderate) | > 1.38 (Strong Positive)', method: 'Calculated Ratio' },
      { id: 'p-lupus-interp', name: 'Lupus Anticoagulant Interpretation', unit: '', refRangeText: 'Negative for Lupus Anticoagulant (ISTH Criteria)', method: 'Consensus Coagulation Criteria' },
    ],
  },

  // 98. Luteinizing Hormone (LH), Serum
  {
    id: 'tmpl-lh-98',
    testCode: 'LH-98',
    testName: 'Luteinizing Hormone (LH), Serum',
    category: 'Endocrinology',
    sampleType: 'Serum (SST Gold Top 2 ml)',
    sampleTubeColor: 'amber',
    price: 500,
    tatHours: 6,
    description: 'Chemiluminescent measurement of pituitary Luteinizing Hormone regulating gonadal steroidogenesis and ovulation.',
    specimenPrep: 'Note menstrual cycle phase. Serial draws may be used to identify mid-cycle ovulatory surge.',
    clinicalSignificance: 'Assessment of LH/FSH ratio in Polycystic Ovary Syndrome (PCOS), confirmation of ovulation, investigation of primary vs secondary hypogonadism, and pituitary dysfunction.',
    parameters: [
      { id: 'p-lh-val', name: 'Serum Luteinizing Hormone (LH)', unit: 'mIU/mL', refRangeMin: 1.7, refRangeMax: 8.6, refRangeText: 'Follicular: 2.4 - 12.6 | Mid-cycle Peak: 14.0 - 95.6 | Luteal: 1.0 - 11.4 | Postmenopausal: 7.7 - 58.5 | Male: 1.7 - 8.6', method: 'Chemiluminescent Immunoassay (CLIA)' },
    ],
  },
];
