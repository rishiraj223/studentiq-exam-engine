-- ==========================================
-- SEED: MAHARASHTRA STATE BOARD CHAPTERS
-- For MHT-CET A (PCM) and MHT-CET B (PCB)
-- Run AFTER seed_chapters.sql
-- ==========================================

-- First, remove the placeholder rows we added earlier
DELETE FROM public.chapters WHERE exam_type IN ('MHT-CET A', 'MHT-CET B');

-- ==============================================
-- MHT-CET A = Physics + Chemistry + Mathematics
-- MHT-CET B = Physics + Chemistry + Biology
-- Physics and Chemistry are shared between A and B
-- ==============================================


-- ===== 11TH PHYSICS (Shared: MHT-CET A & B) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET A', '11th', 'Physics', 'Units and Measurements', 1),
  ('MHT-CET A', '11th', 'Physics', 'Mathematical Methods', 2),
  ('MHT-CET A', '11th', 'Physics', 'Motion in a Plane', 3),
  ('MHT-CET A', '11th', 'Physics', 'Laws of Motion', 4),
  ('MHT-CET A', '11th', 'Physics', 'Gravitation', 5),
  ('MHT-CET A', '11th', 'Physics', 'Mechanical Properties of Solids', 6),
  ('MHT-CET A', '11th', 'Physics', 'Thermal Properties of Matter', 7),
  ('MHT-CET A', '11th', 'Physics', 'Sound', 8),
  ('MHT-CET A', '11th', 'Physics', 'Optics', 9),
  ('MHT-CET A', '11th', 'Physics', 'Electrostatics', 10),
  ('MHT-CET A', '11th', 'Physics', 'Electric Current Through Conductors', 11),
  ('MHT-CET A', '11th', 'Physics', 'Magnetism', 12),
  ('MHT-CET A', '11th', 'Physics', 'Electromagnetic Waves and Communication System', 13),
  ('MHT-CET A', '11th', 'Physics', 'Semiconductors', 14)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number)
SELECT 'MHT-CET B', standard, subject, name, chapter_number
FROM public.chapters WHERE exam_type = 'MHT-CET A' AND standard = '11th' AND subject = 'Physics'
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH PHYSICS (Shared: MHT-CET A & B) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET A', '12th', 'Physics', 'Rotational Dynamics', 1),
  ('MHT-CET A', '12th', 'Physics', 'Mechanical Properties of Fluids', 2),
  ('MHT-CET A', '12th', 'Physics', 'Kinetic Theory of Gases and Radiation', 3),
  ('MHT-CET A', '12th', 'Physics', 'Thermodynamics', 4),
  ('MHT-CET A', '12th', 'Physics', 'Oscillations', 5),
  ('MHT-CET A', '12th', 'Physics', 'Superposition of Waves', 6),
  ('MHT-CET A', '12th', 'Physics', 'Wave Optics', 7),
  ('MHT-CET A', '12th', 'Physics', 'Electrostatics', 8),
  ('MHT-CET A', '12th', 'Physics', 'Current Electricity', 9),
  ('MHT-CET A', '12th', 'Physics', 'Magnetic Fields due to Electric Current', 10),
  ('MHT-CET A', '12th', 'Physics', 'Magnetic Materials', 11),
  ('MHT-CET A', '12th', 'Physics', 'Electromagnetic Induction', 12),
  ('MHT-CET A', '12th', 'Physics', 'AC Circuits', 13),
  ('MHT-CET A', '12th', 'Physics', 'Dual Nature of Radiation and Matter', 14),
  ('MHT-CET A', '12th', 'Physics', 'Structure of Atoms and Nuclei', 15),
  ('MHT-CET A', '12th', 'Physics', 'Semiconductor Devices', 16)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number)
SELECT 'MHT-CET B', standard, subject, name, chapter_number
FROM public.chapters WHERE exam_type = 'MHT-CET A' AND standard = '12th' AND subject = 'Physics'
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;


-- ===== 11TH CHEMISTRY (Shared: MHT-CET A & B) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET A', '11th', 'Chemistry', 'Some Basic Concepts of Chemistry', 1),
  ('MHT-CET A', '11th', 'Chemistry', 'Introduction to Analytical Chemistry', 2),
  ('MHT-CET A', '11th', 'Chemistry', 'Basic Analytical Techniques', 3),
  ('MHT-CET A', '11th', 'Chemistry', 'Structure of Atom', 4),
  ('MHT-CET A', '11th', 'Chemistry', 'Chemical Bonding', 5),
  ('MHT-CET A', '11th', 'Chemistry', 'Redox Reactions', 6),
  ('MHT-CET A', '11th', 'Chemistry', 'Modern Periodic Table', 7),
  ('MHT-CET A', '11th', 'Chemistry', 'Elements of Group 1 and 2', 8),
  ('MHT-CET A', '11th', 'Chemistry', 'Elements of Group 13, 14 and 15', 9),
  ('MHT-CET A', '11th', 'Chemistry', 'States of Matter', 10),
  ('MHT-CET A', '11th', 'Chemistry', 'Adsorption and Colloids', 11),
  ('MHT-CET A', '11th', 'Chemistry', 'Chemical Equilibrium', 12),
  ('MHT-CET A', '11th', 'Chemistry', 'Nuclear Chemistry and Radioactivity', 13),
  ('MHT-CET A', '11th', 'Chemistry', 'Basic Principles of Organic Chemistry', 14),
  ('MHT-CET A', '11th', 'Chemistry', 'Hydrocarbons', 15),
  ('MHT-CET A', '11th', 'Chemistry', 'Chemistry in Everyday Life', 16)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number)
SELECT 'MHT-CET B', standard, subject, name, chapter_number
FROM public.chapters WHERE exam_type = 'MHT-CET A' AND standard = '11th' AND subject = 'Chemistry'
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH CHEMISTRY (Shared: MHT-CET A & B) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET A', '12th', 'Chemistry', 'Solid State', 1),
  ('MHT-CET A', '12th', 'Chemistry', 'Solutions', 2),
  ('MHT-CET A', '12th', 'Chemistry', 'Ionic Equilibria', 3),
  ('MHT-CET A', '12th', 'Chemistry', 'Chemical Thermodynamics', 4),
  ('MHT-CET A', '12th', 'Chemistry', 'Electrochemistry', 5),
  ('MHT-CET A', '12th', 'Chemistry', 'Chemical Kinetics', 6),
  ('MHT-CET A', '12th', 'Chemistry', 'Elements of Groups 16, 17 and 18', 7),
  ('MHT-CET A', '12th', 'Chemistry', 'Transition and Inner Transition Elements', 8),
  ('MHT-CET A', '12th', 'Chemistry', 'Coordination Compounds', 9),
  ('MHT-CET A', '12th', 'Chemistry', 'Halogen Derivatives', 10),
  ('MHT-CET A', '12th', 'Chemistry', 'Alcohols, Phenols and Ethers', 11),
  ('MHT-CET A', '12th', 'Chemistry', 'Aldehydes, Ketones and Carboxylic Acids', 12),
  ('MHT-CET A', '12th', 'Chemistry', 'Amines', 13),
  ('MHT-CET A', '12th', 'Chemistry', 'Biomolecules', 14),
  ('MHT-CET A', '12th', 'Chemistry', 'Introduction to Polymer Chemistry', 15),
  ('MHT-CET A', '12th', 'Chemistry', 'Green Chemistry and Nanochemistry', 16)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number)
SELECT 'MHT-CET B', standard, subject, name, chapter_number
FROM public.chapters WHERE exam_type = 'MHT-CET A' AND standard = '12th' AND subject = 'Chemistry'
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;


-- ===== 11TH MATHEMATICS (MHT-CET A only — Part I + Part II combined) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET A', '11th', 'Mathematics', 'Angle and its Measurement', 1),
  ('MHT-CET A', '11th', 'Mathematics', 'Trigonometry – I', 2),
  ('MHT-CET A', '11th', 'Mathematics', 'Trigonometry – II', 3),
  ('MHT-CET A', '11th', 'Mathematics', 'Determinants and Matrices', 4),
  ('MHT-CET A', '11th', 'Mathematics', 'Straight Line', 5),
  ('MHT-CET A', '11th', 'Mathematics', 'Circle', 6),
  ('MHT-CET A', '11th', 'Mathematics', 'Conic Sections', 7),
  ('MHT-CET A', '11th', 'Mathematics', 'Measures of Dispersion', 8),
  ('MHT-CET A', '11th', 'Mathematics', 'Probability', 9),
  ('MHT-CET A', '11th', 'Mathematics', 'Complex Numbers', 10),
  ('MHT-CET A', '11th', 'Mathematics', 'Sequences and Series', 11),
  ('MHT-CET A', '11th', 'Mathematics', 'Permutations and Combinations', 12),
  ('MHT-CET A', '11th', 'Mathematics', 'Methods of Induction and Binomial Theorem', 13),
  ('MHT-CET A', '11th', 'Mathematics', 'Sets and Relations', 14),
  ('MHT-CET A', '11th', 'Mathematics', 'Functions', 15),
  ('MHT-CET A', '11th', 'Mathematics', 'Limits', 16),
  ('MHT-CET A', '11th', 'Mathematics', 'Continuity', 17),
  ('MHT-CET A', '11th', 'Mathematics', 'Differentiation', 18)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH MATHEMATICS (MHT-CET A only — Part I + Part II combined) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET A', '12th', 'Mathematics', 'Mathematical Logic', 1),
  ('MHT-CET A', '12th', 'Mathematics', 'Matrices', 2),
  ('MHT-CET A', '12th', 'Mathematics', 'Trigonometric Functions', 3),
  ('MHT-CET A', '12th', 'Mathematics', 'Pair of Straight Lines', 4),
  ('MHT-CET A', '12th', 'Mathematics', 'Vectors', 5),
  ('MHT-CET A', '12th', 'Mathematics', 'Line and Plane', 6),
  ('MHT-CET A', '12th', 'Mathematics', 'Linear Programming', 7),
  ('MHT-CET A', '12th', 'Mathematics', 'Differentiation', 8),
  ('MHT-CET A', '12th', 'Mathematics', 'Applications of Derivatives', 9),
  ('MHT-CET A', '12th', 'Mathematics', 'Indefinite Integration', 10),
  ('MHT-CET A', '12th', 'Mathematics', 'Definite Integration', 11),
  ('MHT-CET A', '12th', 'Mathematics', 'Application of Definite Integration', 12),
  ('MHT-CET A', '12th', 'Mathematics', 'Differential Equation', 13),
  ('MHT-CET A', '12th', 'Mathematics', 'Probability Distribution', 14),
  ('MHT-CET A', '12th', 'Mathematics', 'Binomial Distribution', 15)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;


-- ===== 11TH BIOLOGY (MHT-CET B only) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET B', '11th', 'Biology', 'Living World', 1),
  ('MHT-CET B', '11th', 'Biology', 'Systematics of Living Organisms', 2),
  ('MHT-CET B', '11th', 'Biology', 'Kingdom Plantae', 3),
  ('MHT-CET B', '11th', 'Biology', 'Kingdom Animalia', 4),
  ('MHT-CET B', '11th', 'Biology', 'Cell Structure and Organization', 5),
  ('MHT-CET B', '11th', 'Biology', 'Biomolecules', 6),
  ('MHT-CET B', '11th', 'Biology', 'Cell Division', 7),
  ('MHT-CET B', '11th', 'Biology', 'Plant Tissues and Anatomy', 8),
  ('MHT-CET B', '11th', 'Biology', 'Morphology of Flowering Plants', 9),
  ('MHT-CET B', '11th', 'Biology', 'Animal Tissue', 10),
  ('MHT-CET B', '11th', 'Biology', 'Study of Animal Type: Cockroach', 11),
  ('MHT-CET B', '11th', 'Biology', 'Photosynthesis', 12),
  ('MHT-CET B', '11th', 'Biology', 'Respiration and Energy Transfer', 13),
  ('MHT-CET B', '11th', 'Biology', 'Human Nutrition', 14),
  ('MHT-CET B', '11th', 'Biology', 'Excretion and Osmoregulation', 15),
  ('MHT-CET B', '11th', 'Biology', 'Skeleton and Movements', 16)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;

-- ===== 12TH BIOLOGY (MHT-CET B only) =====
INSERT INTO public.chapters (exam_type, standard, subject, name, chapter_number) VALUES
  ('MHT-CET B', '12th', 'Biology', 'Reproduction in Lower and Higher Plants', 1),
  ('MHT-CET B', '12th', 'Biology', 'Reproduction in Lower and Higher Animals', 2),
  ('MHT-CET B', '12th', 'Biology', 'Inheritance and Variation', 3),
  ('MHT-CET B', '12th', 'Biology', 'Molecular Basis of Inheritance', 4),
  ('MHT-CET B', '12th', 'Biology', 'Origin and Evolution of Life', 5),
  ('MHT-CET B', '12th', 'Biology', 'Plant Water Relation', 6),
  ('MHT-CET B', '12th', 'Biology', 'Plant Growth and Mineral Nutrition', 7),
  ('MHT-CET B', '12th', 'Biology', 'Respiration and Circulation', 8),
  ('MHT-CET B', '12th', 'Biology', 'Control and Co-ordination', 9),
  ('MHT-CET B', '12th', 'Biology', 'Human Health and Diseases', 10),
  ('MHT-CET B', '12th', 'Biology', 'Enhancement of Food Production', 11),
  ('MHT-CET B', '12th', 'Biology', 'Biotechnology', 12),
  ('MHT-CET B', '12th', 'Biology', 'Organisms and Populations', 13),
  ('MHT-CET B', '12th', 'Biology', 'Ecosystems and Energy Flow', 14),
  ('MHT-CET B', '12th', 'Biology', 'Biodiversity, Conservation and Environmental Issues', 15)
ON CONFLICT (exam_type, standard, subject, name) DO NOTHING;
