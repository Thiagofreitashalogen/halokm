import { KnowledgeEntry } from '@/types/knowledge';

export const sampleEntries: KnowledgeEntry[] = [
  {
    id: '1',
    title: 'Brand Identity Redesign - TechCorp',
    category: 'project',
    description: 'Complete brand identity overhaul including logo, visual system, and brand guidelines for a B2B technology company.',
    tags: ['branding', 'visual identity', 'B2B', 'technology'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-20'),
    client: 'TechCorp Inc.',
    projectStatus: 'completed',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-03-20'),
    learnings: [
      'Early stakeholder alignment saves significant revision time',
      'B2B tech clients respond well to data-driven design rationale',
      'Brand guidelines should include digital-first applications'
    ],
  },
  {
    id: '2',
    title: 'Digital Banking Experience - FinServ',
    category: 'project',
    description: 'UX/UI design for a mobile banking application, including user research, prototyping, and design system creation.',
    tags: ['UX design', 'mobile app', 'fintech', 'design system'],
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2024-02-28'),
    client: 'FinServ Bank',
    projectStatus: 'completed',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-02-28'),
    learnings: [
      'Accessibility compliance should be built into the design process from day one',
      'Frequent user testing with real customers reduces late-stage pivots',
      'Design tokens enable faster handoff to development'
    ],
  },
  {
    id: '3',
    title: 'Sustainability Platform Proposal',
    category: 'offer',
    description: 'Proposal for designing a sustainability reporting platform for a Fortune 500 company.',
    tags: ['sustainability', 'enterprise', 'platform design', 'proposal'],
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-15'),
    offerOutcome: 'won',
    offerWorkStatus: 'delivered',
    dateDelivered: new Date('2024-06-10'),
    client: 'GreenCorp Industries',
    winningStrategy: 'Strong case studies in sustainability sector. Competitive pricing with clear deliverables. Team expertise highlighted in presentation.',
  },
  {
    id: '4',
    title: 'E-commerce Redesign Tender',
    category: 'offer',
    description: 'Response to RFP for redesigning a major retail e-commerce platform.',
    tags: ['e-commerce', 'retail', 'redesign', 'RFP'],
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-05-01'),
    offerOutcome: 'lost',
    offerWorkStatus: 'delivered',
    dateDelivered: new Date('2024-04-25'),
    client: 'RetailMax',
    lossReasons: 'Competitor offered lower price. Client preferred agency with more retail-specific portfolio. Timeline proposed was longer than client expected.',
  },
  {
    id: '5',
    title: 'Healthcare Portal Bid',
    category: 'offer',
    description: 'Proposal for patient portal redesign for a regional hospital network.',
    tags: ['healthcare', 'patient portal', 'accessibility', 'UX'],
    createdAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-07-20'),
    offerOutcome: 'pending',
    offerWorkStatus: 'under_development',
    client: 'Regional Health Network',
  },
  {
    id: '6',
    title: 'Design Sprint Framework',
    category: 'method',
    description: 'Our adapted 4-day design sprint methodology for rapid prototyping and validation.',
    tags: ['workshop', 'rapid prototyping', 'methodology', 'innovation'],
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2024-08-01'),
    useCase: 'Use when client needs quick validation of product concepts or when exploring new directions.',
    steps: [
      'Day 1: Understand & Define - Stakeholder interviews, problem mapping',
      'Day 2: Ideate & Decide - Sketching, voting, concept selection',
      'Day 3: Prototype - High-fidelity prototype creation',
      'Day 4: Test & Learn - User testing and synthesis'
    ],
  },
  {
    id: '7',
    title: 'Stakeholder Interview Template',
    category: 'method',
    description: 'Structured interview guide for gathering requirements and understanding client context.',
    tags: ['research', 'interviews', 'discovery', 'template'],
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2024-06-20'),
    useCase: 'Apply during project kickoff and discovery phases to align on business goals and constraints.',
    steps: [
      'Prepare context questions based on industry research',
      'Cover business goals, success metrics, constraints',
      'Explore competitor landscape and differentiation',
      'Document and synthesize findings within 24 hours'
    ],
  },
  {
    id: '8',
    title: 'Service Blueprint Workshop',
    category: 'method',
    description: 'Collaborative workshop format for mapping end-to-end service experiences.',
    tags: ['service design', 'workshop', 'mapping', 'collaboration'],
    createdAt: new Date('2023-08-20'),
    updatedAt: new Date('2024-04-10'),
    useCase: 'Best for complex service offerings with multiple touchpoints and stakeholders.',
    steps: [
      'Pre-workshop: Gather existing journey maps and data',
      'Session 1: Map customer actions and frontstage interactions',
      'Session 2: Map backstage processes and support systems',
      'Session 3: Identify pain points and opportunities',
      'Post-workshop: Synthesize and present recommendations'
    ],
  },
];

export const allTags = Array.from(
  new Set(sampleEntries.flatMap(entry => entry.tags))
).sort();
