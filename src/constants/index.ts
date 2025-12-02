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
} as const;

export const SERVICES = [
  {
    id: 'rag_contrats',
    title: 'Contrats Clients',
    description: 'Interrogez la base de contrats via RAG et obtenez des réponses précises sur les garanties, exclusions et conditions.',
    icon: '📋',
    color: '#213d65',
    gradient: 'from-[#213d65] to-[#2d4f7c]',
    route: ROUTES.CHAT_CONTRATS,
    tags: ['RAG', 'Contrats', 'IA'],
  },
  {
    id: 'conventions_collectives',
    title: 'Conventions Collectives',
    description: 'Analysez les conventions collectives nationales et posez vos questions sur les droits, congés et classifications.',
    icon: '📚',
    color: '#2d4f7c',
    gradient: 'from-[#2d4f7c] to-[#1a3050]',
    route: ROUTES.CHAT_CONVENTIONS,
    tags: ['CCN', 'Analyse', 'Droit'],
  },
  {
    id: 'analyse_fichiers',
    title: 'Analyse Réseau Fichiers',
    description: 'Lancez des audits automatiques de votre réseau avec génération de rapports Gamma et export PDF.',
    icon: '📊',
    color: '#1a3050',
    gradient: 'from-[#1a3050] to-[#213d65]',
    route: ROUTES.ANALYSE_FICHIERS,
    tags: ['Audit', 'Rapport', 'PDF'],
  },
  {
    id: 'tarificateur',
    title: 'Tarificateur Santé',
    description: 'Calculez en temps réel le tarif d\'un contrat de complémentaire santé individuelle avec détail par bénéficiaire.',
    icon: '💰',
    color: '#407b85',
    gradient: 'from-[#407b85] to-[#213d65]',
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
  logoHeader: '/logo-waltera-conseil-et-assurances-large.jpg', // Logo pour header teal
} as const;

export const WEBHOOKS = {
  RAG_CONTRATS: 'https://n8n.srv659987.hstgr.cloud/webhook/walteraAiAgent',
  ANALYSE_FICHIERS: 'https://n8n.srv659987.hstgr.cloud/webhook/d936ee38-2a31-4b2b-9f9c-a12f0063c858',
  CONVENTIONS: '', // Pas encore configuré
} as const;
