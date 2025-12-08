import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Briefcase, MapPin, Phone, Save, Bell, Lock, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import AvatarUpload from '@/components/AvatarUpload';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProfile } from '@/hooks/useProfile';

export default function Profile() {
  const { profile, updateProfile, reload } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  // Charger les données depuis la table profiles
  useEffect(() => {
    if (profile) {
      setUserData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        role: profile.role || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postal_code || '',
      });
    }
  }, [profile]);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    conversationUpdates: true,
    analysisReports: false,
    weeklyDigest: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile({
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        postal_code: userData.postalCode,
      });

      if (success) {
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Recharger les données originales depuis profile
    if (profile) {
      setUserData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        role: profile.role || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postal_code || '',
      });
    }
  };

  const handleAddressChange = (address: string, postalCode: string) => {
    // Extraire la ville de l'adresse complète
    const parts = address.split(',');
    const city = parts[parts.length - 1]?.trim() || '';

    setUserData(prev => ({
      ...prev,
      address: address,
      postalCode: postalCode,
      city: city,
    }));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion du Profil
          </h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        <div className="space-y-6">
          {/* Avatar et Infos */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {/* Avatar avec upload */}
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url || null}
                  userInitials={
                    userData.firstName && userData.lastName
                      ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                      : profile?.email?.substring(0, 2).toUpperCase() || 'U'
                  }
                  onAvatarChange={reload}
                />

                {/* Nom */}
                <h2 className="text-xl font-bold text-gray-900">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="text-gray-600">{userData.role}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cards principales */}
          <div className="space-y-6">
            {/* Informations Personnelles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informations Personnelles</CardTitle>
                    <CardDescription>
                      Vos informations de profil et coordonnées
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-[#407b85] text-[#407b85] hover:bg-[#407b85] hover:text-white"
                    >
                      Modifier
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSave}
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
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Prénom */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <Input
                        id="firstName"
                        value={userData.firstName}
                        onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>
                  </div>

                  {/* Nom */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <Input
                        id="lastName"
                        value={userData.lastName}
                        onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>
                  </div>

                  {/* Rôle */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Fonction</Label>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <Input
                        id="role"
                        value={userData.role}
                        onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>
                  </div>

                  {/* Adresse avec autocomplete */}
                  <div className="md:col-span-2">
                    {isEditing ? (
                      <AddressAutocomplete
                        value={userData.address}
                        onChange={handleAddressChange}
                        label="Adresse"
                        placeholder="Tapez votre adresse..."
                      />
                    ) : (
                      <div className="space-y-2">
                        <Label>Adresse</Label>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-900">
                            {userData.address || 'Aucune adresse'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ville et Code Postal (lecture seule, remplis par autocomplete) */}
                  {!isEditing && (
                    <>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-900">
                          {userData.city || '-'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Code Postal</Label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-900">
                          {userData.postalCode || '-'}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Ville et CP en édition (remplis automatiquement) */}
                  {isEditing && userData.postalCode && (
                    <div className="md:col-span-2 bg-[#407b85]/10 rounded-lg p-3 border border-[#407b85]/30">
                      <p className="text-xs text-[#407b85] mb-1 font-medium">Informations détectées</p>
                      <div className="flex space-x-4 text-sm">
                        <span className="font-semibold text-[#407b85]">
                          {userData.city}
                        </span>
                        <span className="text-[#407b85]/70">•</span>
                        <span className="font-semibold text-[#407b85]">
                          {userData.postalCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Préférences de Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-[#407b85]" />
                  <div>
                    <CardTitle>Préférences de Notifications</CardTitle>
                    <CardDescription>
                      Gérez comment vous souhaitez être informé
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="emailNotifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailNotifications: checked as boolean })
                      }
                    />
                    <div>
                      <label htmlFor="emailNotifications" className="text-sm font-medium cursor-pointer">
                        Notifications par email
                      </label>
                      <p className="text-xs text-gray-500">
                        Recevoir des notifications par email
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="conversationUpdates"
                      checked={notifications.conversationUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, conversationUpdates: checked as boolean })
                      }
                    />
                    <div>
                      <label htmlFor="conversationUpdates" className="text-sm font-medium cursor-pointer">
                        Mises à jour des conversations
                      </label>
                      <p className="text-xs text-gray-500">
                        Être notifié des nouvelles réponses
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="analysisReports"
                      checked={notifications.analysisReports}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, analysisReports: checked as boolean })
                      }
                    />
                    <div>
                      <label htmlFor="analysisReports" className="text-sm font-medium cursor-pointer">
                        Rapports d'analyse
                      </label>
                      <p className="text-xs text-gray-500">
                        Recevoir les rapports d'analyse terminés
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="weeklyDigest"
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, weeklyDigest: checked as boolean })
                      }
                    />
                    <div>
                      <label htmlFor="weeklyDigest" className="text-sm font-medium cursor-pointer">
                        Récapitulatif hebdomadaire
                      </label>
                      <p className="text-xs text-gray-500">
                        Résumé de votre activité chaque semaine
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sécurité */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-[#407b85]" />
                  <div>
                    <CardTitle>Sécurité et Confidentialité</CardTitle>
                    <CardDescription>
                      Gérez vos paramètres de sécurité
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Authentification à deux facteurs
                </Button>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Supprimer mon compte
                  </Button>
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
