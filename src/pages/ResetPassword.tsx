import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a accès à cette page (vient d'un lien de réinitialisation)
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsValidSession(true);
    } else {
      // Vérifier si on est dans un flow de récupération
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        setIsValidSession(true);
      } else {
        // Pas de session valide, rediriger vers la page de connexion
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    }
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return { label: '', color: '' };
    if (password.length < 6) return { label: 'Très faible', color: 'text-red-600' };
    if (password.length < 8) return { label: 'Faible', color: 'text-orange-600' };
    if (password.length < 12) return { label: 'Moyen', color: 'text-yellow-600' };
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      return { label: 'Fort', color: 'text-green-600' };
    }
    return { label: 'Bon', color: 'text-blue-600' };
  };

  const passwordStrength = getPasswordStrength();

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Session invalide</h2>
          <p className="text-gray-600">
            Le lien de réinitialisation est invalide ou a expiré.
            Vous allez être redirigé vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche - Turquoise */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#5A949E] to-[#3E7A84] relative overflow-hidden">
        {/* Cercles décoratifs en arrière-plan */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          {/* Logo horizontal WALTERA */}
          <div className="mb-12 flex items-center space-x-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-20 h-20 flex-shrink-0">
              <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="2"/>
              <g>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(0 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(12 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(24 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(36 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(48 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(60 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(72 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(84 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(96 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(108 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(120 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(132 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(144 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(156 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(168 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(180 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(192 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(204 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(216 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(228 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(240 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(252 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(264 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(276 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(288 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(300 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(312 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(324 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(336 50 50)"/>
                <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(348 50 50)"/>
              </g>
              <g>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(0 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(15 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(30 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(45 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(60 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(75 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(90 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(105 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(120 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(135 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(150 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(165 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(180 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(195 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(210 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(225 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(240 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(255 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(270 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(285 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(300 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(315 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(330 50 50)"/>
                <rect x="47.5" y="20" width="5" height="7" fill="white" transform="rotate(345 50 50)"/>
              </g>
            </svg>
            <div className="text-white">
              <div className="text-3xl font-bold tracking-tight leading-tight">WALTERA</div>
              <div className="text-sm font-medium tracking-widest opacity-90">CONSEIL & ASSURANCES</div>
            </div>
          </div>

          {/* Conseils de sécurité */}
          <div className="space-y-4 mt-12">
            <h3 className="text-2xl font-bold text-white">Créez un mot de passe sécurisé</h3>
            <p className="text-white/90 text-lg leading-relaxed">
              Pour protéger votre compte, suivez ces recommandations :
            </p>
            <ul className="space-y-3 mt-8">
              <li className="flex items-start space-x-3">
                <span className="text-white/70 mt-0.5">•</span>
                <p className="text-white/90">Au moins 8 caractères</p>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-white/70 mt-0.5">•</span>
                <p className="text-white/90">Mélangez majuscules et minuscules</p>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-white/70 mt-0.5">•</span>
                <p className="text-white/90">Incluez des chiffres et caractères spéciaux</p>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-white/70 mt-0.5">•</span>
                <p className="text-white/90">Évitez les mots du dictionnaire</p>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-white/70 mt-0.5">•</span>
                <p className="text-white/90">N'utilisez pas d'informations personnelles</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Panneau droit - Blanc avec formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12">
                <circle cx="50" cy="50" r="48" fill="#3E7A84"/>
                <g>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(0 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(30 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(60 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(90 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(120 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(150 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(180 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(210 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(240 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(270 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(300 50 50)"/>
                  <rect x="47.5" y="8" width="5" height="8" fill="white" transform="rotate(330 50 50)"/>
                </g>
              </svg>
              <div className="text-[#3E7A84]">
                <div className="text-xl font-bold tracking-tight">WALTERA</div>
                <div className="text-xs font-medium tracking-wider">AI ASSISTANT</div>
              </div>
            </div>
          </div>

          {/* Carte de réinitialisation */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!isSuccess ? (
              <>
                {/* Titre */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer un nouveau mot de passe</h2>
                  <p className="text-gray-600">
                    Choisissez un mot de passe sécurisé pour votre compte
                  </p>
                </div>

                {/* Erreur */}
                {error && (
                  <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Formulaire */}
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* Nouveau mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Nouveau mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-300"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password && (
                      <p className={`text-sm ${passwordStrength.color}`}>
                        Force du mot de passe : {passwordStrength.label}
                      </p>
                    )}
                  </div>

                  {/* Confirmer le mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-300"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-600">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>

                  {/* Bouton de réinitialisation */}
                  <Button
                    type="submit"
                    className="w-full bg-[#3E7A84] hover:bg-[#2D5F67] text-white font-semibold h-12 text-base"
                    disabled={isLoading || (!!confirmPassword && password !== confirmPassword)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Réinitialisation en cours...
                      </>
                    ) : (
                      'Réinitialiser le mot de passe'
                    )}
                  </Button>
                </form>
              </>
            ) : (
              /* Message de succès */
              <div className="text-center py-8">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Mot de passe modifié !</h2>
                <p className="text-gray-600 mb-8">
                  Votre mot de passe a été modifié avec succès.
                  Vous allez être redirigé vers la page de connexion...
                </p>
                <div className="animate-pulse">
                  <Loader2 className="w-6 h-6 mx-auto text-[#3E7A84] animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Copyright */}
          <p className="text-center text-sm text-gray-500 mt-8">
            © 2025 Waltera. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}