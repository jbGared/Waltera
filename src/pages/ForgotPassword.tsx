import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Utiliser l'URL de l'application pour la redirection
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
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

          {/* Message de réinitialisation */}
          <div className="space-y-4 mt-12">
            <h3 className="text-2xl font-bold text-white">Réinitialisation sécurisée</h3>
            <p className="text-white/90 text-lg leading-relaxed">
              Nous prenons la sécurité de votre compte très au sérieux.
              Un email de réinitialisation sera envoyé à votre adresse enregistrée.
            </p>
            <div className="space-y-3 mt-8">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-semibold">1</span>
                </div>
                <p className="text-white/90">Saisissez votre adresse email professionnelle</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-semibold">2</span>
                </div>
                <p className="text-white/90">Vérifiez votre boîte de réception</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-semibold">3</span>
                </div>
                <p className="text-white/90">Suivez le lien pour créer un nouveau mot de passe</p>
              </div>
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

          {/* Carte de réinitialisation */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!isSuccess ? (
              <>
                {/* Titre */}
                <div className="mb-8">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour à la connexion
                  </Link>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h2>
                  <p className="text-gray-600">
                    Pas de problème. Indiquez-nous votre adresse email et nous vous enverrons
                    un lien pour réinitialiser votre mot de passe.
                  </p>
                </div>

                {/* Erreur */}
                {error && (
                  <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Formulaire */}
                <form onSubmit={handleResetPassword} className="space-y-5">
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

                  {/* Bouton d'envoi */}
                  <Button
                    type="submit"
                    className="w-full bg-[#3E7A84] hover:bg-[#2D5F67] text-white font-semibold h-12 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      'Envoyer le lien de réinitialisation'
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Email envoyé !</h2>
                <p className="text-gray-600 mb-8">
                  Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
                  Vérifiez votre boîte de réception et suivez les instructions pour créer
                  un nouveau mot de passe.
                </p>
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-700">
                    Si vous ne voyez pas l'email, vérifiez votre dossier de spam ou courrier indésirable.
                  </AlertDescription>
                </Alert>
                <Link
                  to="/login"
                  className="inline-flex items-center text-[#3E7A84] hover:text-[#2D5F67] font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
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