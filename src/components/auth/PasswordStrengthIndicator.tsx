import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

// Politique de mot de passe Supabase WALTERA
const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'Au moins 12 caractères', validator: (p) => p.length >= 12 },
  { label: 'Une lettre majuscule', validator: (p) => /[A-Z]/.test(p) },
  { label: 'Une lettre minuscule', validator: (p) => /[a-z]/.test(p) },
  { label: 'Un chiffre', validator: (p) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial (!@#$%^&*)', validator: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const req of PASSWORD_REQUIREMENTS) {
    if (!req.validator(password)) {
      errors.push(req.label);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  bgColor: string;
} {
  if (password.length === 0) {
    return { score: 0, label: '', color: '', bgColor: '' };
  }

  const passedRequirements = PASSWORD_REQUIREMENTS.filter(req => req.validator(password)).length;
  const score = (passedRequirements / PASSWORD_REQUIREMENTS.length) * 100;

  if (score < 40) {
    return { score, label: 'Faible', color: 'text-red-600', bgColor: 'bg-red-500' };
  }
  if (score < 60) {
    return { score, label: 'Moyen', color: 'text-orange-600', bgColor: 'bg-orange-500' };
  }
  if (score < 80) {
    return { score, label: 'Bon', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
  }
  if (score < 100) {
    return { score, label: 'Fort', color: 'text-blue-600', bgColor: 'bg-blue-500' };
  }
  return { score, label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-500' };
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3 mt-2">
      {/* Barre de progression */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Force du mot de passe</span>
          <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.bgColor}`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {/* Liste des exigences */}
      {showRequirements && (
        <div className="space-y-1">
          {PASSWORD_REQUIREMENTS.map((req, index) => {
            const isPassed = req.validator(password);
            return (
              <div
                key={index}
                className={`flex items-center space-x-2 text-xs ${
                  isPassed ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {isPassed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthIndicator;
