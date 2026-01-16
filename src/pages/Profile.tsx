import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Briefcase, MapPin, Phone, Save, Bell, Lock, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import AvatarUpload from '@/components/AvatarUpload';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [receiveCcnAlerts, setReceiveCcnAlerts] = useState(true);
  const [isSavingCcnAlerts, setIsSavingCcnAlerts] = useState(false);

  // États pour le changement de mot de passe
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Validation de la politique de mot de passe
  const passwordValidation = useMemo(() => {
    const password = passwordForm.newPassword;
    return {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      passwordsMatch: password === passwordForm.confirmPassword && password.length > 0,
    };
  }, [passwordForm.newPassword, passwordForm.confirmPassword]);

  // Calcul du score de robustesse (0-100)
  const passwordStrength = useMemo(() => {
    const { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial } = passwordValidation;
    const checks = [minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial];
    const passedChecks = checks.filter(Boolean).length;

    // Score de base
    let score = passedChecks * 20;

    // Bonus pour longueur supplémentaire
    if (passwordForm.newPassword.length >= 16) score = Math.min(100, score + 10);
    if (passwordForm.newPassword.length >= 20) score = Math.min(100, score + 10);

    return score;
  }, [passwordValidation, passwordForm.newPassword]);

  const getStrengthLabel = (score: number) => {
    if (score < 40) return { label: 'Faible', color: 'bg-red-500' };
    if (score < 60) return { label: 'Moyen', color: 'bg-orange-500' };
    if (score < 80) return { label: 'Bon', color: 'bg-yellow-500' };
    return { label: 'Excellent', color: 'bg-green-500' };
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Charger la préférence CCN alerts depuis le profil
  useEffect(() => {
    if (profile) {
      setReceiveCcnAlerts(profile.receive_ccn_alerts !== false);
    }
  }, [profile]);

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

  const handleCcnAlertsChange = async (checked: boolean) => {
    setIsSavingCcnAlerts(true);
    try {
      const success = await updateProfile({ receive_ccn_alerts: checked });
      if (success) {
        setReceiveCcnAlerts(checked);
      }
    } catch (err) {
      console.error('Erreur sauvegarde préférence CCN alerts:', err);
    } finally {
      setIsSavingCcnAlerts(false);
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

  const handlePasswordChange = async () => {
    if (!isPasswordValid) {
      toast.error('Le mot de passe ne respecte pas la politique de sécurité');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Vérifier d'abord le mot de passe actuel en tentant une reconnexion
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        toast.error('Le mot de passe actuel est incorrect');
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Mot de passe modifié avec succès');
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
              {/* Avatar, Nom et Poste à gauche de la card */}
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-200">
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

                {/* Nom et Poste */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {userData.firstName} {userData.lastName}
                  </h2>
                  <p className="text-gray-600">{userData.role}</p>
                </div>
              </div>

              {/* Champs du formulaire */}
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

                {/* Séparateur */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Alertes CCN</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="ccnAlerts"
                        checked={receiveCcnAlerts}
                        onCheckedChange={(checked) => handleCcnAlertsChange(checked as boolean)}
                        disabled={isSavingCcnAlerts}
                      />
                      <div>
                        <label htmlFor="ccnAlerts" className="text-sm font-medium cursor-pointer">
                          Alertes modifications CCN
                        </label>
                        <p className="text-xs text-gray-500">
                          Recevoir un email récapitulatif lors de mises à jour importantes des conventions collectives (SOP, clauses sensibles)
                        </p>
                      </div>
                    </div>
                    {isSavingCcnAlerts && (
                      <Loader2 className="w-4 h-4 animate-spin text-[#407b85]" />
                    )}
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
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
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
      </main>

      <Footer />

      {/* Dialogue de changement de mot de passe */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={handleClosePasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Votre nouveau mot de passe doit respecter la politique de sécurité
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Mot de passe actuel */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Entrez votre mot de passe actuel"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Entrez un nouveau mot de passe"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Indicateur de robustesse */}
              {passwordForm.newPassword.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Robustesse du mot de passe</span>
                    <span className={`font-medium ${
                      passwordStrength < 40 ? 'text-red-600' :
                      passwordStrength < 60 ? 'text-orange-600' :
                      passwordStrength < 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getStrengthLabel(passwordStrength).label}
                    </span>
                  </div>
                  <Progress
                    value={passwordStrength}
                    className="h-2"
                  />
                </div>
              )}
            </div>

            {/* Confirmation du mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmez le nouveau mot de passe"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Critères de validation */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">Politique de mot de passe :</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordValidation.minLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Au moins 12 caractères</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordValidation.hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Au moins une majuscule</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordValidation.hasLowercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Au moins une minuscule</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordValidation.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Au moins un chiffre</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordValidation.hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Au moins un caractère spécial (!@#$%...)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.passwordsMatch ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordValidation.passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Les mots de passe correspondent</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClosePasswordDialog}
              disabled={isChangingPassword}
            >
              Annuler
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={!isPasswordValid || !passwordForm.currentPassword || isChangingPassword}
              className="bg-[#407b85] hover:bg-[#407b85]/90"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Modification...
                </>
              ) : (
                'Modifier le mot de passe'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
