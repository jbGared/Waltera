import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GammaCreditsProps {
  className?: string;
  compact?: boolean;
}

export default function GammaCredits({ className = '', compact = false }: GammaCreditsProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour récupérer les crédits depuis le workflow n8n
  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      // TODO: Appeler le webhook n8n pour récupérer les crédits GAMMA
      // const response = await fetch('WEBHOOK_URL_CREDITS');
      // const data = await response.json();
      // setCredits(data.gammaCredits);

      // Pour l'instant, pas de données
      setCredits(null);
    } catch (error) {
      setCredits(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Sparkles className="w-4 h-4 text-white" />
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <span className="text-sm font-semibold text-white">
            {credits !== null ? credits : '---'} crédits
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-base">
          <Sparkles className="w-5 h-5 text-[#407b85]" />
          <span>Crédits disponibles</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#407b85]" />
            <span className="text-gray-500">Chargement...</span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-[#407b85]">
              {credits !== null ? credits : '---'}
            </span>
            <span className="text-gray-500">crédits</span>
          </div>
        )}

        {credits !== null && (
          <p className="text-xs text-gray-500 mt-3">
            Crédits GAMMA pour les analyses de réseau
          </p>
        )}
      </CardContent>
    </Card>
  );
}
