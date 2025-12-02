import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Mail, Lock, User, Briefcase, Loader2, Trash2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProfile } from '@/hooks/useProfile';
import { getAllProfiles, type Profile } from '@/services/profiles';

export default function Admin() {
  const { profile } = useProfile();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '',
    isAdmin: false,
  });

  // Vérifier si l'utilisateur actuel est admin
  const isAdmin = profile?.is_admin === true;

  // Charger la liste des utilisateurs depuis la table profiles
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const profiles = await getAllProfiles();
      setUsers(profiles);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // TODO: Créer une Edge Function Supabase pour créer un utilisateur
      // L'Edge Function utilisera la service_role_key côté serveur

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          user_metadata: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            role: newUser.role,
            is_admin: newUser.isAdmin,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'utilisateur');
      }

      // Réinitialiser le formulaire
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: '',
        isAdmin: false,
      });
      setShowCreateForm(false);

      // Recharger la liste
      loadUsers();
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      alert('Erreur lors de la création de l\'utilisateur. Voir la console pour plus de détails.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center p-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accès Restreint
            </h2>
            <p className="text-gray-600">
              Vous devez être administrateur pour accéder à cette page.
            </p>
            <Link to="/dashboard">
              <Button className="mt-6">
                Retour au Dashboard
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Administration des Utilisateurs
              </h1>
              <p className="text-gray-600">
                Gérez les comptes utilisateurs de WALTERA
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-[#407b85] hover:bg-[#407b85]/90"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <Card className="mb-6 shadow-md border-0">
            <CardHeader className="bg-gradient-to-r from-[#407b85]/5 to-transparent border-b">
              <CardTitle>Créer un Nouvel Utilisateur</CardTitle>
              <CardDescription>
                L'utilisateur recevra un email avec ses identifiants
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Prénom et Nom */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe temporaire</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10"
                      placeholder="Minimum 6 caractères"
                      required
                    />
                  </div>
                </div>

                {/* Rôle */}
                <div className="space-y-2">
                  <Label htmlFor="role">Fonction</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                      className="pl-10"
                      placeholder="Consultant, Manager, etc."
                    />
                  </div>
                </div>

                {/* Admin */}
                <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg">
                  <Checkbox
                    id="isAdmin"
                    checked={newUser.isAdmin}
                    onCheckedChange={(checked) =>
                      setNewUser(prev => ({ ...prev, isAdmin: checked as boolean }))
                    }
                  />
                  <Label htmlFor="isAdmin" className="cursor-pointer text-sm">
                    Donner les droits administrateur
                  </Label>
                </div>

                {/* Boutons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#407b85] hover:bg-[#407b85]/90"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Créer l'utilisateur
                      </>
                    )}
                  </Button>
                </div>

                {/* Warning */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <p className="text-blue-900 font-medium mb-1">Note importante</p>
                  <p className="text-blue-700">
                    Pour que cette fonctionnalité fonctionne, vous devez configurer une Edge Function Supabase.
                    Voir la documentation AUTHENTIFICATION.md pour les instructions.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Liste des utilisateurs */}
        <Card className="shadow-md border-0">
          <CardHeader className="bg-gradient-to-r from-[#407b85]/5 to-transparent border-b">
            <CardTitle>Utilisateurs</CardTitle>
            <CardDescription>
              Liste de tous les utilisateurs de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#407b85] mx-auto mb-4" />
                <p className="text-gray-600">Chargement des utilisateurs...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Aucun utilisateur trouvé</p>
                <p className="text-sm text-gray-500">
                  Cette fonctionnalité nécessite la configuration d'une Edge Function Supabase
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((userProfile) => (
                  <div
                    key={userProfile.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#407b85]/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-[#407b85] flex items-center justify-center text-white font-bold text-sm">
                        {userProfile.first_name && userProfile.last_name
                          ? `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase()
                          : userProfile.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {userProfile.first_name && userProfile.last_name
                            ? `${userProfile.first_name} ${userProfile.last_name}`
                            : userProfile.email}
                        </p>
                        <p className="text-sm text-gray-500">{userProfile.email}</p>
                        {userProfile.role && (
                          <p className="text-xs text-gray-400">{userProfile.role}</p>
                        )}
                      </div>
                      {userProfile.is_admin && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Configuration Requise</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-3">
            <p>
              Pour que la gestion des utilisateurs fonctionne, vous devez créer une <strong>Edge Function Supabase</strong>.
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="font-semibold mb-2">Étapes :</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Créer une Edge Function : <code className="bg-blue-100 px-1 rounded">supabase functions new admin-users</code></li>
                <li>Implémenter les endpoints : create-user, list-users, delete-user</li>
                <li>Utiliser la service_role_key côté serveur</li>
                <li>Déployer : <code className="bg-blue-100 px-1 rounded">supabase functions deploy admin-users</code></li>
              </ol>
            </div>
            <p className="text-xs">
              Voir <code>AUTHENTIFICATION.md</code> pour un guide complet.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
