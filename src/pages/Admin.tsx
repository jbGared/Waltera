import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Mail, Lock, User, Briefcase, Loader2, Trash2, Shield, BookOpen, Pencil, X, Phone, MapPin, Save, Camera, ImageOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProfile } from '@/hooks/useProfile';
import { getAllProfiles, updateProfileById, uploadAvatarForUser, deleteAvatarForUser, type Profile } from '@/services/profiles';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator, validatePassword } from '@/components/auth/PasswordStrengthIndicator';

export default function Admin() {
  const { profile } = useProfile();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // État pour l'édition
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    is_admin: false,
  });

  // État pour la modale de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '',
    isAdmin: false,
  });

  // Vérifier si l'utilisateur actuel est admin
  const isAdmin = profile?.role === 'admin';

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

  // Ouvrir la modal d'édition
  const handleEditUser = (userProfile: Profile) => {
    setEditingUser(userProfile);
    setAvatarPreview(userProfile.avatar_url || null);
    setEditForm({
      first_name: userProfile.first_name || '',
      last_name: userProfile.last_name || '',
      role: userProfile.role || '',
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      city: userProfile.city || '',
      postal_code: userProfile.postal_code || '',
      is_admin: userProfile.role === 'admin',
    });
    setIsEditModalOpen(true);
  };

  // Gérer l'upload d'avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;

    setIsUploadingAvatar(true);
    try {
      const newAvatarUrl = await uploadAvatarForUser(
        editingUser.id,
        file,
        editingUser.avatar_url
      );

      if (newAvatarUrl) {
        setAvatarPreview(newAvatarUrl);
        setEditingUser(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
      } else {
        alert('Erreur lors de l\'upload de la photo. Vérifiez le format (JPG, PNG, WebP, GIF) et la taille (max 2MB).');
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Supprimer l'avatar
  const handleDeleteAvatar = async () => {
    if (!editingUser || !editingUser.avatar_url) return;

    setIsUploadingAvatar(true);
    try {
      const success = await deleteAvatarForUser(editingUser.id, editingUser.avatar_url);

      if (success) {
        setAvatarPreview(null);
        setEditingUser(prev => prev ? { ...prev, avatar_url: null } : null);
      } else {
        alert('Erreur lors de la suppression de la photo');
      }
    } catch (error) {
      console.error('Erreur suppression avatar:', error);
      alert('Erreur lors de la suppression de la photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Sauvegarder les modifications
  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const updates = {
        first_name: editForm.first_name || null,
        last_name: editForm.last_name || null,
        role: editForm.is_admin ? 'admin' : (editForm.role || null),
        phone: editForm.phone || null,
        address: editForm.address || null,
        city: editForm.city || null,
        postal_code: editForm.postal_code || null,
      };

      const success = await updateProfileById(editingUser.id, updates);

      if (success) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        loadUsers();
      } else {
        alert('Erreur lors de la mise à jour de l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valider le mot de passe avant de continuer
    const passwordValidation = validatePassword(newUser.password);
    if (!passwordValidation.isValid) {
      alert(`Le mot de passe ne respecte pas la politique de sécurité:\n- ${passwordValidation.errors.join('\n- ')}`);
      return;
    }

    setIsCreating(true);

    try {
      const response = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create',
          email: newUser.email,
          password: newUser.password,
          user_metadata: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            role: newUser.role,
            is_admin: newUser.isAdmin,
          },
        },
      });

      console.log('Response from admin-users:', response);

      // Gérer les erreurs
      if (response.error) {
        // Essayer d'extraire le message d'erreur du contexte
        let errorMessage = 'Erreur lors de la création de l\'utilisateur';

        // Si c'est une FunctionsHttpError, le message détaillé est dans context
        if (response.error.context) {
          try {
            const errorBody = await response.error.context.json();
            errorMessage = errorBody.error || errorMessage;
          } catch {
            errorMessage = response.error.message || errorMessage;
          }
        } else {
          errorMessage = response.error.message || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Vérifier aussi si data contient une erreur
      if (response.data?.error) {
        throw new Error(response.data.error);
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
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      alert(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsCreating(false);
    }
  };

  // Ouvrir la modale de confirmation de suppression
  const openDeleteModal = (userId: string, userEmail: string) => {
    setUserToDelete({ id: userId, email: userEmail });
    setIsDeleteModalOpen(true);
  };

  // Fermer la modale de suppression
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Confirmer la suppression
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'delete',
          user_id: userToDelete.id,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Fermer la modale et recharger la liste
      closeDeleteModal();
      loadUsers();
    } catch (error: any) {
      console.error('Erreur suppression utilisateur:', error);
      alert(error.message || 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setIsDeleting(false);
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
            <div className="flex gap-3">
              <Link to="/admin/documentation">
                <Button
                  variant="outline"
                  className="border-[#407b85] text-[#407b85] hover:bg-[#407b85] hover:text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-[#407b85] hover:bg-[#407b85]/90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </div>
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
                      placeholder="12+ caractères, majuscule, minuscule, chiffre, spécial"
                      required
                    />
                  </div>
                  <PasswordStrengthIndicator password={newUser.password} />
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
                    disabled={isCreating || !validatePassword(newUser.password).isValid}
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
                  Cliquez sur "Nouvel utilisateur" pour créer le premier compte
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
                      {userProfile.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt={`${userProfile.first_name || ''} ${userProfile.last_name || ''}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#407b85] flex items-center justify-center text-white font-bold text-sm">
                          {userProfile.first_name && userProfile.last_name
                            ? `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase()
                            : userProfile.email.substring(0, 2).toUpperCase()}
                        </div>
                      )}
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
                      {userProfile.role === 'admin' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(userProfile)}
                        className="text-[#407b85] hover:text-[#407b85] hover:bg-[#407b85]/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(userProfile.id, userProfile.email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Modal d'édition utilisateur */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Pencil className="w-5 h-5 text-[#407b85]" />
              <span>Modifier l'utilisateur</span>
            </DialogTitle>
            <DialogDescription>
              {editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Photo de profil */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#407b85]/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#407b85] flex items-center justify-center text-white font-bold text-2xl border-4 border-[#407b85]/20">
                    {editingUser?.first_name && editingUser?.last_name
                      ? `${editingUser.first_name[0]}${editingUser.last_name[0]}`.toUpperCase()
                      : editingUser?.email?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="text-[#407b85] border-[#407b85] hover:bg-[#407b85]/10"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {avatarPreview ? 'Changer' : 'Ajouter une photo'}
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAvatar}
                    disabled={isUploadingAvatar}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <ImageOff className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">JPG, PNG, WebP ou GIF. Max 2MB.</p>
            </div>

            <div className="border-t pt-4" />

            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="edit-firstName"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="pl-10"
                    placeholder="Prénom"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="edit-lastName"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="pl-10"
                    placeholder="Nom"
                  />
                </div>
              </div>
            </div>

            {/* Fonction */}
            <div className="space-y-2">
              <Label htmlFor="edit-role">Fonction</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-role"
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="pl-10"
                  placeholder="Consultant, Manager, etc."
                  disabled={editForm.is_admin}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10"
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="edit-address">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-address"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="pl-10"
                  placeholder="123 rue Example"
                />
              </div>
            </div>

            {/* Ville et Code postal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Ville</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">Code postal</Label>
                <Input
                  id="edit-postalCode"
                  value={editForm.postal_code}
                  onChange={(e) => setEditForm(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="75001"
                />
              </div>
            </div>

            {/* Admin */}
            <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg">
              <Checkbox
                id="edit-isAdmin"
                checked={editForm.is_admin}
                onCheckedChange={(checked) =>
                  setEditForm(prev => ({ ...prev, is_admin: checked as boolean }))
                }
              />
              <Label htmlFor="edit-isAdmin" className="cursor-pointer text-sm">
                Droits administrateur
              </Label>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSaveUser}
                className="bg-[#407b85] hover:bg-[#407b85]/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirmer la suppression</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <span className="font-semibold text-gray-900">{userToDelete?.email}</span> ?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Cette action est irréversible</p>
                  <p className="mt-1">
                    Toutes les données associées à cet utilisateur seront définitivement supprimées.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
