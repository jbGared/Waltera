import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Network, Play, FileText, Download, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GammaCredits from '@/components/GammaCredits';
import { WEBHOOKS } from '@/constants';

interface AnalyseResult {
  status: 'idle' | 'running' | 'completed' | 'error';
  gammaUrl?: string;
  pdfUrl?: string;
  message?: string;
  timestamp?: Date;
}

export default function AnalyseFichiers() {
  const [result, setResult] = useState<AnalyseResult>({ status: 'idle' });

  const handleStartAnalyse = async () => {
    setResult({ status: 'running' });

    try {
      const response = await fetch(WEBHOOKS.ANALYSE_FICHIERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_analysis',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du démarrage de l\'analyse');
      }

      const data = await response.json();

      setResult({
        status: 'completed',
        gammaUrl: data.gammaUrl || 'https://gamma.app/docs/Rapport-dAnalyse-Reseau',
        pdfUrl: data.pdfUrl,
        message: data.message || 'Analyse terminée avec succès',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Erreur:', error);
      setResult({
        status: 'error',
        message: 'Une erreur s\'est produite lors de l\'analyse. Veuillez réessayer.',
        timestamp: new Date(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-[#407b85] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-500 bg-opacity-10">
              <span className="text-3xl">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analyse Réseau de Fichiers
              </h1>
              <p className="text-gray-600">
                Optimisez l'organisation de votre système documentaire pour améliorer l'efficacité du RAG
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Card */}
            <Card>
              <CardHeader>
                <CardTitle>Démarrer une analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Lancez une analyse automatique de votre réseau de fichiers pour identifier les opportunités
                  d'amélioration de l'organisation documentaire et de l'efficacité du système RAG.
                </p>

                {result.status === 'idle' && (
                  <Button
                    onClick={handleStartAnalyse}
                    className="w-full bg-[#407b85] hover:bg-[#407b85]/90 text-white h-12"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Lancer l'analyse
                  </Button>
                )}

                {result.status === 'running' && (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-[#407b85] mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">Analyse en cours...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Cette opération peut prendre quelques minutes
                    </p>
                  </div>
                )}

                {result.status === 'completed' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-green-600 bg-green-50 p-4 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Analyse terminée</p>
                        <p className="text-sm text-green-700">{result.message}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {result.gammaUrl && (
                        <a
                          href={result.gammaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#407b85] hover:bg-[#407b85]/5 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-[#407b85]" />
                            <div>
                              <p className="font-medium text-gray-900">Rapport Gamma</p>
                              <p className="text-sm text-gray-500">Visualisation interactive</p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-gray-400" />
                        </a>
                      )}

                      {result.pdfUrl && (
                        <a
                          href={result.pdfUrl}
                          download
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#407b85] hover:bg-[#407b85]/5 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Download className="w-5 h-5 text-[#407b85]" />
                            <div>
                              <p className="font-medium text-gray-900">Télécharger PDF</p>
                              <p className="text-sm text-gray-500">Rapport complet</p>
                            </div>
                          </div>
                          <Download className="w-5 h-5 text-gray-400" />
                        </a>
                      )}
                    </div>

                    <Button
                      onClick={() => setResult({ status: 'idle' })}
                      variant="outline"
                      className="w-full"
                    >
                      Nouvelle analyse
                    </Button>
                  </div>
                )}

                {result.status === 'error' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-lg">
                      <div>
                        <p className="font-semibold">Erreur</p>
                        <p className="text-sm text-red-700">{result.message}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setResult({ status: 'idle' })}
                      variant="outline"
                      className="w-full"
                    >
                      Réessayer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités de l'analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Diagnostic gratuit',
                      description: 'Analyse complète de votre structure documentaire sans frais',
                    },
                    {
                      title: 'Recommandations',
                      description: 'Conseils personnalisés pour améliorer l\'organisation',
                    },
                    {
                      title: 'Optimisation RAG',
                      description: 'Suggestions pour maximiser l\'efficacité du système RAG',
                    },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#407b85]/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[#407b85]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{feature.title}</p>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Crédits GAMMA */}
            <GammaCredits />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">À propos</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-3">
                <p>
                  L'analyse automatique examine votre structure de fichiers et génère un rapport détaillé avec :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Cartographie du réseau</li>
                  <li>Points d'amélioration</li>
                  <li>Recommandations d'organisation</li>
                  <li>Métriques de performance RAG</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formats de sortie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Network className="w-5 h-5 text-[#407b85]" />
                  <div>
                    <p className="font-medium text-sm">Gamma</p>
                    <p className="text-xs text-gray-500">Présentation interactive</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-[#407b85]" />
                  <div>
                    <p className="font-medium text-sm">PDF</p>
                    <p className="text-xs text-gray-500">Rapport téléchargeable</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
