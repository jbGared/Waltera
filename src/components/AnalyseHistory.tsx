import { useState, useEffect } from 'react';
import { Download, ExternalLink, Calendar, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCompletedAnalyses, type AnalyseReseau } from '@/services/analyseReseauService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AnalyseHistory() {
  const [analyses, setAnalyses] = useState<AnalyseReseau[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getCompletedAnalyses();

    if (result.success && result.data) {
      setAnalyses(result.data);
    } else {
      setError(result.error || 'Erreur lors du chargement de l\'historique');
    }

    setIsLoading(false);
  };

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return 'Date inconnue';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#407b85]" />
            <span className="ml-3 text-gray-500">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <Button
            onClick={loadAnalyses}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            Aucune analyse effectuée pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Historique des analyses ({analyses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {analyses.map((analyse) => (
            <div
              key={analyse.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#407b85] hover:bg-[#407b85]/5 transition-all"
            >
              {/* En-tête */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(analyse.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-medium text-[#407b85]">
                  <Zap className="w-3 h-3" />
                  <span>{analyse.credits_deducted} crédits</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {analyse.gamma_url && (
                  <a
                    href={analyse.gamma_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-[#407b85]" />
                      <span className="text-sm font-medium">Voir sur Gamma</span>
                    </div>
                  </a>
                )}

                {analyse.export_url && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = analyse.export_url!;
                      link.download = `analyse-reseau-${new Date(analyse.created_at).toLocaleDateString('fr-FR')}.pdf`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-[#407b85]" />
                      <span className="text-sm font-medium">Télécharger PDF</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
