import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Shield,
  FileText,
  BookOpen,
  BarChart3,
  Calculator,
  Book,
  Sparkles,
  ArrowUpRight,
  Clock,
  Zap,
  HelpCircle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProfile } from '@/hooks/useProfile';
import { SERVICES, ROUTES } from '@/constants';

// Map des icônes avec couleurs associées
const serviceConfig: Record<string, {
  Icon: any;
  gradient: string;
  accentColor: string;
  bgColor: string;
  glowClass: string;
}> = {
  'FileText': {
    Icon: FileText,
    gradient: 'from-blue-500/8 via-cyan-500/5 to-transparent',
    accentColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    glowClass: 'group-hover:shadow-[0_8px_40px_-12px_rgba(59,130,246,0.25)]'
  },
  'BookOpen': {
    Icon: BookOpen,
    gradient: 'from-violet-500/8 via-purple-500/5 to-transparent',
    accentColor: 'text-violet-600',
    bgColor: 'bg-violet-50',
    glowClass: 'group-hover:shadow-[0_8px_40px_-12px_rgba(139,92,246,0.25)]'
  },
  'BarChart3': {
    Icon: BarChart3,
    gradient: 'from-emerald-500/8 via-green-500/5 to-transparent',
    accentColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    glowClass: 'group-hover:shadow-[0_8px_40px_-12px_rgba(16,185,129,0.25)]'
  },
  'Calculator': {
    Icon: Calculator,
    gradient: 'from-amber-500/8 via-orange-500/5 to-transparent',
    accentColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    glowClass: 'group-hover:shadow-[0_8px_40px_-12px_rgba(245,158,11,0.25)]'
  },
};

// Composant decoratif pour les lignes animees
const AnimatedGridLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Lignes verticales subtiles */}
    <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
    <div className="absolute left-2/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-primary/8 to-transparent" />
    <div className="absolute left-3/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

    {/* Points lumineux animes */}
    <div className="absolute left-1/4 top-1/3 w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse-glow" />
    <div className="absolute left-2/4 top-2/3 w-1.5 h-1.5 rounded-full bg-primary/25 animate-pulse-glow" style={{ animationDelay: '1s' }} />
    <div className="absolute left-3/4 top-1/2 w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse-glow" style={{ animationDelay: '2s' }} />
  </div>
);

// Composant Badge Tag
const ServiceTag = ({ label, variant = 'default' }: { label: string; variant?: 'default' | 'new' | 'ai' }) => {
  const variants = {
    default: 'bg-muted text-muted-foreground border-border/60',
    new: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    ai: 'bg-violet-50 text-violet-700 border-violet-200/60',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full border ${variants[variant]}`}>
      {variant === 'ai' && <Sparkles className="w-2.5 h-2.5" />}
      {variant === 'new' && <Zap className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
};

// Composant Service Card Premium
const ServiceCard = ({
  service,
  index
}: {
  service: typeof SERVICES[number];
  index: number;
}) => {
  const config = serviceConfig[service.icon] || serviceConfig['FileText'];
  const { Icon, gradient, accentColor, bgColor, glowClass } = config;

  // Déterminer les tags
  const tags = service.tags as readonly string[] | undefined;
  const isAI = tags?.includes('IA') || tags?.includes('RAG');
  const hasAudit = tags?.includes('Audit');

  return (
    <Link
      to={service.route}
      className="group relative block"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Card Container */}
      <div className={`
        relative overflow-hidden rounded-2xl
        bg-white
        border border-border/60
        p-8 h-full
        transition-all duration-500 ease-out
        hover:border-primary/25
        hover:-translate-y-1
        shadow-[0_1px_3px_rgba(0,0,0,0.04)]
        ${glowClass}
      `}>
        {/* Background Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        {/* Decorative Corner Accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/[0.03] to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header with Icon */}
          <div className="flex items-start justify-between mb-6">
            <div className={`
              relative w-14 h-14 rounded-xl
              ${bgColor}
              flex items-center justify-center
              transition-all duration-500
              group-hover:scale-110
              group-hover:rotate-2
            `}>
              <Icon className={`w-7 h-7 ${accentColor} transition-colors duration-300`} strokeWidth={1.5} />
            </div>

            {/* Arrow indicator */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/60 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5">
              <ArrowUpRight className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-display font-semibold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-grow">
            {service.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {isAI && <ServiceTag label="IA" variant="ai" />}
            {hasAudit && <ServiceTag label="Nouveau" variant="new" />}
            {service.tags?.slice(0, 2).map((tag) => (
              !['IA', 'RAG', 'Audit'].includes(tag) && (
                <ServiceTag key={tag} label={tag} />
              )
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors duration-300">
            <span>Accéder</span>
            <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </Link>
  );
};

// Composant Admin Card
const AdminCard = ({
  title,
  description,
  icon: Icon,
  route,
  delay = 0
}: {
  title: string;
  description: string;
  icon: any;
  route: string;
  delay?: number;
}) => (
  <Link
    to={route}
    className="group relative block animate-slide-up-fade"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="
      relative overflow-hidden rounded-xl
      bg-white
      border border-border/50
      p-6
      transition-all duration-300
      hover:border-primary/30
      shadow-[0_1px_3px_rgba(0,0,0,0.03)]
      hover:shadow-[0_8px_30px_-12px_rgba(66,123,133,0.2)]
    ">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/8 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <h4 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground truncate">
            {description}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
      </div>
    </div>
  </Link>
);

export default function Dashboard() {
  const { profile } = useProfile();
  const isAdmin = profile?.role === 'admin';

  // Obtenir le prénom ou un fallback
  const firstName = profile?.first_name || 'Utilisateur';

  // Obtenir l'heure pour le message de salutation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="min-h-screen bg-background mesh-gradient">
      {/* Grain Overlay - très subtil */}
      <div className="grain-overlay" />

      {/* Animated Grid */}
      <AnimatedGridLines />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Hero Section */}
        <header className="mb-16 lg:mb-20">
          {/* Greeting Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border/60 mb-6 animate-slide-up-fade shadow-sm">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground tracking-tight mb-4 animate-slide-up-fade stagger-1">
            {getGreeting()},{' '}
            <span className="text-shimmer">{firstName}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-muted-foreground max-w-4xl animate-slide-up-fade stagger-2">
            Accédez à vos outils santé et prévoyance. Sélectionnez un service pour commencer.
          </p>
        </header>

        {/* Services Grid */}
        <section className="mb-16 lg:mb-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-grow bg-gradient-to-r from-border to-transparent" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Services
            </h2>
            <div className="h-px flex-grow bg-gradient-to-l from-border to-transparent" />
          </div>

          {/* 2x2 Grid with hover effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {SERVICES.map((service, index) => (
              <div
                key={service.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <ServiceCard service={service} index={index} />
              </div>
            ))}
          </div>
        </section>

        {/* Help & Resources Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Aide & Ressources
            </h2>
            <div className="h-px flex-grow bg-gradient-to-l from-border to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminCard
              title="Centre d'aide"
              description="Guides et tutoriels d'utilisation"
              icon={BookOpen}
              route={ROUTES.DOCUMENTATION}
              delay={0.5}
            />
            <AdminCard
              title="Historique des conversations"
              description="Retrouvez vos échanges précédents"
              icon={FileText}
              route={ROUTES.CONVERSATIONS}
              delay={0.6}
            />
          </div>
        </section>

        {/* Admin Section */}
        {isAdmin && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Administration
              </h2>
              <div className="h-px flex-grow bg-gradient-to-l from-border to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AdminCard
                title="Gestion Utilisateurs"
                description="Gérez les comptes et permissions"
                icon={Shield}
                route={ROUTES.ADMIN}
                delay={0.5}
              />
              <AdminCard
                title="Documentation Admin"
                description="Guides d'administration"
                icon={Book}
                route={ROUTES.ADMIN_DOCUMENTATION}
                delay={0.6}
              />
              <AdminCard
                title="Documentation Technique"
                description="Base de données et webhooks"
                icon={FileText}
                route={ROUTES.TECHNICAL_DOCUMENTATION}
                delay={0.7}
              />
            </div>
          </section>
        )}

        {/* Bottom Decorative Element */}
        <div className="flex justify-center pt-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-primary/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse-glow" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <div className="w-1 h-1 rounded-full bg-primary/30" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
