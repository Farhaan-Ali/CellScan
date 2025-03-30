-- Drop existing tables if needed for clean setup
-- DO NOT EXECUTE THIS IN PRODUCTION WITHOUT BACKING UP DATA
-- DROP TABLE IF EXISTS akinator_decision_tree;
-- DROP TABLE IF EXISTS akinator_responses;
-- DROP TABLE IF EXISTS akinator_results;

-- Create the decision tree table for our Akinator-style quiz
CREATE TABLE IF NOT EXISTS akinator_decision_tree (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('boolean', 'range', 'select')),
  options JSONB NOT NULL DEFAULT '{}',
  is_root BOOLEAN NOT NULL DEFAULT FALSE,
  symptom_category VARCHAR(100), -- e.g., "Breast", "Lung", "Skin", "General"
  next_question_mapping JSONB NOT NULL DEFAULT '{}', -- Maps responses to next question IDs
  risk_score_modifier INT NOT NULL DEFAULT 0, -- How much this answer affects risk
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table to store the risk assessment results
CREATE TABLE IF NOT EXISTS akinator_results (
  id SERIAL PRIMARY KEY,
  condition_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('Low', 'Moderate', 'High', 'Unknown')), -- "Low", "Moderate", "High", "Unknown"
  min_score INT NOT NULL,
  max_score INT NOT NULL,
  recommendation TEXT NOT NULL,
  followup_actions JSONB NOT NULL DEFAULT '[]',
  sources JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table to store user responses to the Akinator quiz
CREATE TABLE IF NOT EXISTS akinator_responses (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  question_id INT NOT NULL REFERENCES akinator_decision_tree(id),
  response JSONB NOT NULL,
  final_score INT,
  final_condition INT REFERENCES akinator_results(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_akinator_decision_tree_is_root ON akinator_decision_tree(is_root);
CREATE INDEX IF NOT EXISTS idx_akinator_decision_tree_category ON akinator_decision_tree(symptom_category);
CREATE INDEX IF NOT EXISTS idx_akinator_responses_session_id ON akinator_responses(session_id);

-- Insert root-level questions for different categories
INSERT INTO akinator_decision_tree (question_text, question_type, options, is_root, symptom_category, next_question_mapping, risk_score_modifier)
VALUES
(
  'Which type of cancer are you concerned about?', 
  'select',
  '{"options": ["Breast Cancer", "Skin Cancer", "Lung Cancer"]}',
  TRUE,
  NULL,
  '{
    "Breast Cancer": 2,
    "Skin Cancer": 3,
    "Lung Cancer": 4
  }',
  0
);

-- Breast cancer related questions
INSERT INTO akinator_decision_tree (question_text, question_type, options, is_root, symptom_category, next_question_mapping, risk_score_modifier)
VALUES
(
  'Have you noticed any lumps in your breast?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Breast Cancer',
  '{
    "Yes": 5,
    "No": 6
  }',
  5
),
(
  'Have you noticed any changes in the size or shape of your breast?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Breast Cancer',
  '{
    "Yes": 7,
    "No": 8
  }',
  3
),
(
  'Is there any pain in your breast or armpit?',
  'range',
  '{"min": 0, "max": 10, "step": 1}',
  FALSE,
  'Breast Cancer',
  '{
    "high": 9,
    "low": 10
  }',
  2
),
(
  'Have you had any nipple discharge?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Breast Cancer',
  '{
    "Yes": 11,
    "No": 12
  }',
  4
),
(
  'Do you have a family history of breast cancer?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Breast Cancer',
  '{
    "Yes": 13,
    "No": 14
  }',
  5
),
(
  'What is your age?',
  'select',
  '{"options": ["Under 30", "30-40", "41-50", "51-60", "Over 60"]}',
  FALSE,
  'Breast Cancer',
  '{
    "Under 30": 15,
    "30-40": 15,
    "41-50": 15,
    "51-60": 15,
    "Over 60": 15
  }',
  3
);

-- Skin cancer related questions
INSERT INTO akinator_decision_tree (question_text, question_type, options, is_root, symptom_category, next_question_mapping, risk_score_modifier)
VALUES
(
  'Have you noticed any new moles or changes in existing moles?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Skin Cancer',
  '{
    "Yes": 16,
    "No": 17
  }',
  5
),
(
  'Do any of your moles have irregular borders?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Skin Cancer',
  '{
    "Yes": 18,
    "No": 19
  }',
  4
),
(
  'Do any of your moles have multiple colors?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Skin Cancer',
  '{
    "Yes": 20,
    "No": 21
  }',
  4
),
(
  'Have you had excessive sun exposure or sunburns in your life?',
  'range',
  '{"min": 0, "max": 10, "step": 1}',
  FALSE,
  'Skin Cancer',
  '{
    "high": 22,
    "low": 23
  }',
  3
),
(
  'Do you have a family history of skin cancer?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Skin Cancer',
  '{
    "Yes": 24,
    "No": 25
  }',
  5
);

-- Lung cancer related questions
INSERT INTO akinator_decision_tree (question_text, question_type, options, is_root, symptom_category, next_question_mapping, risk_score_modifier)
VALUES
(
  'Do you smoke or have you smoked in the past?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Lung Cancer',
  '{
    "Yes": 26,
    "No": 27
  }',
  7
),
(
  'Have you experienced a persistent cough?',
  'range',
  '{"min": 0, "max": 10, "step": 1}',
  FALSE,
  'Lung Cancer',
  '{
    "high": 28,
    "low": 29
  }',
  4
),
(
  'Have you coughed up blood?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Lung Cancer',
  '{
    "Yes": 30,
    "No": 31
  }',
  8
),
(
  'Have you experienced unexplained weight loss?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Lung Cancer',
  '{
    "Yes": 32,
    "No": 33
  }',
  5
),
(
  'Do you have a family history of lung cancer?',
  'boolean',
  '{"options": ["Yes", "No"]}',
  FALSE,
  'Lung Cancer',
  '{
    "Yes": 34,
    "No": 35
  }',
  4
);

-- Add some risk assessment results
INSERT INTO akinator_results (condition_name, description, risk_level, min_score, max_score, recommendation, followup_actions, sources)
VALUES
(
  'Breast Cancer - Low Risk',
  'Based on your responses, your risk factors for breast cancer appear to be low. However, regular self-examinations and screenings are still important for early detection.',
  'Low',
  0,
  7,
  'Continue with regular breast self-examinations and discuss appropriate screening schedules with your healthcare provider.',
  '["Perform monthly breast self-examinations", "Schedule regular check-ups with your healthcare provider", "Maintain a healthy lifestyle with regular exercise and balanced diet"]',
  '["American Cancer Society Guidelines for Breast Cancer Screening", "National Cancer Institute - Breast Cancer Prevention"]'
),
(
  'Breast Cancer - Moderate Risk',
  'Your responses indicate some risk factors for breast cancer. While this doesn''t mean you have cancer, it suggests you should be vigilant about screenings and examinations.',
  'Moderate',
  8,
  15,
  'Schedule an appointment with your healthcare provider to discuss your risk factors and appropriate screening schedule.',
  '["Consult with your healthcare provider within the next month", "Consider more frequent screenings based on professional advice", "Learn the proper technique for breast self-examinations"]',
  '["National Comprehensive Cancer Network Guidelines", "Breast Cancer Risk Assessment Tool (Gail Model)"]'
),
(
  'Breast Cancer - High Risk',
  'Your responses indicate several significant risk factors for breast cancer. This doesn''t mean you have cancer, but it suggests the need for prompt medical consultation.',
  'High',
  16,
  100,
  'Schedule an appointment with your healthcare provider as soon as possible to discuss your symptoms and risk factors.',
  '["Seek medical attention within the next week", "Prepare a detailed description of your symptoms for your doctor", "Ask about diagnostic imaging options like mammogram or ultrasound"]',
  '["American College of Radiology", "National Cancer Institute - When to Seek Medical Attention"]'
),
(
  'Skin Cancer - Low Risk',
  'Based on your responses, your risk factors for skin cancer appear to be low. However, sun protection and regular skin checks are still important preventive measures.',
  'Low',
  0,
  7,
  'Continue with sun protection measures and periodic skin self-examinations.',
  '["Use broad-spectrum sunscreen (SPF 30+) daily", "Perform monthly skin self-examinations", "Seek shade during peak sun hours (10am-4pm)"]',
  '["American Academy of Dermatology Guidelines", "Skin Cancer Foundation - Prevention Guidelines"]'
),
(
  'Skin Cancer - Moderate Risk',
  'Your responses indicate some risk factors for skin cancer. While this doesn''t mean you have cancer, it suggests you should be vigilant about sun protection and skin examinations.',
  'Moderate',
  8,
  15,
  'Schedule a skin examination with a dermatologist to evaluate any concerning moles or skin changes.',
  '["Make an appointment with a dermatologist within the next few months", "Document any changing moles with photos", "Practice rigorous sun protection measures"]',
  '["ABCDE Rule for Melanoma Detection", "World Health Organization - UV Radiation and Skin Cancer"]'
),
(
  'Skin Cancer - High Risk',
  'Your responses indicate several significant risk factors for skin cancer. This doesn''t mean you have cancer, but it suggests the need for prompt medical consultation.',
  'High',
  16,
  100,
  'Schedule an appointment with a dermatologist as soon as possible for a thorough skin examination.',
  '["Seek medical attention within the next week", "Take clear photos of concerning moles or skin areas", "Continue rigorous sun protection while waiting for your appointment"]',
  '["National Comprehensive Cancer Network Guidelines for Skin Cancer", "American Cancer Society - When to Seek Medical Attention for Skin Changes"]'
),
(
  'Lung Cancer - Low Risk',
  'Based on your responses, your risk factors for lung cancer appear to be low. Maintaining a smoke-free lifestyle and avoiding second-hand smoke remain important preventive measures.',
  'Low',
  0,
  9,
  'Continue with healthy lifestyle choices and be aware of any respiratory changes.',
  '["Maintain a smoke-free lifestyle", "Avoid second-hand smoke exposure", "Consider testing your home for radon"]',
  '["Centers for Disease Control and Prevention - Lung Cancer Prevention", "American Lung Association Guidelines"]'
),
(
  'Lung Cancer - Moderate Risk',
  'Your responses indicate some risk factors for lung cancer. While this doesn''t mean you have cancer, it suggests you should be vigilant about your respiratory health.',
  'Moderate',
  10,
  19,
  'Discuss your risk factors with your healthcare provider and ask about appropriate screening options.',
  '["Schedule an appointment with your healthcare provider within the next few months", "If you smoke, ask about smoking cessation programs", "Be alert to persistent respiratory symptoms"]',
  '["US Preventive Services Task Force Lung Cancer Screening Recommendations", "National Cancer Institute - Lung Cancer Screening"]'
),
(
  'Lung Cancer - High Risk',
  'Your responses indicate several significant risk factors for lung cancer. This doesn''t mean you have cancer, but it suggests the need for prompt medical consultation.',
  'High',
  20,
  100,
  'Schedule an appointment with your healthcare provider as soon as possible to discuss your symptoms and risk factors.',
  '["Seek medical attention within the next week", "If you smoke, consider immediate steps to quit", "Prepare a detailed list of your symptoms and their duration"]',
  '["American College of Chest Physicians Guidelines", "National Comprehensive Cancer Network - When to Seek Medical Attention for Respiratory Symptoms"]'
); 