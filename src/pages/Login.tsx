import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, FileText, Users, BarChart3, Eye, EyeOff, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { checkMFARequired } from '@/services/mfa';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        // Vérifier si MFA est requis
        const mfaCheck = await checkMFARequired(data.user.id);

        if (mfaCheck.required) {
          // Rediriger vers la page MFA
          navigate('/mfa', {
            state: {
              userId: data.user.id,
              email: data.user.email,
              reason: mfaCheck.reason,
            },
            replace: true,
          });
        } else {
          // MFA non requis, accès direct au dashboard
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
    }
  };

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

          {/* Features */}
          <div className="space-y-6 mt-12">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-lg">Consultation Contrats Clients</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-lg">Conventions Collectives</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-lg">Analyse Réseau de Fichiers</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-lg">Tarificateur Santé Individuelle</span>
            </div>
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

          {/* Carte de connexion */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Titre */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
              <p className="text-gray-600">Accédez à votre espace de services WALTERA</p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="consultant@waltera.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-300"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Mot de passe
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
              </div>

              {/* Se souvenir de moi & Mot de passe oublié */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-gray-700 cursor-pointer font-normal"
                  >
                    Se souvenir de moi
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#3E7A84] hover:text-[#2D5F67] font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-full bg-[#3E7A84] hover:bg-[#2D5F67] text-white font-semibold h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Séparateur */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">ou continuer avec</span>
                </div>
              </div>

              {/* Bouton OAuth Google */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </form>

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
