import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Fingerprint, Loader2, AlertCircle, ArrowLeft, RefreshCw, Shield, FileText, Users, BarChart3, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/auth/OTPInput';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { sendOTPEmail, verifyOTPCode } from '@/services/mfa';

type MFAMethod = 'choice' | 'otp' | 'webauthn';

interface LocationState {
  userId: string;
  email: string;
  reason: 'first_login' | 'ip_changed' | 'expired';
}

export default function MFAVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;

  const [method, setMethod] = useState<MFAMethod>('choice');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const webAuthn = useWebAuthn();

  // Rediriger si pas de state ou si déjà vérifié
  useEffect(() => {
    if (!state) {
      navigate('/login', { replace: true });
      return;
    }

    // Vérifier l'enregistrement WebAuthn
    if (state.userId) {
      webAuthn.checkRegistration(state.userId);
    }
  }, [state, navigate, webAuthn.checkRegistration]);

  // Countdown pour le renvoi d'OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!state) return;

    setIsSendingOTP(true);
    setError(null);

    const result = await sendOTPEmail(state.userId, state.email);

    setIsSendingOTP(false);

    if (result.success) {
      setMethod('otp');
      setCountdown(60); // 60 secondes avant de pouvoir renvoyer
    } else {
      setError(result.error || 'Erreur lors de l\'envoi du code');
    }
  };

  const handleVerifyOTP = async (code: string) => {
    if (!state) return;

    setIsLoading(true);
    setError(null);

    const result = await verifyOTPCode(state.userId, code);

    setIsLoading(false);

    if (result.valid) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Code invalide');
    }
  };

  const handleWebAuthnAuth = async () => {
    if (!state) return;

    setIsLoading(true);
    setError(null);

    const success = await webAuthn.authenticate(state.userId);

    setIsLoading(false);

    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(webAuthn.error || 'Échec de l\'authentification biométrique');
    }
  };

  const handleWebAuthnRegister = async () => {
    if (!state) return;

    setIsLoading(true);
    setError(null);

    const success = await webAuthn.register(state.userId, state.email);

    setIsLoading(false);

    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(webAuthn.error || 'Échec de l\'enregistrement');
    }
  };

  const getReasonMessage = () => {
    switch (state?.reason) {
      case 'first_login':
        return 'Première connexion détectée';
      case 'ip_changed':
        return 'Nouvelle adresse IP détectée';
      case 'expired':
        return 'Vérification périodique requise';
      default:
        return 'Vérification de sécurité requise';
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche - Turquoise (identique à Login) */}
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

      {/* Panneau droit - Formulaire MFA */}
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

          {/* Carte de vérification */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-[#3E7A84]/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-[#3E7A84]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Vérification de sécurité
              </h2>
              <p className="text-gray-600 text-sm">
                {getReasonMessage()}
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Choix de méthode */}
            {method === 'choice' && (
              <div className="space-y-4">
                <p className="text-center text-gray-600 mb-6">
                  Choisissez votre méthode de vérification
                </p>

                {/* Option WebAuthn (si disponible et enregistré) */}
                {webAuthn.isAvailable && webAuthn.isRegistered && (
                  <Button
                    onClick={handleWebAuthnAuth}
                    disabled={isLoading || webAuthn.isLoading}
                    className="w-full h-14 bg-[#3E7A84] hover:bg-[#2D5F67] text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Fingerprint className="w-5 h-5 mr-2" />
                    )}
                    Utiliser l'empreinte digitale
                  </Button>
                )}

                {/* Option WebAuthn (si disponible mais non enregistré) */}
                {webAuthn.isAvailable && !webAuthn.isRegistered && !webAuthn.isLoading && (
                  <Button
                    onClick={handleWebAuthnRegister}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-14 border-[#3E7A84] text-[#3E7A84] hover:bg-[#3E7A84]/5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Fingerprint className="w-5 h-5 mr-2" />
                    )}
                    Configurer l'empreinte digitale
                  </Button>
                )}

                {/* Option Email OTP */}
                <Button
                  onClick={handleSendOTP}
                  disabled={isSendingOTP}
                  variant={webAuthn.isAvailable && webAuthn.isRegistered ? 'outline' : 'default'}
                  className={
                    webAuthn.isAvailable && webAuthn.isRegistered
                      ? 'w-full h-14 border-gray-300'
                      : 'w-full h-14 bg-[#3E7A84] hover:bg-[#2D5F67] text-white'
                  }
                >
                  {isSendingOTP ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5 mr-2" />
                  )}
                  Recevoir un code par email
                </Button>

                {!webAuthn.isAvailable && (
                  <p className="text-center text-xs text-gray-500 mt-4">
                    L'authentification biométrique n'est pas disponible sur ce device
                  </p>
                )}
              </div>
            )}

            {/* Saisie OTP */}
            {method === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">
                    Un code à 6 chiffres a été envoyé à
                  </p>
                  <p className="font-medium text-gray-900">{state.email}</p>
                </div>

                <OTPInput
                  onComplete={handleVerifyOTP}
                  disabled={isLoading}
                  error={!!error}
                />

                {isLoading && (
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3E7A84]" />
                  </div>
                )}

                {/* Renvoyer le code */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Renvoyer le code dans {countdown}s
                    </p>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleSendOTP}
                      disabled={isSendingOTP}
                      className="text-[#3E7A84] hover:text-[#2D5F67]"
                    >
                      {isSendingOTP ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Renvoyer le code
                    </Button>
                  )}
                </div>

                {/* Retour au choix */}
                {(webAuthn.isAvailable && webAuthn.isRegistered) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMethod('choice');
                      setError(null);
                    }}
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Choisir une autre méthode
                  </Button>
                )}
              </div>
            )}

            {/* Retour connexion */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </div>
          </div>

          {/* Info sécurité */}
          <p className="text-center text-xs text-gray-500 mt-6 px-4">
            Cette vérification est requise tous les 30 jours ou lors d'un changement d'adresse IP
            pour protéger votre compte.
          </p>

          {/* Copyright */}
          <p className="text-center text-sm text-gray-500 mt-4">
            © 2025 Waltera. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
