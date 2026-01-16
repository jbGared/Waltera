import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Calculator,
  BarChart3,
  MessageSquare,
  Users,
  HelpCircle,
  Search,
  Shield,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/constants';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex items-center text-gray-600 hover:text-[#407b85] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="w-8 h-8 text-[#407b85]" />
            <h1 className="text-3xl font-bold text-gray-900">
              Centre d'aide
            </h1>
          </div>
          <p className="text-gray-600">
            Guides et tutoriels pour utiliser efficacement les services WALTERA
          </p>
        </div>

        <Tabs defaultValue="demarrage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="demarrage">
              <Lightbulb className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Démarrage</span>
            </TabsTrigger>
            <TabsTrigger value="contrats">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Contrats</span>
            </TabsTrigger>
            <TabsTrigger value="ccn">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">CCN</span>
            </TabsTrigger>
            <TabsTrigger value="tarificateur">
              <Calculator className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tarificateur</span>
            </TabsTrigger>
            <TabsTrigger value="analyse">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Analyse</span>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET DEMARRAGE */}
          <TabsContent value="demarrage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-[#407b85]" />
                  <span>Bienvenue sur WALTERA</span>
                </CardTitle>
                <CardDescription>
                  Premiers pas avec la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600">
                    WALTERA est une plateforme intelligente qui vous permet d'interroger vos contrats clients,
                    d'analyser les conventions collectives, de calculer des tarifs santé et de générer des rapports d'audit.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Contrats Clients
                    </h4>
                    <p className="text-sm text-blue-800">
                      Posez vos questions sur les garanties, exclusions et conditions de vos contrats clients.
                    </p>
                  </div>

                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Conventions Collectives
                    </h4>
                    <p className="text-sm text-purple-800">
                      Analysez les CCN et obtenez des réponses sur les droits, congés et classifications.
                    </p>
                  </div>

                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                      <Calculator className="w-4 h-4 mr-2" />
                      Tarificateur Santé
                    </h4>
                    <p className="text-sm text-orange-800">
                      Calculez en temps réel les tarifs de complémentaire santé individuelle.
                    </p>
                  </div>

                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyse Réseau
                    </h4>
                    <p className="text-sm text-green-800">
                      Lancez des audits automatiques de votre réseau avec génération de rapports.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[#407b85]" />
                  <span>Sécurité et connexion</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border-l-4 border-[#407b85] pl-4">
                    <h4 className="font-semibold mb-2">Authentification</h4>
                    <p className="text-sm text-gray-600">
                      Connectez-vous avec votre email et mot de passe. Une authentification à deux facteurs (MFA)
                      peut être activée pour renforcer la sécurité de votre compte.
                    </p>
                  </div>

                  <div className="border-l-4 border-[#407b85] pl-4">
                    <h4 className="font-semibold mb-2">Profil utilisateur</h4>
                    <p className="text-sm text-gray-600">
                      Accédez à votre profil en cliquant sur votre nom dans la barre de navigation.
                      Vous pouvez y modifier vos informations personnelles et votre photo de profil.
                    </p>
                  </div>

                  <div className="border-l-4 border-[#407b85] pl-4">
                    <h4 className="font-semibold mb-2">Mot de passe oublié</h4>
                    <p className="text-sm text-gray-600">
                      Si vous avez oublié votre mot de passe, cliquez sur "Mot de passe oublié" sur la page de connexion.
                      Un email de réinitialisation vous sera envoyé.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET CONTRATS */}
          <TabsContent value="contrats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Assistant Contrats Clients</span>
                </CardTitle>
                <CardDescription>
                  Comment utiliser l'assistant RAG pour interroger vos contrats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>RAG (Retrieval-Augmented Generation)</strong> : L'assistant recherche automatiquement
                    les informations pertinentes dans votre base de contrats pour vous fournir des réponses précises et sourcées.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Comment utiliser</h4>

                  <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                    <li>
                      <strong>Accédez au service</strong> : Depuis le Dashboard, cliquez sur "Contrats Clients"
                    </li>
                    <li>
                      <strong>Posez votre question</strong> : Tapez votre question dans le champ de saisie en bas de l'écran
                    </li>
                    <li>
                      <strong>Consultez la réponse</strong> : L'assistant analyse vos contrats et vous répond avec les sources
                    </li>
                    <li>
                      <strong>Affinez si nécessaire</strong> : Posez des questions complémentaires pour plus de détails
                    </li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Exemples de questions</h4>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <MessageSquare className="w-4 h-4 text-gray-500 mb-2" />
                      <p className="text-sm">"Quelles sont les garanties du contrat X ?"</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <MessageSquare className="w-4 h-4 text-gray-500 mb-2" />
                      <p className="text-sm">"Y a-t-il des exclusions particulières ?"</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <MessageSquare className="w-4 h-4 text-gray-500 mb-2" />
                      <p className="text-sm">"Quelle est la franchise applicable ?"</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <MessageSquare className="w-4 h-4 text-gray-500 mb-2" />
                      <p className="text-sm">"Comparer avec un autre contrat"</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Bonnes pratiques</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                    <li>Soyez précis dans vos questions pour obtenir des réponses ciblées</li>
                    <li>Mentionnez le nom du contrat si vous en avez un spécifique en tête</li>
                    <li>Vérifiez toujours les sources citées dans la réponse</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des conversations</CardTitle>
                <CardDescription>Retrouvez vos échanges précédents</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Toutes vos conversations avec l'assistant sont sauvegardées et accessibles depuis la page
                  <Link to={ROUTES.CONVERSATIONS} className="text-[#407b85] hover:underline ml-1">Conversations</Link>.
                </p>
                <p className="text-sm text-gray-600">
                  Vous pouvez reprendre une conversation existante ou en démarrer une nouvelle à tout moment.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET CCN */}
          <TabsContent value="ccn" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>Conventions Collectives Nationales</span>
                </CardTitle>
                <CardDescription>
                  Analysez et interrogez les conventions collectives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    Ce service vous permet d'interroger une base de <strong>conventions collectives nationales (CCN)</strong>
                    pour obtenir des réponses précises sur les droits des salariés, les congés, les classifications, etc.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Fonctionnalités</h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <Search className="w-5 h-5 text-purple-600 mb-2" />
                      <h5 className="font-medium mb-1">Recherche intelligente</h5>
                      <p className="text-sm text-gray-600">
                        Posez vos questions en langage naturel, l'IA recherche les articles pertinents.
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <FileText className="w-5 h-5 text-purple-600 mb-2" />
                      <h5 className="font-medium mb-1">Sources citées</h5>
                      <p className="text-sm text-gray-600">
                        Chaque réponse est accompagnée des références aux articles de la convention.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Exemples de questions</h4>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm">"Quels sont les congés prévus par cette convention ?"</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm">"Quel est le préavis de démission ?"</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm">"Quelles sont les primes obligatoires ?"</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm">"Quelle classification pour ce poste ?"</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestion des CCN</CardTitle>
                <CardDescription>Pour les utilisateurs avec droits de gestion</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Si vous disposez des droits nécessaires, vous pouvez accéder à la
                  <Link to={ROUTES.CCN_MANAGEMENT} className="text-[#407b85] hover:underline ml-1">gestion des CCN</Link>
                  pour importer de nouvelles conventions collectives dans la base de données.
                </p>
                <div className="bg-gray-100 rounded-lg p-4">
                  <h5 className="font-medium mb-2">Processus d'import</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Selectionnez le fichier PDF de la convention</li>
                    <li>Renseignez les metadonnees (IDCC, nom, etc.)</li>
                    <li>Lancez l'import - le systeme decoupe et vectorise automatiquement le document</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parametrage des CCN</CardTitle>
                <CardDescription>Configuration avancee des conventions collectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Code IDCC */}
                <div className="space-y-3">
                  <h5 className="font-semibold flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    Code IDCC
                  </h5>
                  <p className="text-sm text-gray-600">
                    Chaque convention collective est identifiee par un code <strong>IDCC</strong> (Identifiant de la Convention Collective)
                    a 4 chiffres. Ce code est attribue par le Ministere du Travail.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-mono font-bold">1486</span>
                      <span className="text-gray-500 ml-2">Bureaux d'etudes techniques (Syntec)</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-mono font-bold">2609</span>
                      <span className="text-gray-500 ml-2">Batiment ETAM</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-mono font-bold">3127</span>
                      <span className="text-gray-500 ml-2">Services automobiles</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-mono font-bold">0044</span>
                      <span className="text-gray-500 ml-2">Industries chimiques</span>
                    </div>
                  </div>
                </div>

                {/* Activation / Desactivation */}
                <div className="space-y-3">
                  <h5 className="font-semibold flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    Activation des CCN
                  </h5>
                  <p className="text-sm text-gray-600">
                    Seules les CCN <strong>actives</strong> sont synchronisees avec l'API Legifrance et disponibles pour la recherche.
                    Une CCN peut etre desactivee temporairement sans supprimer ses donnees.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center text-sm">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <span>Active : Synchronisee et recherchable</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                      <span>Inactive : Donnees conservees mais non synchronisees</span>
                    </div>
                  </div>
                </div>

                {/* Import Legifrance */}
                <div className="space-y-3">
                  <h5 className="font-semibold flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Import depuis Legifrance
                  </h5>
                  <p className="text-sm text-gray-600">
                    L'import automatique recupere les textes depuis l'API Legifrance (DILA/PISTE).
                    Le systeme detecte les modifications et ne reimporte que les textes modifies.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Synchronisation quotidienne :</strong> Un workflow automatise verifie chaque jour
                      les mises a jour des CCN actives et declenche l'import si necessaire.
                    </p>
                  </div>
                </div>

                {/* Mots-cles sensibles */}
                <div className="space-y-3">
                  <h5 className="font-semibold flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs mr-2">4</span>
                    Mots-cles sensibles
                  </h5>
                  <p className="text-sm text-gray-600">
                    Lors de l'import, le systeme detecte automatiquement les termes sensibles et genere des alertes :
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border border-red-200 bg-red-50 p-2 rounded">
                      <span className="font-medium text-red-700">Garanties</span>
                      <p className="text-red-600">capital deces, invalidite, incapacite</p>
                    </div>
                    <div className="border border-orange-200 bg-orange-50 p-2 rounded">
                      <span className="font-medium text-orange-700">Cotisations</span>
                      <p className="text-orange-600">taux, cotisation patronale/salariale</p>
                    </div>
                    <div className="border border-blue-200 bg-blue-50 p-2 rounded">
                      <span className="font-medium text-blue-700">Delais</span>
                      <p className="text-blue-600">carence, franchise, anciennete</p>
                    </div>
                    <div className="border border-green-200 bg-green-50 p-2 rounded">
                      <span className="font-medium text-green-700">Portabilite</span>
                      <p className="text-green-600">maintien des garanties, ayants droit</p>
                    </div>
                  </div>
                </div>

                {/* Association clients */}
                <div className="space-y-3">
                  <h5 className="font-semibold flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs mr-2">5</span>
                    Association CCN / Clients
                  </h5>
                  <p className="text-sm text-gray-600">
                    Chaque client peut etre associe a une ou plusieurs CCN. Cette association permet :
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>De recevoir des alertes lors de modifications de ses CCN</li>
                    <li>D'analyser automatiquement la conformite de ses contrats</li>
                    <li>De filtrer les recherches par CCN applicable</li>
                  </ul>
                </div>

                {/* Export */}
                <div className="space-y-3">
                  <h5 className="font-semibold flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs mr-2">6</span>
                    Export des CCN
                  </h5>
                  <p className="text-sm text-gray-600">
                    Les CCN peuvent etre exportees au format Markdown avec :
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Table des matieres automatique</li>
                    <li>Hierarchie juridique (arretes, avenants, accords, annexes)</li>
                    <li>Liens vers les sources Legifrance</li>
                    <li>Metadonnees (dates, etats juridiques)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analyse de conformite IA</CardTitle>
                <CardDescription>Detection automatique des ecarts CCN vs contrats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Nouveaute :</strong> L'analyse de conformite IA detecte automatiquement les ecarts
                    entre les exigences des CCN et les contrats clients.
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium">Types d'alertes detectees</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium text-red-600">Critiques</span>
                      <p className="text-gray-600">Garanties insuffisantes</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium text-orange-600">Avertissements</span>
                      <p className="text-gray-600">Clauses manquantes</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium text-blue-600">Informations</span>
                      <p className="text-gray-600">Ameliorations possibles</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium text-purple-600">Delais</span>
                      <p className="text-gray-600">Non-conformites de delais</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Les alertes sont envoyees par email aux utilisateurs inscrits apres chaque import CCN.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET TARIFICATEUR */}
          <TabsContent value="tarificateur" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-orange-600" />
                  <span>Tarificateur Santé</span>
                </CardTitle>
                <CardDescription>
                  Calculez les tarifs de complémentaire santé individuelle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    Le tarificateur vous permet de calculer en temps réel le tarif d'un contrat de
                    <strong> complémentaire santé individuelle</strong> avec détail par bénéficiaire.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Gammes disponibles</h4>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">Santé Seniors Plus</h5>
                      <p className="text-sm text-gray-600">
                        Gamme premium avec option renfort hospitalisation.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Zones : Z01, Z02, AM</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-green-900 mb-2">Santé Seniors</h5>
                      <p className="text-sm text-gray-600">
                        Gamme standard pour les seniors.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Zones : Z01, Z02, AM</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-purple-900 mb-2">TNS Formules</h5>
                      <p className="text-sm text-gray-600">
                        Gamme dédiée aux Travailleurs Non Salariés.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Zones : Z01-Z05</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Comment utiliser le tarificateur</h4>

                  <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                    <li>
                      <strong>Sélectionnez la gamme</strong> : Choisissez entre Seniors Plus, Seniors ou TNS
                    </li>
                    <li>
                      <strong>Renseignez le code postal</strong> : La zone tarifaire sera déterminée automatiquement
                    </li>
                    <li>
                      <strong>Ajoutez les bénéficiaires</strong> : Assuré, conjoint et/ou enfants avec leur date de naissance
                    </li>
                    <li>
                      <strong>Choisissez l'option</strong> : De 1 (économique) à 6 (premium)
                    </li>
                    <li>
                      <strong>Options supplémentaires</strong> : Surcomplémentaire (options 3-6), Renfort Hospi (Seniors Plus uniquement)
                    </li>
                    <li>
                      <strong>Calculez</strong> : Le tarif mensuel détaillé s'affiche instantanément
                    </li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-900 mb-2">Surcomplémentaire</h5>
                    <p className="text-sm text-blue-800">
                      Disponible uniquement pour les options 3, 4, 5 et 6. Améliore les remboursements sur certains postes.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-semibold text-green-900 mb-2">Renfort Hospitalisation</h5>
                    <p className="text-sm text-green-800">
                      Exclusif à la gamme Santé Seniors Plus. Renforce les garanties hospitalières.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zones tarifaires</CardTitle>
                <CardDescription>Comprendre les zones géographiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Les tarifs varient selon la zone géographique. Le code postal permet de déterminer automatiquement la zone applicable.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Seniors / Seniors Plus</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li><strong>Z01</strong> : Zone standard</li>
                        <li><strong>Z02</strong> : Grandes agglomérations (Paris, Lyon...)</li>
                        <li><strong>AM</strong> : Alsace-Moselle</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">TNS</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li><strong>Z01 à Z05</strong> : 5 zones selon le département</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET ANALYSE */}
          <TabsContent value="analyse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span>Analyse Réseau de Fichiers</span>
                </CardTitle>
                <CardDescription>
                  Générez des rapports d'audit automatiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Ce service vous permet de lancer des <strong>audits automatiques</strong> de votre réseau
                    avec génération de rapports Gamma et export PDF.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Fonctionnement</h4>

                  <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                    <li>
                      <strong>Sélectionnez le client</strong> : Choisissez le client à analyser dans la liste
                    </li>
                    <li>
                      <strong>Lancez l'analyse</strong> : Cliquez sur "Lancer l'analyse"
                    </li>
                    <li>
                      <strong>Patientez</strong> : L'analyse peut prendre 3 à 5 minutes
                    </li>
                    <li>
                      <strong>Consultez le rapport</strong> : Une fois terminé, accédez au rapport Gamma ou téléchargez le PDF
                    </li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h5 className="font-semibold text-amber-900 mb-2">Crédits Gamma</h5>
                  <p className="text-sm text-amber-800">
                    Chaque génération de rapport consomme des crédits Gamma. Le nombre de crédits restants
                    est affiché sur la page d'analyse. Contactez votre administrateur si vous avez besoin de crédits supplémentaires.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Contenu du rapport</h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium mb-2">Rapport Gamma</h5>
                      <p className="text-sm text-gray-600">
                        Rapport interactif en ligne avec visualisations et données détaillées.
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium mb-2">Export PDF</h5>
                      <p className="text-sm text-gray-600">
                        Version téléchargeable du rapport pour archivage ou partage.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des analyses</CardTitle>
                <CardDescription>Retrouvez vos rapports précédents</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Toutes les analyses effectuées sont conservées. Vous pouvez retrouver les rapports précédents
                  directement depuis la page d'analyse réseau.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Section FAQ */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-[#407b85]" />
              <span>Questions fréquentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium mb-2">Comment modifier mon mot de passe ?</h4>
                <p className="text-sm text-gray-600">
                  Accédez à votre profil en cliquant sur votre nom dans la barre de navigation,
                  puis utilisez l'option de modification du mot de passe.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium mb-2">Les données sont-elles sécurisées ?</h4>
                <p className="text-sm text-gray-600">
                  Oui, toutes les données sont chiffrées et stockées de manière sécurisée.
                  L'accès est protégé par authentification et les communications sont chiffrées (HTTPS).
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium mb-2">Puis-je exporter mes données ?</h4>
                <p className="text-sm text-gray-600">
                  Les rapports d'analyse peuvent être exportés en PDF. Pour les autres données,
                  contactez votre administrateur.
                </p>
              </div>

              <div className="pb-4">
                <h4 className="font-medium mb-2">Qui contacter en cas de problème ?</h4>
                <p className="text-sm text-gray-600">
                  Pour toute question technique ou problème d'accès, contactez votre administrateur
                  ou l'équipe support WALTERA.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
