import { supabase } from '@/integrations/supabase/client';

const OTP_EXPIRY_MINUTES = 10;
const OTP_VALIDITY_DAYS = 30;

// Type helper pour les tables non encore typées dans Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

interface UserSession {
  id: string;
  user_id: string;
  ip_address: string;
  last_otp_at: string | null;
  webauthn_credential_id: string | null;
  webauthn_public_key: string | null;
  device_name: string | null;
  is_trusted: boolean;
  created_at: string;
  updated_at: string;
}

// Interface OTPCode commentée car utilisée uniquement pour la documentation
// interface OTPCode {
//   id: string;
//   user_id: string;
//   code: string;
//   expires_at: string;
//   used: boolean;
//   created_at: string;
// }

/**
 * Récupère l'adresse IP du client via un service externe
 */
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'IP:', error);
    return 'unknown';
  }
}

/**
 * Génère un code OTP à 6 chiffres
 */
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Vérifie si l'utilisateur a besoin de MFA
 * Conditions : première connexion, > 30 jours, ou IP différente
 */
export async function checkMFARequired(userId: string): Promise<{
  required: boolean;
  reason: 'first_login' | 'ip_changed' | 'expired' | null;
  hasWebAuthn: boolean;
  currentSession: UserSession | null;
}> {
  const currentIP = await getClientIP();

  // Chercher une session existante pour cet utilisateur et cette IP
  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('ip_address', currentIP)
    .eq('is_trusted', true)
    .order('last_otp_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erreur lors de la vérification MFA:', error);
    return { required: true, reason: 'first_login', hasWebAuthn: false, currentSession: null };
  }

  // Vérifier si l'utilisateur a un device WebAuthn enregistré (sur n'importe quelle session)
  const { data: webAuthnSessions } = await supabase
    .from('user_sessions')
    .select('webauthn_credential_id')
    .eq('user_id', userId)
    .not('webauthn_credential_id', 'is', null)
    .limit(1);

  const hasWebAuthn = !!(webAuthnSessions && webAuthnSessions.length > 0);

  // Pas de session trouvée pour cette IP
  if (!sessions || sessions.length === 0) {
    // Vérifier s'il existe d'autres sessions (pour différencier première connexion vs IP changée)
    const { data: anySessions } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!anySessions || anySessions.length === 0) {
      return { required: true, reason: 'first_login', hasWebAuthn, currentSession: null };
    }

    return { required: true, reason: 'ip_changed', hasWebAuthn, currentSession: null };
  }

  const session = sessions[0] as UserSession;

  // Vérifier si la dernière vérification OTP date de plus de 30 jours
  if (session.last_otp_at) {
    const lastOTP = new Date(session.last_otp_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastOTP.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff >= OTP_VALIDITY_DAYS) {
      return { required: true, reason: 'expired', hasWebAuthn, currentSession: session };
    }
  } else {
    // Pas de last_otp_at = jamais vérifié
    return { required: true, reason: 'first_login', hasWebAuthn, currentSession: session };
  }

  // MFA non requis
  return { required: false, reason: null, hasWebAuthn, currentSession: session };
}

/**
 * Crée et envoie un code OTP par email
 */
export async function sendOTPEmail(userId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Supprimer les anciens codes non utilisés pour cet utilisateur
  await supabase
    .from('otp_codes')
    .delete()
    .eq('user_id', userId)
    .eq('used', false);

  // Créer le nouveau code
  const { error: insertError } = await (supabase
    .from('otp_codes') as AnyTable)
    .insert({
      user_id: userId,
      code,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error('Erreur lors de la création du code OTP:', insertError);
    return { success: false, error: 'Erreur lors de la création du code' };
  }

  // Envoyer l'email via Supabase Edge Function
  const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
    body: { email, code, expiresInMinutes: OTP_EXPIRY_MINUTES },
  });

  if (emailError) {
    console.error('Erreur lors de l\'envoi de l\'email OTP:', emailError);
    return { success: false, error: 'Erreur lors de l\'envoi de l\'email' };
  }

  return { success: true };
}

/**
 * Vérifie un code OTP
 */
export async function verifyOTPCode(userId: string, code: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  const { data: otpCodes, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .limit(1);

  if (error) {
    console.error('Erreur lors de la vérification OTP:', error);
    return { valid: false, error: 'Erreur de vérification' };
  }

  if (!otpCodes || otpCodes.length === 0) {
    return { valid: false, error: 'Code invalide ou expiré' };
  }

  // Marquer le code comme utilisé
  await (supabase
    .from('otp_codes') as AnyTable)
    .update({ used: true })
    .eq('id', (otpCodes as AnyTable)[0].id);

  // Mettre à jour ou créer la session
  await updateUserSession(userId);

  return { valid: true };
}

/**
 * Met à jour ou crée une session utilisateur après vérification MFA réussie
 */
export async function updateUserSession(userId: string, webAuthnData?: {
  credentialId: string;
  publicKey: string;
  deviceName?: string;
}): Promise<void> {
  const currentIP = await getClientIP();
  const now = new Date().toISOString();

  // Chercher une session existante pour cette IP
  const { data: existingSessions } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('ip_address', currentIP)
    .limit(1);

  if (existingSessions && existingSessions.length > 0) {
    // Mettre à jour la session existante
    const updateData: Partial<UserSession> = {
      last_otp_at: now,
      is_trusted: true,
    };

    if (webAuthnData) {
      updateData.webauthn_credential_id = webAuthnData.credentialId;
      updateData.webauthn_public_key = webAuthnData.publicKey;
      if (webAuthnData.deviceName) {
        updateData.device_name = webAuthnData.deviceName;
      }
    }

    await (supabase
      .from('user_sessions') as AnyTable)
      .update(updateData)
      .eq('id', (existingSessions as AnyTable)[0].id);
  } else {
    // Créer une nouvelle session
    const newSession: Partial<UserSession> = {
      user_id: userId,
      ip_address: currentIP,
      last_otp_at: now,
      is_trusted: true,
    };

    if (webAuthnData) {
      newSession.webauthn_credential_id = webAuthnData.credentialId;
      newSession.webauthn_public_key = webAuthnData.publicKey;
      if (webAuthnData.deviceName) {
        newSession.device_name = webAuthnData.deviceName;
      }
    }

    await (supabase
      .from('user_sessions') as AnyTable)
      .insert(newSession);
  }
}

/**
 * Récupère les credentials WebAuthn d'un utilisateur
 */
export async function getWebAuthnCredentials(userId: string): Promise<{
  credentialId: string;
  publicKey: string;
} | null> {
  const { data: sessions } = await supabase
    .from('user_sessions')
    .select('webauthn_credential_id, webauthn_public_key')
    .eq('user_id', userId)
    .not('webauthn_credential_id', 'is', null)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return null;
  }

  const session = (sessions as AnyTable)[0];
  return {
    credentialId: session.webauthn_credential_id!,
    publicKey: session.webauthn_public_key!,
  };
}
