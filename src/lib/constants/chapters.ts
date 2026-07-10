export const EXAM_TYPES = ['JEE Main', 'JEE Advanced', 'NEET', 'MHT-CET A', 'MHT-CET B'] as const;
export const STANDARDS = ['11th', '12th'] as const;
export const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'] as const;

// NOTE: The admin portal fetches chapters dynamically from Supabase.
// This file is the source of truth only for the initial SQL seeds.
// The admin wizard DOES NOT use this directly — it queries the `chapters` table.

export const NCERT_TAXONOMY = {
  '11th': {
    Physics: [
      'Physical World', 'Units and Measurements', 'Motion in a Straight Line',
      'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power',
      'System of Particles and Rotational Motion', 'Gravitation',
      'Mechanical Properties of Solids', 'Mechanical Properties of Fluids',
      'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory',
      'Oscillations', 'Waves'
    ],
    Chemistry: [
      'Some Basic Concepts of Chemistry', 'Structure of Atom',
      'Classification of Elements and Periodicity in Properties',
      'Chemical Bonding and Molecular Structure', 'States of Matter',
      'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen',
      'The s-Block Elements', 'The p-Block Elements',
      'Organic Chemistry – Some Basic Principles and Techniques',
      'Hydrocarbons', 'Environmental Chemistry'
    ],
    Mathematics: [
      'Sets', 'Relations and Functions', 'Trigonometric Functions',
      'Principle of Mathematical Induction', 'Complex Numbers and Quadratic Equations',
      'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem',
      'Sequences and Series', 'Straight Lines', 'Conic Sections',
      'Introduction to Three-Dimensional Geometry', 'Limits and Derivatives',
      'Mathematical Reasoning', 'Statistics', 'Probability'
    ],
    Biology: [
      'The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom',
      'Morphology of Flowering Plants', 'Anatomy of Flowering Plants',
      'Structural Organisation in Animals', 'Cell: The Unit of Life', 'Biomolecules',
      'Cell Cycle and Cell Division', 'Transport in Plants', 'Mineral Nutrition',
      'Photosynthesis in Higher Plants', 'Respiration in Plants',
      'Plant Growth and Development', 'Digestion and Absorption',
      'Breathing and Exchange of Gases', 'Body Fluids and Circulation',
      'Excretory Products and Their Elimination', 'Locomotion and Movement',
      'Neural Control and Coordination', 'Chemical Coordination and Integration'
    ]
  },
  '12th': {
    Physics: [
      'Electric Charges and Fields', 'Electrostatic Potential and Capacitance',
      'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter',
      'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves',
      'Ray Optics and Optical Instruments', 'Wave Optics',
      'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei',
      'Semiconductor Electronics: Materials, Devices and Simple Circuits'
    ],
    Chemistry: [
      'Solutions', 'Electrochemistry', 'Chemical Kinetics',
      'The d- and f-Block Elements', 'Coordination Compounds',
      'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules',
      'Polymers', 'Chemistry in Everyday Life'
    ],
    Mathematics: [
      'Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices',
      'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives',
      'Integrals', 'Applications of Integrals', 'Differential Equations',
      'Vector Algebra', 'Three-Dimensional Geometry', 'Linear Programming', 'Probability'
    ],
    Biology: [
      'Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants',
      'Human Reproduction', 'Reproductive Health',
      'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance',
      'Evolution', 'Human Health and Disease',
      'Strategies for Enhancement in Food Production', 'Microbes in Human Welfare',
      'Biotechnology: Principles and Processes', 'Biotechnology and Its Applications',
      'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation',
      'Environmental Issues'
    ]
  }
};

// Maharashtra State Board (Balbharati) — used for MHT-CET A and B
export const MHTCET_TAXONOMY = {
  '11th': {
    Physics: [
      'Units and Measurements', 'Mathematical Methods', 'Motion in a Plane',
      'Laws of Motion', 'Gravitation', 'Mechanical Properties of Solids',
      'Thermal Properties of Matter', 'Sound', 'Optics', 'Electrostatics',
      'Electric Current Through Conductors', 'Magnetism',
      'Electromagnetic Waves and Communication System', 'Semiconductors'
    ],
    Chemistry: [
      'Some Basic Concepts of Chemistry', 'Introduction to Analytical Chemistry',
      'Basic Analytical Techniques', 'Structure of Atom', 'Chemical Bonding',
      'Redox Reactions', 'Modern Periodic Table', 'Elements of Group 1 and 2',
      'Elements of Group 13, 14 and 15', 'States of Matter', 'Adsorption and Colloids',
      'Chemical Equilibrium', 'Nuclear Chemistry and Radioactivity',
      'Basic Principles of Organic Chemistry', 'Hydrocarbons',
      'Chemistry in Everyday Life'
    ],
    Mathematics: [
      // Part I
      'Angle and its Measurement', 'Trigonometry – I', 'Trigonometry – II',
      'Determinants and Matrices', 'Straight Line', 'Circle', 'Conic Sections',
      'Measures of Dispersion', 'Probability',
      // Part II
      'Complex Numbers', 'Sequences and Series', 'Permutations and Combinations',
      'Methods of Induction and Binomial Theorem', 'Sets and Relations', 'Functions',
      'Limits', 'Continuity', 'Differentiation'
    ],
    Biology: [
      'Living World', 'Systematics of Living Organisms', 'Kingdom Plantae',
      'Kingdom Animalia', 'Cell Structure and Organization', 'Biomolecules',
      'Cell Division', 'Plant Tissues and Anatomy', 'Morphology of Flowering Plants',
      'Animal Tissue', 'Study of Animal Type: Cockroach', 'Photosynthesis',
      'Respiration and Energy Transfer', 'Human Nutrition', 'Excretion and Osmoregulation',
      'Skeleton and Movements'
    ]
  },
  '12th': {
    Physics: [
      'Rotational Dynamics', 'Mechanical Properties of Fluids',
      'Kinetic Theory of Gases and Radiation', 'Thermodynamics', 'Oscillations',
      'Superposition of Waves', 'Wave Optics', 'Electrostatics', 'Current Electricity',
      'Magnetic Fields due to Electric Current', 'Magnetic Materials',
      'Electromagnetic Induction', 'AC Circuits', 'Dual Nature of Radiation and Matter',
      'Structure of Atoms and Nuclei', 'Semiconductor Devices'
    ],
    Chemistry: [
      'Solid State', 'Solutions', 'Ionic Equilibria', 'Chemical Thermodynamics',
      'Electrochemistry', 'Chemical Kinetics', 'Elements of Groups 16, 17 and 18',
      'Transition and Inner Transition Elements', 'Coordination Compounds',
      'Halogen Derivatives', 'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules',
      'Introduction to Polymer Chemistry', 'Green Chemistry and Nanochemistry'
    ],
    Mathematics: [
      // Part I
      'Mathematical Logic', 'Matrices', 'Trigonometric Functions',
      'Pair of Straight Lines', 'Vectors', 'Line and Plane', 'Linear Programming',
      // Part II
      'Differentiation', 'Applications of Derivatives', 'Indefinite Integration',
      'Definite Integration', 'Application of Definite Integration',
      'Differential Equation', 'Probability Distribution', 'Binomial Distribution'
    ],
    Biology: [
      'Reproduction in Lower and Higher Plants', 'Reproduction in Lower and Higher Animals',
      'Inheritance and Variation', 'Molecular Basis of Inheritance',
      'Origin and Evolution of Life', 'Plant Water Relation',
      'Plant Growth and Mineral Nutrition', 'Respiration and Circulation',
      'Control and Co-ordination', 'Human Health and Diseases',
      'Enhancement of Food Production', 'Biotechnology', 'Organisms and Populations',
      'Ecosystems and Energy Flow', 'Biodiversity, Conservation and Environmental Issues'
    ]
  }
};
