import { useState, useEffect } from 'react';
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTotalCreditsConsumed, getLatestCreditsRemaining } from '@/services/analyseReseauService';

interface GammaCreditsProps {
  className?: string;
  compact?: boolean;
  onUpdate?: () => void;
}

export default function GammaCredits({ className = '', compact = false, onUpdate }: GammaCreditsProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [totalConsumed, setTotalConsumed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour récupérer les crédits depuis Supabase
  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      // Récupérer les crédits disponibles depuis la dernière analyse
      const creditsResult = await getLatestCreditsRemaining();
      if (creditsResult.success && creditsResult.credits !== undefined) {
        setCredits(creditsResult.credits);
      }

      // Récupérer le total des crédits consommés
      const consumedResult = await getTotalCreditsConsumed();
      if (consumedResult.success && consumedResult.total !== undefined) {
        setTotalConsumed(consumedResult.total);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des crédits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  // Permettre le rafraîchissement externe
  useEffect(() => {
    if (onUpdate) {
      fetchCredits();
    }
  }, [onUpdate]);

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
          <span>Crédits GAMMA</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#407b85]" />
            <span className="text-gray-500">Chargement...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Crédits consommés */}
            {totalConsumed > 0 && (
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-600">Crédits consommés</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-orange-500">
                    {totalConsumed}
                  </span>
                  <span className="text-sm text-gray-500">crédits</span>
                </div>
              </div>
            )}

            {/* Crédits disponibles */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#407b85]" />
                <span className="text-sm font-medium text-gray-600">Crédits disponibles</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-[#407b85]">
                  {credits !== null ? credits : '---'}
                </span>
                <span className="text-sm text-gray-500">crédits</span>
              </div>
            </div>

            {credits !== null && (
              <p className="text-xs text-gray-500">
                Pour les analyses de réseau de fichiers
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
