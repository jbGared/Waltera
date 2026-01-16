import { useState, useCallback, useEffect } from 'react';
import { getWebAuthnCredentials, updateUserSession } from '@/services/mfa';

interface WebAuthnState {
  isSupported: boolean;
  isAvailable: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseWebAuthnReturn extends WebAuthnState {
  register: (userId: string, userName: string) => Promise<boolean>;
  authenticate: (userId: string) => Promise<boolean>;
  checkRegistration: (userId: string) => Promise<boolean>;
}

// Convertir ArrayBuffer en base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convertir base64 en ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// Générer un challenge aléatoire
function generateChallenge(): ArrayBuffer {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge.buffer as ArrayBuffer;
}

export function useWebAuthn(): UseWebAuthnReturn {
  const [state, setState] = useState<WebAuthnState>({
    isSupported: false,
    isAvailable: false,
    isRegistered: false,
    isLoading: true,
    error: null,
  });

  // Vérifier si WebAuthn est supporté et disponible
  useEffect(() => {
    const checkWebAuthn = async () => {
      // Vérifier si l'API WebAuthn est disponible
      const isSupported =
        typeof window !== 'undefined' &&
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential === 'function';

      if (!isSupported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isAvailable: false,
          isLoading: false,
        }));
        return;
      }

      // Vérifier si un authenticateur est disponible (Touch ID, Face ID, etc.)
      try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setState(prev => ({
          ...prev,
          isSupported: true,
          isAvailable,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Erreur lors de la vérification WebAuthn:', error);
        setState(prev => ({
          ...prev,
          isSupported: true,
          isAvailable: false,
          isLoading: false,
        }));
      }
    };

    checkWebAuthn();
  }, []);

  // Vérifier si l'utilisateur a déjà enregistré un authenticateur
  const checkRegistration = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const credentials = await getWebAuthnCredentials(userId);
      const isRegistered = credentials !== null;
      setState(prev => ({ ...prev, isRegistered }));
      return isRegistered;
    } catch (error) {
      console.error('Erreur lors de la vérification des credentials:', error);
      return false;
    }
  }, []);

  // Enregistrer un nouvel authenticateur
  const register = useCallback(async (userId: string, userName: string): Promise<boolean> => {
    if (!state.isSupported || !state.isAvailable) {
      setState(prev => ({ ...prev, error: 'WebAuthn non disponible sur ce device' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const challenge = generateChallenge();

      // Options pour la création des credentials
      const createOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'WALTERA',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Utiliser l'authenticateur intégré (Touch ID, etc.)
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: createOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Échec de la création des credentials');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Sauvegarder les credentials
      const credentialId = arrayBufferToBase64(credential.rawId);
      const publicKey = arrayBufferToBase64(response.getPublicKey()!);

      // Détecter le nom du device
      const deviceName = getDeviceName();

      await updateUserSession(userId, {
        credentialId,
        publicKey,
        deviceName,
      });

      setState(prev => ({
        ...prev,
        isRegistered: true,
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement WebAuthn:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors de l\'enregistrement',
      }));
      return false;
    }
  }, [state.isSupported, state.isAvailable]);

  // Authentifier avec un authenticateur existant
  const authenticate = useCallback(async (userId: string): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'WebAuthn non supporté' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Récupérer les credentials existants
      const credentials = await getWebAuthnCredentials(userId);

      if (!credentials) {
        throw new Error('Aucun authenticateur enregistré');
      }

      const challenge = generateChallenge();

      // Options pour l'authentification
      const getOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
          type: 'public-key',
          id: base64ToArrayBuffer(credentials.credentialId),
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: getOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Échec de l\'authentification');
      }

      // Mettre à jour la session
      await updateUserSession(userId);

      setState(prev => ({
        ...prev,
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      console.error('Erreur lors de l\'authentification WebAuthn:', error);

      let errorMessage = 'Erreur lors de l\'authentification';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Authentification annulée ou refusée';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Erreur de sécurité';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [state.isSupported]);

  return {
    ...state,
    register,
    authenticate,
    checkRegistration,
  };
}

// Fonction utilitaire pour détecter le nom du device
function getDeviceName(): string {
  const userAgent = navigator.userAgent;

  if (/iPhone/.test(userAgent)) {
    return 'iPhone (Face ID / Touch ID)';
  }
  if (/iPad/.test(userAgent)) {
    return 'iPad (Touch ID)';
  }
  if (/Mac/.test(userAgent)) {
    return 'Mac (Touch ID)';
  }
  if (/Windows/.test(userAgent)) {
    return 'Windows (Windows Hello)';
  }
  if (/Android/.test(userAgent)) {
    return 'Android (Empreinte digitale)';
  }

  return 'Device inconnu';
}
