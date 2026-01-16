import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Book,
  Users,
  Database,
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  FileText,
  Server,
  Zap,
  UserPlus,
  UserMinus,
  Key,
  RefreshCw,
  Trash2,
  Download,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/constants';

export default function AdminDocumentation() {
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
            <Book className="w-8 h-8 text-[#407b85]" />
            <h1 className="text-3xl font-bold text-gray-900">
              Documentation Administrateur
            </h1>
          </div>
          <p className="text-gray-600">
            Guides et procédures pour l'administration de la plateforme WALTERA
          </p>
        </div>

        {/* Quick access cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            to={ROUTES.TECHNICAL_DOCUMENTATION}
            className="block border border-[#407b85] rounded-lg p-4 bg-[#407b85]/5 hover:bg-[#407b85]/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-[#407b85]" />
              <div>
                <h3 className="font-semibold text-[#407b85]">Documentation Technique</h3>
                <p className="text-sm text-gray-600">Base de données, webhooks, environnements</p>
              </div>
            </div>
          </Link>

          <Link
            to={ROUTES.ADMIN}
            className="block border border-purple-300 rounded-lg p-4 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900">Panel Admin</h3>
                <p className="text-sm text-gray-600">Gestion des utilisateurs</p>
              </div>
            </div>
          </Link>

          <Link
            to={ROUTES.CCN_MANAGEMENT}
            className="block border border-green-300 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Gestion CCN</h3>
                <p className="text-sm text-gray-600">Import des conventions collectives</p>
              </div>
            </div>
          </Link>
        </div>

        <Tabs defaultValue="utilisateurs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="utilisateurs">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="securite">
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="incidents">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Incidents</span>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET UTILISATEURS */}
          <TabsContent value="utilisateurs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-[#407b85]" />
                  <span>Créer un nouvel utilisateur</span>
                </CardTitle>
                <CardDescription>
                  Procédure d'ajout d'un utilisateur à la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                  <li>
                    <strong>Accédez au Dashboard Supabase</strong> : Authentication &gt; Users
                  </li>
                  <li>
                    <strong>Cliquez sur "Add user"</strong> puis "Create new user"
                  </li>
                  <li>
                    <strong>Renseignez l'email et le mot de passe temporaire</strong>
                  </li>
                  <li>
                    <strong>Cochez "Auto Confirm User"</strong> pour activer le compte immédiatement
                  </li>
                  <li>
                    <strong>Communiquez les identifiants</strong> à l'utilisateur de manière sécurisée
                  </li>
                </ol>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Le profil utilisateur sera automatiquement créé dans la table <code>profiles</code>
                    lors de la première connexion via un trigger Supabase.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-[#407b85]" />
                  <span>Attribuer le rôle administrateur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Pour donner les droits administrateur à un utilisateur, exécutez la requête SQL suivante
                  dans le SQL Editor de Supabase :
                </p>

                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`UPDATE public.profiles
SET role = 'admin'::user_role
WHERE email = 'email@exemple.com';`}</pre>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Attention :</strong> Limitez le nombre d'administrateurs au strict nécessaire.
                    Les admins ont accès à toutes les fonctionnalités de la plateforme.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserMinus className="w-5 h-5 text-red-500" />
                  <span>Désactiver un utilisateur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Pour désactiver un compte utilisateur sans le supprimer :
                </p>

                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Accédez au Dashboard Supabase &gt; Authentication &gt; Users</li>
                  <li>Recherchez l'utilisateur par email</li>
                  <li>Cliquez sur les 3 points &gt; "Ban user"</li>
                </ol>

                <p className="text-sm text-gray-600 mt-4">
                  L'utilisateur ne pourra plus se connecter mais ses données seront conservées.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-[#407b85]" />
                  <span>Réinitialiser un mot de passe</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  L'utilisateur peut réinitialiser son mot de passe lui-même via la page de connexion.
                  En cas de besoin, l'admin peut forcer une réinitialisation :
                </p>

                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Accédez à Supabase &gt; Authentication &gt; Users</li>
                  <li>Recherchez l'utilisateur</li>
                  <li>Cliquez sur "Send password recovery"</li>
                </ol>

                <p className="text-sm text-gray-600 mt-4">
                  Un email sera envoyé à l'utilisateur avec un lien de réinitialisation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET SECURITE */}
          <TabsContent value="securite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[#407b85]" />
                  <span>Bonnes pratiques de sécurité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Mots de passe forts</h4>
                      <p className="text-sm text-gray-600">
                        Exigez des mots de passe d'au moins 12 caractères avec majuscules, minuscules, chiffres et caractères spéciaux.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Authentification MFA</h4>
                      <p className="text-sm text-gray-600">
                        Encouragez les utilisateurs à activer l'authentification à deux facteurs pour leurs comptes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Principe du moindre privilège</h4>
                      <p className="text-sm text-gray-600">
                        N'accordez que les droits strictement nécessaires. Limitez le nombre d'administrateurs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Revue régulière des accès</h4>
                      <p className="text-sm text-gray-600">
                        Vérifiez périodiquement la liste des utilisateurs et désactivez les comptes inutilisés.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-[#407b85]" />
                  <span>Gestion des clés API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>IMPORTANT :</strong> Ne partagez jamais les clés API (anon key, service role key) publiquement.
                    Ces clés doivent rester dans les fichiers d'environnement sécurisés.
                  </p>
                </div>

                <div className="space-y-3 text-sm text-gray-700">
                  <p><strong>Anon Key</strong> : Utilisée côté client pour les requêtes authentifiées</p>
                  <p><strong>Service Role Key</strong> : Clé admin avec accès complet - UNIQUEMENT côté serveur</p>
                </div>

                <p className="text-sm text-gray-600">
                  En cas de compromission d'une clé, régénérez-la immédiatement depuis le Dashboard Supabase
                  &gt; Settings &gt; API.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Row Level Security (RLS)</CardTitle>
                <CardDescription>Protection des données au niveau des lignes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  RLS est activé sur toutes les tables sensibles. Les politiques garantissent que :
                </p>

                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li>Les utilisateurs ne peuvent voir que leurs propres données</li>
                  <li>Les admins ont accès à toutes les données via des politiques spécifiques</li>
                  <li>Les opérations d'écriture sont restreintes selon le rôle</li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Vérifiez les politiques RLS après chaque modification de schéma pour éviter les failles de sécurité.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET MAINTENANCE */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-[#407b85]" />
                  <span>Déploiement</span>
                </CardTitle>
                <CardDescription>Procédure de mise à jour de l'application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. Développement</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
                      <pre>{`git checkout dev
git add .
git commit -m "feat: description"
./deploy.sh dev`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. Staging (validation)</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
                      <pre>{`git checkout staging
git merge dev
./deploy.sh staging`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. Production</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
                      <pre>{`git checkout main
git merge staging
./deploy.sh prod`}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-[#407b85]" />
                  <span>Migrations de base de données</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Les migrations Supabase sont gérées via le MCP ou directement dans le SQL Editor.
                </p>

                <div className="space-y-3">
                  <div className="border-l-4 border-[#407b85] pl-4">
                    <h4 className="font-medium">Emplacement des migrations</h4>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">/supabase/migrations/</code>
                  </div>

                  <div className="border-l-4 border-[#407b85] pl-4">
                    <h4 className="font-medium">Convention de nommage</h4>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">YYYYMMDDHHMMSS_description.sql</code>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Attention :</strong> Testez toujours les migrations sur l'environnement de développement
                    avant de les appliquer en production.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-[#407b85]" />
                  <span>Sauvegarde des données</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Supabase effectue des sauvegardes automatiques quotidiennes. Pour une sauvegarde manuelle :
                </p>

                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Accédez au Dashboard Supabase &gt; Database &gt; Backups</li>
                  <li>Cliquez sur "Create new backup" si disponible</li>
                  <li>Ou exportez via pg_dump pour une sauvegarde locale</li>
                </ol>

                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Nettoyage des données</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Procédures de nettoyage périodique recommandées :
                </p>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Conversations anciennes</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Supprimez les conversations de plus de 90 jours si nécessaire :
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-2 rounded font-mono text-xs">
                      {`DELETE FROM conversations WHERE created_at < NOW() - INTERVAL '90 days';`}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Logs et analytics</h4>
                    <p className="text-sm text-gray-600">
                      Les logs Supabase sont automatiquement purgés selon la rétention configurée.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET INCIDENTS */}
          <TabsContent value="incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Gestion des incidents</span>
                </CardTitle>
                <CardDescription>Procédures en cas de problème</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h4 className="font-semibold text-red-900 mb-2">Application inaccessible</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
                      <li>Vérifiez le statut Firebase : <a href="https://status.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">status.firebase.google.com</a></li>
                      <li>Vérifiez les logs dans la Firebase Console</li>
                      <li>Si le problème persiste, redéployez : <code className="bg-white px-1 rounded">./deploy.sh prod</code></li>
                    </ol>
                  </div>

                  <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <h4 className="font-semibold text-amber-900 mb-2">Base de données lente</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                      <li>Vérifiez les requêtes lentes dans Supabase &gt; Database &gt; Query Performance</li>
                      <li>Vérifiez l'utilisation des ressources dans le Dashboard</li>
                      <li>Optimisez les requêtes problématiques ou ajoutez des index</li>
                    </ol>
                  </div>

                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold text-blue-900 mb-2">Webhooks n8n en erreur</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Accédez au serveur n8n : <a href="https://n8n.srv659987.hstgr.cloud" target="_blank" rel="noopener noreferrer" className="underline">n8n.srv659987.hstgr.cloud</a></li>
                      <li>Vérifiez les exécutions en erreur</li>
                      <li>Consultez les logs du workflow concerné</li>
                      <li>Relancez manuellement si nécessaire</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacts d'urgence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Support Supabase</h4>
                    <p className="text-sm text-gray-600">
                      Dashboard &gt; Support ou <a href="https://supabase.com/dashboard/support" target="_blank" rel="noopener noreferrer" className="text-[#407b85] hover:underline">supabase.com/dashboard/support</a>
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Support Firebase</h4>
                    <p className="text-sm text-gray-600">
                      <a href="https://firebase.google.com/support" target="_blank" rel="noopener noreferrer" className="text-[#407b85] hover:underline">firebase.google.com/support</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#407b85]" />
                  <span>Journal des incidents</span>
                </CardTitle>
                <CardDescription>Documentez chaque incident pour amélioration continue</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Pour chaque incident majeur, documentez :
                </p>

                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Date et heure</strong> de détection</li>
                  <li><strong>Impact</strong> : nombre d'utilisateurs affectés, durée</li>
                  <li><strong>Cause racine</strong> : ce qui a provoqué l'incident</li>
                  <li><strong>Actions correctives</strong> : ce qui a été fait pour résoudre</li>
                  <li><strong>Actions préventives</strong> : ce qui sera fait pour éviter la récurrence</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Section ressources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-[#407b85]" />
              <span>Ressources externes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="https://supabase.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 rounded-lg p-4 hover:border-[#407b85] transition-colors"
              >
                <Database className="w-6 h-6 text-green-600 mb-2" />
                <h4 className="font-medium">Documentation Supabase</h4>
                <p className="text-sm text-gray-600">Base de données, Auth, Storage</p>
              </a>

              <a
                href="https://firebase.google.com/docs/hosting"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 rounded-lg p-4 hover:border-[#407b85] transition-colors"
              >
                <Server className="w-6 h-6 text-orange-500 mb-2" />
                <h4 className="font-medium">Firebase Hosting</h4>
                <p className="text-sm text-gray-600">Déploiement et configuration</p>
              </a>

              <a
                href="https://docs.n8n.io"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 rounded-lg p-4 hover:border-[#407b85] transition-colors"
              >
                <Zap className="w-6 h-6 text-purple-600 mb-2" />
                <h4 className="font-medium">Documentation n8n</h4>
                <p className="text-sm text-gray-600">Workflows et webhooks</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
