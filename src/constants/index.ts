export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  CHAT_CONTRATS: '/chat/contrats',
  CHAT_CONVENTIONS: '/chat/conventions',
  ANALYSE_FICHIERS: '/analyse',
  ANALYSE_REPORT: '/analyse/report',
  CONVERSATIONS: '/conversations',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  TARIFICATEUR: '/tarificateur',
  ADMIN: '/admin',
  CCN: '/ccn',
  CCN_MANAGEMENT: '/ccn/gestion',
  CCN_MONITORING: '/ccn/monitoring',
  MAPPING: '/mapping',
  DOCUMENTATION: '/documentation',
  ADMIN_DOCUMENTATION: '/admin/docs',
  TECHNICAL_DOCUMENTATION: '/admin/documentation',
} as const;

export const SERVICES = [
  {
    id: 'rag_contrats',
    title: 'Contrats Clients',
    description: 'Interrogez la base de contrats via RAG et obtenez des réponses précises sur les garanties, exclusions et conditions.',
    icon: 'FileText',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-500',
    route: ROUTES.CHAT_CONTRATS,
    tags: ['RAG', 'Contrats', 'IA'],
  },
  {
    id: 'conventions_collectives',
    title: 'Conventions Collectives',
    description: 'Analysez les conventions collectives nationales et posez vos questions sur les droits, congés et classifications.',
    icon: 'BookOpen',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-pink-500',
    route: ROUTES.CCN,
    tags: ['CCN', 'Analyse', 'Droit'],
  },
  {
    id: 'analyse_fichiers',
    title: 'Analyse Réseau Fichiers',
    description: 'Lancez des audits automatiques de votre réseau avec génération de rapports Gamma et export PDF.',
    icon: 'BarChart3',
    color: '#10b981',
    gradient: 'from-green-500 to-emerald-500',
    route: ROUTES.ANALYSE_FICHIERS,
    tags: ['Audit', 'Rapport', 'PDF'],
  },
  {
    id: 'tarificateur',
    title: 'Tarificateur Santé',
    description: 'Calculez en temps réel le tarif d\'un contrat de complémentaire santé individuelle avec détail par bénéficiaire.',
    icon: 'Calculator',
    color: '#f59e0b',
    gradient: 'from-orange-500 to-amber-500',
    route: ROUTES.TARIFICATEUR,
    tags: ['Tarifs', 'Devis', 'Calcul'],
  },
] as const;

export const CHAT_SUGGESTIONS = {
  contrats: [
    "Quelles sont les garanties de ce contrat ?",
    "Y a-t-il des exclusions particulières ?",
    "Quelle est la franchise applicable ?",
    "Comparer avec un autre contrat"
  ],
  conventions: [
    "Quels sont les congés prévus ?",
    "Quel est le préavis de démission ?",
    "Quelles sont les primes obligatoires ?",
    "Quelle classification pour ce poste ?"
  ]
} as const;

export const APP_CONFIG = {
  name: 'WALTERA AI Assistant',
  version: '1.0.0',
  logoMain: 'https://www.waltera.fr/wp-content/uploads/2020/07/logo-waltera-conseil-et-assurances-large.jpg',
  logoSticky: 'https://www.waltera.fr/wp-content/uploads/2020/07/logo-waltera-conseil-et-assurances-large-sticky-2.jpg',
  logoFooter: 'https://www.waltera.fr/wp-content/uploads/2020/07/logo-waltera-footer.jpg',
  logoHeader: '/walteraInverse.png', // Logo inversé pour header
} as const;

export const WEBHOOKS = {
  RAG_CONTRATS: 'https://n8n.srv659987.hstgr.cloud/webhook/walteraClients',
  ANALYSE_FICHIERS: 'https://n8n.srv659987.hstgr.cloud/webhook/d936ee38-2a31-4b2b-9f9c-a12f0063c858',
  CONVENTIONS: 'https://n8n.srv659987.hstgr.cloud/webhook/8cb780f1-ec43-4e4a-8470-559c8b27081f',
  CCN_IMPORT: 'https://n8n.srv659987.hstgr.cloud/webhook/import-ccn',
} as const;
