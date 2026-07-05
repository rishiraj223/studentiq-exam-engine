-- ==========================================
-- SEED: NCERT CHAPTERS FOR JEE & NEET
-- Run this AFTER the admin_schema_update.sql
-- ==========================================

-- We insert for both JEE Main and NEET (they share NCERT syllabus)
-- JEE Advanced has a subset — we mark it with the same chapters but teachers know what applies

-- Helper to insert for multiple exams at once (we insert separately per exam)

-- ===== 11TH PHYSICS =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('JEE Main', '11th', 'Physics', 'Physical World', 1),
  ('JEE Main', '11th', 'Physics', 'Units and Measurements', 2),
  ('JEE Main', '11th', 'Physics', 'Motion in a Straight Line', 3),
  ('JEE Main', '11th', 'Physics', 'Motion in a Plane', 4),
  ('JEE Main', '11th', 'Physics', 'Laws of Motion', 5),
  ('JEE Main', '11th', 'Physics', 'Work, Energy and Power', 6),
  ('JEE Main', '11th', 'Physics', 'System of Particles and Rotational Motion', 7),
  ('JEE Main', '11th', 'Physics', 'Gravitation', 8),
  ('JEE Main', '11th', 'Physics', 'Mechanical Properties of Solids', 9),
  ('JEE Main', '11th', 'Physics', 'Mechanical Properties of Fluids', 10),
  ('JEE Main', '11th', 'Physics', 'Thermal Properties of Matter', 11),
  ('JEE Main', '11th', 'Physics', 'Thermodynamics', 12),
  ('JEE Main', '11th', 'Physics', 'Kinetic Theory', 13),
  ('JEE Main', '11th', 'Physics', 'Oscillations', 14),
  ('JEE Main', '11th', 'Physics', 'Waves', 15)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 11TH CHEMISTRY =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('JEE Main', '11th', 'Chemistry', 'Some Basic Concepts of Chemistry', 1),
  ('JEE Main', '11th', 'Chemistry', 'Structure of Atom', 2),
  ('JEE Main', '11th', 'Chemistry', 'Classification of Elements and Periodicity in Properties', 3),
  ('JEE Main', '11th', 'Chemistry', 'Chemical Bonding and Molecular Structure', 4),
  ('JEE Main', '11th', 'Chemistry', 'States of Matter', 5),
  ('JEE Main', '11th', 'Chemistry', 'Thermodynamics', 6),
  ('JEE Main', '11th', 'Chemistry', 'Equilibrium', 7),
  ('JEE Main', '11th', 'Chemistry', 'Redox Reactions', 8),
  ('JEE Main', '11th', 'Chemistry', 'Hydrogen', 9),
  ('JEE Main', '11th', 'Chemistry', 'The s-Block Elements', 10),
  ('JEE Main', '11th', 'Chemistry', 'The p-Block Elements', 11),
  ('JEE Main', '11th', 'Chemistry', 'Organic Chemistry – Some Basic Principles and Techniques', 12),
  ('JEE Main', '11th', 'Chemistry', 'Hydrocarbons', 13),
  ('JEE Main', '11th', 'Chemistry', 'Environmental Chemistry', 14)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 11TH MATHEMATICS =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('JEE Main', '11th', 'Mathematics', 'Sets', 1),
  ('JEE Main', '11th', 'Mathematics', 'Relations and Functions', 2),
  ('JEE Main', '11th', 'Mathematics', 'Trigonometric Functions', 3),
  ('JEE Main', '11th', 'Mathematics', 'Principle of Mathematical Induction', 4),
  ('JEE Main', '11th', 'Mathematics', 'Complex Numbers and Quadratic Equations', 5),
  ('JEE Main', '11th', 'Mathematics', 'Linear Inequalities', 6),
  ('JEE Main', '11th', 'Mathematics', 'Permutations and Combinations', 7),
  ('JEE Main', '11th', 'Mathematics', 'Binomial Theorem', 8),
  ('JEE Main', '11th', 'Mathematics', 'Sequences and Series', 9),
  ('JEE Main', '11th', 'Mathematics', 'Straight Lines', 10),
  ('JEE Main', '11th', 'Mathematics', 'Conic Sections', 11),
  ('JEE Main', '11th', 'Mathematics', 'Introduction to Three-Dimensional Geometry', 12),
  ('JEE Main', '11th', 'Mathematics', 'Limits and Derivatives', 13),
  ('JEE Main', '11th', 'Mathematics', 'Mathematical Reasoning', 14),
  ('JEE Main', '11th', 'Mathematics', 'Statistics', 15),
  ('JEE Main', '11th', 'Mathematics', 'Probability', 16)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH PHYSICS =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('JEE Main', '12th', 'Physics', 'Electric Charges and Fields', 1),
  ('JEE Main', '12th', 'Physics', 'Electrostatic Potential and Capacitance', 2),
  ('JEE Main', '12th', 'Physics', 'Current Electricity', 3),
  ('JEE Main', '12th', 'Physics', 'Moving Charges and Magnetism', 4),
  ('JEE Main', '12th', 'Physics', 'Magnetism and Matter', 5),
  ('JEE Main', '12th', 'Physics', 'Electromagnetic Induction', 6),
  ('JEE Main', '12th', 'Physics', 'Alternating Current', 7),
  ('JEE Main', '12th', 'Physics', 'Electromagnetic Waves', 8),
  ('JEE Main', '12th', 'Physics', 'Ray Optics and Optical Instruments', 9),
  ('JEE Main', '12th', 'Physics', 'Wave Optics', 10),
  ('JEE Main', '12th', 'Physics', 'Dual Nature of Radiation and Matter', 11),
  ('JEE Main', '12th', 'Physics', 'Atoms', 12),
  ('JEE Main', '12th', 'Physics', 'Nuclei', 13),
  ('JEE Main', '12th', 'Physics', 'Semiconductor Electronics: Materials, Devices and Simple Circuits', 14)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH CHEMISTRY =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('JEE Main', '12th', 'Chemistry', 'Solutions', 1),
  ('JEE Main', '12th', 'Chemistry', 'Electrochemistry', 2),
  ('JEE Main', '12th', 'Chemistry', 'Chemical Kinetics', 3),
  ('JEE Main', '12th', 'Chemistry', 'The d- and f-Block Elements', 4),
  ('JEE Main', '12th', 'Chemistry', 'Coordination Compounds', 5),
  ('JEE Main', '12th', 'Chemistry', 'Haloalkanes and Haloarenes', 6),
  ('JEE Main', '12th', 'Chemistry', 'Alcohols, Phenols and Ethers', 7),
  ('JEE Main', '12th', 'Chemistry', 'Aldehydes, Ketones and Carboxylic Acids', 8),
  ('JEE Main', '12th', 'Chemistry', 'Amines', 9),
  ('JEE Main', '12th', 'Chemistry', 'Biomolecules', 10),
  ('JEE Main', '12th', 'Chemistry', 'Polymers', 11),
  ('JEE Main', '12th', 'Chemistry', 'Chemistry in Everyday Life', 12)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH MATHEMATICS =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('JEE Main', '12th', 'Mathematics', 'Relations and Functions', 1),
  ('JEE Main', '12th', 'Mathematics', 'Inverse Trigonometric Functions', 2),
  ('JEE Main', '12th', 'Mathematics', 'Matrices', 3),
  ('JEE Main', '12th', 'Mathematics', 'Determinants', 4),
  ('JEE Main', '12th', 'Mathematics', 'Continuity and Differentiability', 5),
  ('JEE Main', '12th', 'Mathematics', 'Applications of Derivatives', 6),
  ('JEE Main', '12th', 'Mathematics', 'Integrals', 7),
  ('JEE Main', '12th', 'Mathematics', 'Applications of Integrals', 8),
  ('JEE Main', '12th', 'Mathematics', 'Differential Equations', 9),
  ('JEE Main', '12th', 'Mathematics', 'Vector Algebra', 10),
  ('JEE Main', '12th', 'Mathematics', 'Three-Dimensional Geometry', 11),
  ('JEE Main', '12th', 'Mathematics', 'Linear Programming', 12),
  ('JEE Main', '12th', 'Mathematics', 'Probability', 13)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== NOW COPY ALL JEE MAIN CHAPTERS TO JEE ADVANCED =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number)
SELECT 'JEE Advanced', standard, subject, name, chapter_number
FROM public.chapters WHERE exam_type = 'JEE Main'
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== NOW COPY PHYSICS + CHEMISTRY TO NEET, AND ADD BIOLOGY =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number)
SELECT 'NEET', standard, subject, name, chapter_number
FROM public.chapters WHERE exam_type = 'JEE Main' AND subject IN ('Physics', 'Chemistry')
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 11TH BIOLOGY FOR NEET =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('NEET', '11th', 'Biology', 'The Living World', 1),
  ('NEET', '11th', 'Biology', 'Biological Classification', 2),
  ('NEET', '11th', 'Biology', 'Plant Kingdom', 3),
  ('NEET', '11th', 'Biology', 'Animal Kingdom', 4),
  ('NEET', '11th', 'Biology', 'Morphology of Flowering Plants', 5),
  ('NEET', '11th', 'Biology', 'Anatomy of Flowering Plants', 6),
  ('NEET', '11th', 'Biology', 'Structural Organisation in Animals', 7),
  ('NEET', '11th', 'Biology', 'Cell: The Unit of Life', 8),
  ('NEET', '11th', 'Biology', 'Biomolecules', 9),
  ('NEET', '11th', 'Biology', 'Cell Cycle and Cell Division', 10),
  ('NEET', '11th', 'Biology', 'Transport in Plants', 11),
  ('NEET', '11th', 'Biology', 'Mineral Nutrition', 12),
  ('NEET', '11th', 'Biology', 'Photosynthesis in Higher Plants', 13),
  ('NEET', '11th', 'Biology', 'Respiration in Plants', 14),
  ('NEET', '11th', 'Biology', 'Plant Growth and Development', 15),
  ('NEET', '11th', 'Biology', 'Digestion and Absorption', 16),
  ('NEET', '11th', 'Biology', 'Breathing and Exchange of Gases', 17),
  ('NEET', '11th', 'Biology', 'Body Fluids and Circulation', 18),
  ('NEET', '11th', 'Biology', 'Excretory Products and Their Elimination', 19),
  ('NEET', '11th', 'Biology', 'Locomotion and Movement', 20),
  ('NEET', '11th', 'Biology', 'Neural Control and Coordination', 21),
  ('NEET', '11th', 'Biology', 'Chemical Coordination and Integration', 22)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH BIOLOGY FOR NEET =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('NEET', '12th', 'Biology', 'Reproduction in Organisms', 1),
  ('NEET', '12th', 'Biology', 'Sexual Reproduction in Flowering Plants', 2),
  ('NEET', '12th', 'Biology', 'Human Reproduction', 3),
  ('NEET', '12th', 'Biology', 'Reproductive Health', 4),
  ('NEET', '12th', 'Biology', 'Principles of Inheritance and Variation', 5),
  ('NEET', '12th', 'Biology', 'Molecular Basis of Inheritance', 6),
  ('NEET', '12th', 'Biology', 'Evolution', 7),
  ('NEET', '12th', 'Biology', 'Human Health and Disease', 8),
  ('NEET', '12th', 'Biology', 'Strategies for Enhancement in Food Production', 9),
  ('NEET', '12th', 'Biology', 'Microbes in Human Welfare', 10),
  ('NEET', '12th', 'Biology', 'Biotechnology: Principles and Processes', 11),
  ('NEET', '12th', 'Biology', 'Biotechnology and Its Applications', 12),
  ('NEET', '12th', 'Biology', 'Organisms and Populations', 13),
  ('NEET', '12th', 'Biology', 'Ecosystem', 14),
  ('NEET', '12th', 'Biology', 'Biodiversity and Conservation', 15),
  ('NEET', '12th', 'Biology', 'Environmental Issues', 16)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== MHT-CET PLACEHOLDERS (Maharashtra Board — chapters TBD) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET A', '11th', 'Physics', 'MHT-CET A chapters coming soon', 1),
  ('MHT-CET A', '12th', 'Physics', 'MHT-CET A chapters coming soon', 1),
  ('MHT-CET B', '11th', 'Biology', 'MHT-CET B chapters coming soon', 1),
  ('MHT-CET B', '12th', 'Biology', 'MHT-CET B chapters coming soon', 1)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;
