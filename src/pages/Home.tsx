import { Link } from 'react-router-dom';
import { Calculator, Network, FileText, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    title: 'Tarificateur Santé',
    description: 'Calculez en temps réel le tarif d\'un contrat de complémentaire santé individuelle',
    icon: Calculator,
    path: '/tarificateur',
    available: true,
  },
  {
    title: 'Analyse Réseau',
    description: 'Analysez et visualisez votre réseau de courtiers et partenaires',
    icon: Network,
    path: '/analyse-reseau',
    available: false,
  },
  {
    title: 'RAG (Recherche Assistée)',
    description: 'Recherchez dans vos documents et bases de connaissances avec l\'IA',
    icon: Brain,
    path: '/rag',
    available: false,
  },
  {
    title: 'CCN (Convention Collective)',
    description: 'Consultez et gérez les conventions collectives nationales',
    icon: FileText,
    path: '/ccn',
    available: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Waltera</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plateforme de gestion d'assurance santé - Outils pour courtiers et gestionnaires
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;

            if (feature.available) {
              return (
                <Link key={feature.path} to={feature.path}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-primary font-medium">
                        Accéder →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            }

            return (
              <Card key={feature.path} className="h-full opacity-60">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-muted-foreground">
                    Bientôt disponible
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Version 1.0.0 - Développé pour les professionnels de l'assurance santé</p>
        </div>
      </div>
    </div>
  );
}
