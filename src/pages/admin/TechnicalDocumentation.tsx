import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Github, Zap, Server, Code, FileText, Settings, Book, Cloud, ExternalLink, Shield, ShieldOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { WEBHOOKS } from '@/constants';

// Types pour les Edge Functions
interface EdgeFunction {
  id: string;
  slug: string;
  name: string;
  version: number;
  status: string;
  verify_jwt: boolean;
  created_at: number;
  updated_at: number;
}

// Descriptions détaillées des fonctions
const functionDescriptions: Record<string, { description: string; endpoint: string; method: string; auth: string; params?: string }> = {
  'recherche-contrats': {
    description: 'Recherche vectorielle (RAG) dans les documents clients avec streaming de réponses IA via Mistral.',
    endpoint: '/functions/v1/recherche-contrats',
    method: 'POST',
    auth: 'Bearer Token (JWT)',
    params: '{ query: string, session_id?: string, messages?: array }'
  },
  'recherche-ccn': {
    description: 'Recherche vectorielle dans les conventions collectives nationales avec streaming IA.',
    endpoint: '/functions/v1/recherche-ccn',
    method: 'POST',
    auth: 'Aucune (public)',
    params: '{ query: string, session_id?: string, messages?: array }'
  },
  'import-ccn': {
    description: 'Import de conventions collectives depuis l\'API Legifrance avec chunking et vectorisation.',
    endpoint: '/functions/v1/import-ccn',
    method: 'POST',
    auth: 'Bearer Token (anon key)',
    params: '{ idcc_list: string[], force_update?: boolean }'
  },
  'export-ccn': {
    description: 'Export d\'une convention collective au format Markdown avec tous ses articles.',
    endpoint: '/functions/v1/export-ccn',
    method: 'POST',
    auth: 'Aucune (public)',
    params: '{ idcc: string }'
  },
  'analyze-ccn-compliance': {
    description: 'Analyse de conformité d\'un contrat par rapport aux obligations d\'une CCN via IA Mistral.',
    endpoint: '/functions/v1/analyze-ccn-compliance',
    method: 'POST',
    auth: 'Bearer Token (JWT)',
    params: '{ idcc: string, contract_text: string }'
  },
  'send-ccn-alerts-email': {
    description: 'Envoi d\'emails d\'alerte lors de modifications détectées sur les CCN surveillées.',
    endpoint: '/functions/v1/send-ccn-alerts-email',
    method: 'POST',
    auth: 'Aucune (appelé par cron)',
    params: '{ alerts: array, recipient_email: string }'
  },
  'send-otp-email': {
    description: 'Envoi de codes OTP par email pour l\'authentification à deux facteurs.',
    endpoint: '/functions/v1/send-otp-email',
    method: 'POST',
    auth: 'Bearer Token (JWT)',
    params: '{ email: string, otp: string }'
  },
  'admin-users': {
    description: 'Gestion des utilisateurs admin : création, modification, suppression via l\'API Admin Supabase.',
    endpoint: '/functions/v1/admin-users',
    method: 'POST',
    auth: 'Bearer Token (JWT, admin requis)',
    params: '{ action: "create"|"update"|"delete", user_data: object }'
  }
};

// Données statiques des Edge Functions (basées sur Supabase)
const staticEdgeFunctions: EdgeFunction[] = [
  { id: '1', slug: 'recherche-contrats', name: 'recherche-contrats', version: 31, status: 'ACTIVE', verify_jwt: true, created_at: 1768185683669, updated_at: 1768499790255 },
  { id: '2', slug: 'recherche-ccn', name: 'recherche-ccn', version: 2, status: 'ACTIVE', verify_jwt: false, created_at: 1768494560523, updated_at: 1768494560523 },
  { id: '3', slug: 'import-ccn', name: 'import-ccn', version: 8, status: 'ACTIVE', verify_jwt: false, created_at: 1768510330914, updated_at: 1768520140529 },
  { id: '4', slug: 'export-ccn', name: 'export-ccn', version: 3, status: 'ACTIVE', verify_jwt: false, created_at: 1768494607316, updated_at: 1768523364923 },
  { id: '5', slug: 'analyze-ccn-compliance', name: 'analyze-ccn-compliance', version: 5, status: 'ACTIVE', verify_jwt: true, created_at: 1768519711752, updated_at: 1768522017764 },
  { id: '6', slug: 'send-ccn-alerts-email', name: 'send-ccn-alerts-email', version: 3, status: 'ACTIVE', verify_jwt: false, created_at: 1768517424282, updated_at: 1768520334662 },
  { id: '7', slug: 'send-otp-email', name: 'send-otp-email', version: 5, status: 'ACTIVE', verify_jwt: true, created_at: 1768483468377, updated_at: 1768484847325 },
  { id: '8', slug: 'admin-users', name: 'admin-users', version: 4, status: 'ACTIVE', verify_jwt: true, created_at: 1768485840117, updated_at: 1768486580114 },
];

export default function TechnicalDocumentation() {
  const [selectedFunction, setSelectedFunction] = useState<EdgeFunction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const edgeFunctions = staticEdgeFunctions;

  const handleFunctionClick = (func: EdgeFunction) => {
    setSelectedFunction(func);
    setDialogOpen(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFunctionDetails = (slug: string) => {
    return functionDescriptions[slug] || {
      description: 'Fonction Edge Supabase',
      endpoint: `/functions/v1/${slug}`,
      method: 'POST',
      auth: 'Variable'
    };
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-[#407b85] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <Book className="w-8 h-8 text-[#407b85]" />
            <h1 className="text-3xl font-bold text-gray-900">
              Documentation Technique
            </h1>
          </div>
          <p className="text-gray-600">
            Documentation complète de l'application WALTERA : bases de données, environnements, webhooks et procédures
          </p>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="database">
              <Database className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Base de données</span>
            </TabsTrigger>
            <TabsTrigger value="edgefunctions">
              <Cloud className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Edge Functions</span>
            </TabsTrigger>
            <TabsTrigger value="environments">
              <Server className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Environnements</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks">
              <Zap className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="procedures">
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Procédures</span>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET BASE DE DONNÉES */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-[#407b85]" />
                  <span>Configuration Supabase</span>
                </CardTitle>
                <CardDescription>
                  Informations de connexion et configuration de la base de données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">URL Supabase</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      https://syxsacbciqwrahjdixuc.supabase.co
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Project Ref</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      syxsacbciqwrahjdixuc
                    </code>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Sécurité :</strong> Les clés API (anon key et service role) ne doivent jamais être partagées publiquement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schéma de base de données</CardTitle>
                <CardDescription>Tables principales et leurs relations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profiles */}
                  <div className="border-l-4 border-[#407b85] pl-4">
                    <h3 className="font-bold text-lg mb-2">profiles</h3>
                    <p className="text-sm text-gray-600 mb-3">Profils utilisateurs avec informations personnelles et rôles</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="text-xs bg-blue-100 px-1">id</code> UUID (PK)</div>
                      <div><code className="text-xs bg-blue-100 px-1">email</code> TEXT (unique)</div>
                      <div><code className="text-xs bg-blue-100 px-1">first_name</code> TEXT</div>
                      <div><code className="text-xs bg-blue-100 px-1">last_name</code> TEXT</div>
                      <div><code className="text-xs bg-blue-100 px-1">phone</code> TEXT</div>
                      <div><code className="text-xs bg-blue-100 px-1">role</code> ENUM (user | admin)</div>
                      <div><code className="text-xs bg-blue-100 px-1">avatar_url</code> TEXT</div>
                      <div><code className="text-xs bg-blue-100 px-1">created_at</code> TIMESTAMPTZ</div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">documents</h3>
                    <p className="text-sm text-gray-600 mb-3">Documents vectorisés pour le RAG (234,161 lignes)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="text-xs bg-green-100 px-1">id</code> BIGINT (PK)</div>
                      <div><code className="text-xs bg-green-100 px-1">content</code> TEXT</div>
                      <div><code className="text-xs bg-green-100 px-1">metadata</code> JSONB</div>
                      <div><code className="text-xs bg-green-100 px-1">embedding</code> VECTOR</div>
                      <div><code className="text-xs bg-green-100 px-1">is_deleted</code> BOOLEAN</div>
                      <div><code className="text-xs bg-green-100 px-1">created_at</code> TIMESTAMP</div>
                    </div>
                  </div>

                  {/* Tarifs Santé */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">tarifs_sante</h3>
                    <p className="text-sm text-gray-600 mb-3">Tarifs de complémentaire santé (5,868 lignes)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="text-xs bg-orange-100 px-1">gamme</code> TEXT</div>
                      <div><code className="text-xs bg-orange-100 px-1">produit</code> TEXT</div>
                      <div><code className="text-xs bg-orange-100 px-1">zone</code> TEXT</div>
                      <div><code className="text-xs bg-orange-100 px-1">qualite</code> TEXT</div>
                      <div><code className="text-xs bg-orange-100 px-1">age</code> TEXT</div>
                      <div><code className="text-xs bg-orange-100 px-1">option1-6</code> NUMERIC</div>
                      <div><code className="text-xs bg-orange-100 px-1">surco_option3-6</code> NUMERIC</div>
                      <div><code className="text-xs bg-orange-100 px-1">renfort_hospi</code> NUMERIC</div>
                    </div>
                  </div>

                  {/* Analyses Réseau */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">analyses_reseau</h3>
                    <p className="text-sm text-gray-600 mb-3">Historique des analyses de réseau avec tracking des crédits Gamma</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="text-xs bg-purple-100 px-1">id</code> UUID (PK)</div>
                      <div><code className="text-xs bg-purple-100 px-1">generation_id</code> TEXT (unique)</div>
                      <div><code className="text-xs bg-purple-100 px-1">status</code> TEXT</div>
                      <div><code className="text-xs bg-purple-100 px-1">gamma_url</code> TEXT</div>
                      <div><code className="text-xs bg-purple-100 px-1">export_url</code> TEXT</div>
                      <div><code className="text-xs bg-purple-100 px-1">credits_deducted</code> INTEGER</div>
                      <div><code className="text-xs bg-purple-100 px-1">credits_remaining</code> INTEGER</div>
                      <div><code className="text-xs bg-purple-100 px-1">response_data</code> JSONB</div>
                    </div>
                  </div>

                  {/* Conversations */}
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">conversations</h3>
                    <p className="text-sm text-gray-600 mb-3">Conversations avec les assistants IA (31 lignes)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="text-xs bg-indigo-100 px-1">id</code> UUID (PK)</div>
                      <div><code className="text-xs bg-indigo-100 px-1">user_id</code> UUID (FK)</div>
                      <div><code className="text-xs bg-indigo-100 px-1">title</code> TEXT</div>
                      <div><code className="text-xs bg-indigo-100 px-1">session_id</code> TEXT (unique)</div>
                      <div><code className="text-xs bg-indigo-100 px-1">service_type</code> ENUM</div>
                      <div><code className="text-xs bg-indigo-100 px-1">status</code> ENUM</div>
                      <div><code className="text-xs bg-indigo-100 px-1">messages</code> JSONB</div>
                      <div><code className="text-xs bg-indigo-100 px-1">message_count</code> INTEGER</div>
                    </div>
                  </div>

                  {/* CCN */}
                  <div className="border-l-4 border-pink-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">ccn</h3>
                    <p className="text-sm text-gray-600 mb-3">Conventions collectives nationales (18,441 lignes)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="text-xs bg-pink-100 px-1">id</code> BIGINT (PK)</div>
                      <div><code className="text-xs bg-pink-100 px-1">content</code> TEXT</div>
                      <div><code className="text-xs bg-pink-100 px-1">metadata</code> JSONB</div>
                      <div><code className="text-xs bg-pink-100 px-1">embedding</code> VECTOR</div>
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="border-l-4 border-teal-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">clients</h3>
                    <p className="text-sm text-gray-600 mb-3">Base clients (50 lignes)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="text-xs bg-teal-100 px-1">id</code> UUID (PK)</div>
                      <div><code className="text-xs bg-teal-100 px-1">name</code> TEXT (unique)</div>
                      <div><code className="text-xs bg-teal-100 px-1">status</code> TEXT</div>
                      <div><code className="text-xs bg-teal-100 px-1">siren</code> TEXT</div>
                      <div><code className="text-xs bg-teal-100 px-1">nas_folder_path</code> TEXT</div>
                      <div><code className="text-xs bg-teal-100 px-1">idcc</code> ARRAY</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET EDGE FUNCTIONS */}
          <TabsContent value="edgefunctions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-[#407b85]" />
                  <span>Edge Functions Supabase</span>
                </CardTitle>
                <CardDescription>
                  {Object.keys(functionDescriptions).length} fonctions serverless pour les opérations temps réel - Cliquez pour voir les détails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Les Edge Functions remplacent les workflows n8n pour les opérations nécessitant une faible latence (RAG, streaming).
                    Gain de performance : <strong>2-5x plus rapide</strong>.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Recherche */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">Recherche (RAG + Streaming)</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {['recherche-contrats', 'recherche-ccn'].map((slug) => {
                        const func = edgeFunctions.find(f => f.slug === slug);
                        const details = getFunctionDetails(slug);
                        return (
                          <button
                            key={slug}
                            onClick={() => func && handleFunctionClick(func)}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-xs bg-blue-100 px-2 py-1 rounded group-hover:bg-blue-200 transition-colors">{slug}</code>
                              {func && (
                                <Badge variant="outline" className="text-[10px]">v{func.version}</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs mt-1">{details.description.substring(0, 60)}...</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CCN */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">Gestion CCN</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {['import-ccn', 'export-ccn', 'analyze-ccn-compliance'].map((slug) => {
                        const func = edgeFunctions.find(f => f.slug === slug);
                        const details = getFunctionDetails(slug);
                        return (
                          <button
                            key={slug}
                            onClick={() => func && handleFunctionClick(func)}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-xs bg-purple-100 px-2 py-1 rounded group-hover:bg-purple-200 transition-colors">{slug}</code>
                              {func && (
                                <Badge variant="outline" className="text-[10px]">v{func.version}</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs mt-1">{details.description.substring(0, 60)}...</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Emails */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">Emails (Resend)</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {['send-ccn-alerts-email', 'send-otp-email'].map((slug) => {
                        const func = edgeFunctions.find(f => f.slug === slug);
                        const details = getFunctionDetails(slug);
                        return (
                          <button
                            key={slug}
                            onClick={() => func && handleFunctionClick(func)}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-xs bg-green-100 px-2 py-1 rounded group-hover:bg-green-200 transition-colors">{slug}</code>
                              {func && (
                                <Badge variant="outline" className="text-[10px]">v{func.version}</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs mt-1">{details.description.substring(0, 60)}...</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">Administration</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {['admin-users'].map((slug) => {
                        const func = edgeFunctions.find(f => f.slug === slug);
                        const details = getFunctionDetails(slug);
                        return (
                          <button
                            key={slug}
                            onClick={() => func && handleFunctionClick(func)}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-xs bg-orange-100 px-2 py-1 rounded group-hover:bg-orange-200 transition-colors">{slug}</code>
                              {func && (
                                <Badge variant="outline" className="text-[10px]">v{func.version}</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs mt-1">{details.description.substring(0, 60)}...</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dialog détail fonction */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-[#407b85]" />
                    {selectedFunction?.name || 'Détails'}
                  </DialogTitle>
                  <DialogDescription>
                    Informations détaillées sur la fonction Edge
                  </DialogDescription>
                </DialogHeader>

                {selectedFunction && (
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-sm text-gray-700">
                        {getFunctionDetails(selectedFunction.slug).description}
                      </p>
                    </div>

                    {/* Statut et version */}
                    <div className="flex items-center gap-3">
                      <Badge variant={selectedFunction.status === 'ACTIVE' ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {selectedFunction.status}
                      </Badge>
                      <Badge variant="outline">
                        Version {selectedFunction.version}
                      </Badge>
                      <Badge variant={selectedFunction.verify_jwt ? 'default' : 'secondary'} className={selectedFunction.verify_jwt ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>
                        {selectedFunction.verify_jwt ? <Shield className="w-3 h-3 mr-1" /> : <ShieldOff className="w-3 h-3 mr-1" />}
                        {selectedFunction.verify_jwt ? 'JWT requis' : 'Public'}
                      </Badge>
                    </div>

                    {/* Endpoint */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {getFunctionDetails(selectedFunction.slug).method}
                        </Badge>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                          {getFunctionDetails(selectedFunction.slug).endpoint}
                        </code>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Authentification :</p>
                        <p className="text-xs text-gray-700">{getFunctionDetails(selectedFunction.slug).auth}</p>
                      </div>
                      {getFunctionDetails(selectedFunction.slug).params && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Paramètres :</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                            {getFunctionDetails(selectedFunction.slug).params}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Créée le</p>
                          <p className="text-xs">{formatDate(selectedFunction.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <RefreshCw className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Mise à jour</p>
                          <p className="text-xs">{formatDate(selectedFunction.updated_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Lien Supabase */}
                    <a
                      href={`https://supabase.com/dashboard/project/syxsacbciqwrahjdixuc/functions/${selectedFunction.slug}/details`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#407b85] hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir dans le dashboard Supabase
                    </a>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle>Deploiement des Edge Functions</CardTitle>
                <CardDescription>Commandes CLI Supabase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`# Deployer une fonction
supabase functions deploy recherche-contrats

# Voir les logs
supabase functions logs recherche-contrats --tail

# Lister les fonctions
supabase functions list`}</pre>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Secrets requis :</strong> MISTRAL_API_KEY, RESEND_API_KEY, LEGIFRANCE_CLIENT_ID, LEGIFRANCE_CLIENT_SECRET
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Edge Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#407b85]">~100ms</p>
                    <p className="text-xs text-gray-600">Cold Start</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#407b85]">~875ms</p>
                    <p className="text-xs text-gray-600">Premier token (RAG)</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#407b85]">2-5x</p>
                    <p className="text-xs text-gray-600">Plus rapide que n8n</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#407b85]">7</p>
                    <p className="text-xs text-gray-600">Fonctions actives</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET ENVIRONNEMENTS */}
          <TabsContent value="environments" className="space-y-6">
            {/* Firebase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-[#407b85]" />
                  <span>Environnements Firebase</span>
                </CardTitle>
                <CardDescription>Configuration des 3 environnements Firebase Hosting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Dev */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h4 className="font-bold text-blue-900 mb-2">Développement</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-blue-700">Project ID</p>
                          <code className="text-xs bg-white px-2 py-1 rounded">waltera-dev</code>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700">URL</p>
                          <a href="https://waltera-dev.web.app" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            waltera-dev.web.app
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700">Usage</p>
                          <p className="text-xs text-gray-700">Tests, features expérimentales</p>
                        </div>
                      </div>
                    </div>

                    {/* Staging */}
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <h4 className="font-bold text-orange-900 mb-2">Staging</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-orange-700">Project ID</p>
                          <code className="text-xs bg-white px-2 py-1 rounded">waltera-staging</code>
                        </div>
                        <div>
                          <p className="text-xs text-orange-700">URL</p>
                          <a href="https://waltera-staging.web.app" target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline">
                            waltera-staging.web.app
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-orange-700">Usage</p>
                          <p className="text-xs text-gray-700">Pré-prod, validation client</p>
                        </div>
                      </div>
                    </div>

                    {/* Production */}
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <h4 className="font-bold text-green-900 mb-2">Production</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-green-700">Project ID</p>
                          <code className="text-xs bg-white px-2 py-1 rounded">waltera-prod</code>
                        </div>
                        <div>
                          <p className="text-xs text-green-700">URL</p>
                          <a href="https://waltera-prod.web.app" target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                            waltera-prod.web.app
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-green-700">Usage</p>
                          <p className="text-xs text-gray-700">Production, utilisateurs finaux</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GitHub */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Github className="w-5 h-5 text-[#407b85]" />
                  <span>Workflow Git</span>
                </CardTitle>
                <CardDescription>Stratégie de branches et workflow de développement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <p>main (production)</p>
                    <p>├── staging</p>
                    <p>└── dev</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">1. Développement</h4>
                      <code className="block bg-gray-100 p-3 rounded text-sm">
                        git checkout dev<br/>
                        git add .<br/>
                        git commit -m "feat: nouvelle fonctionnalité"<br/>
                        ./deploy.sh dev
                      </code>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">2. Staging</h4>
                      <code className="block bg-gray-100 p-3 rounded text-sm">
                        git checkout staging<br/>
                        git merge dev<br/>
                        ./deploy.sh staging
                      </code>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">3. Production</h4>
                      <code className="block bg-gray-100 p-3 rounded text-sm">
                        git checkout main<br/>
                        git merge staging<br/>
                        ./deploy.sh prod
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET WEBHOOKS */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-[#407b85]" />
                  <span>Webhooks n8n</span>
                </CardTitle>
                <CardDescription>
                  Liste complète des webhooks n8n utilisés par l'application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* RAG Contrats */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">RAG Contrats Clients</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">RAG</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Webhook pour les requêtes RAG sur la base de contrats clients
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {WEBHOOKS.RAG_CONTRATS}
                    </code>
                  </div>

                  {/* Conventions */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">Conventions Collectives</h4>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">RAG</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Webhook pour les requêtes sur les conventions collectives nationales
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {WEBHOOKS.CONVENTIONS}
                    </code>
                  </div>

                  {/* Analyse Fichiers */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">Analyse Réseau de Fichiers</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Gamma</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Webhook pour déclencher l'analyse de réseau et générer des rapports Gamma
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {WEBHOOKS.ANALYSE_FICHIERS}
                    </code>
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-xs text-amber-800">
                        <strong>⚡ Temps de réponse :</strong> 3-5 minutes (génération Gamma)
                      </p>
                    </div>
                  </div>

                  {/* CCN Import */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">Import CCN</h4>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Import</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Webhook pour l'import de nouvelles conventions collectives
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {WEBHOOKS.CCN_IMPORT}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Serveur n8n</CardTitle>
                <CardDescription>Informations du serveur d'orchestration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hôte</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">n8n.srv659987.hstgr.cloud</code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Protocole</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">HTTPS</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET PROCÉDURES */}
          <TabsContent value="procedures" className="space-y-6">
            {/* Déploiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="w-5 h-5 text-[#407b85]" />
                  <span>Procédure de déploiement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Script automatisé</h4>
                  <code className="block bg-gray-100 p-3 rounded text-sm mb-2">
                    ./deploy.sh [dev|staging|prod]
                  </code>
                  <p className="text-sm text-gray-600">
                    Le script gère automatiquement la copie des variables d'environnement, la sélection du projet Firebase, le build et le déploiement.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Étapes du script</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Validation de l'environnement spécifié</li>
                    <li>Copie du fichier <code className="bg-gray-100 px-1">.env.[env]</code> vers <code className="bg-gray-100 px-1">.env.local</code></li>
                    <li>Sélection du projet Firebase approprié</li>
                    <li>Build du projet avec <code className="bg-gray-100 px-1">npm run build</code></li>
                    <li>Déploiement sur Firebase Hosting</li>
                    <li>Affichage de l'URL de l'application</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Migrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-[#407b85]" />
                  <span>Migrations Supabase</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Emplacement</h4>
                  <code className="block bg-gray-100 p-2 rounded text-sm">
                    /supabase/migrations/
                  </code>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Appliquer via MCP</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Les migrations sont appliquées via le MCP Supabase avec la fonction <code className="bg-gray-100 px-1">apply_migration</code>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Migrations récentes</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>20260112000000_create_analyses_reseau_table.sql</li>
                    <li>create_user_role_enum (enum user_role)</li>
                    <li>20251207000000_create_ccn_table.sql</li>
                    <li>20251202000000_demandes_devis.sql</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Gestion des rôles */}
            <Card>
              <CardHeader>
                <CardTitle>Gestion des rôles utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Rôles disponibles</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded p-3">
                      <p className="font-medium text-sm">user</p>
                      <p className="text-xs text-gray-600">Utilisateur standard avec accès limité</p>
                    </div>
                    <div className="border border-[#407b85] rounded p-3 bg-[#407b85]/5">
                      <p className="font-medium text-sm text-[#407b85]">admin</p>
                      <p className="text-xs text-gray-600">Administrateur avec accès complet</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h4 className="font-semibold mb-2 text-blue-900">Attribuer le rôle admin</h4>
                  <code className="block bg-white p-3 rounded text-xs">
                    UPDATE public.profiles<br/>
                    SET role = 'admin'::user_role<br/>
                    WHERE email = 'email@exemple.com';
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#407b85]" />
                  <span>Monitoring et logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Firebase Console</h4>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#407b85] hover:underline"
                  >
                    console.firebase.google.com →
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Logs de déploiement, analytics et monitoring
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Supabase Dashboard</h4>
                  <a
                    href="https://supabase.com/dashboard/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#407b85] hover:underline"
                  >
                    supabase.com/dashboard →
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Logs de requêtes, monitoring de base de données, API usage
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
