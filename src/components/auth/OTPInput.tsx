import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus sur le premier input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Vérifier si le code est complet
  useEffect(() => {
    const code = values.join('');
    if (code.length === length && !values.includes('')) {
      onComplete(code);
    }
  }, [values, length, onComplete]);

  const handleChange = (index: number, value: string) => {
    // Accepter uniquement les chiffres
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    // Passer au champ suivant si un chiffre est entré
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Retour arrière : effacer et revenir au champ précédent
    if (e.key === 'Backspace') {
      if (values[index]) {
        // Effacer la valeur actuelle
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
      } else if (index > 0) {
        // Revenir au champ précédent
        inputRefs.current[index - 1]?.focus();
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
      }
      e.preventDefault();
    }

    // Flèche gauche
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Flèche droite
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

    if (pastedData) {
      const newValues = [...values];
      for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i];
      }
      setValues(newValues);

      // Focus sur le dernier champ rempli ou le suivant
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Sélectionner le contenu lors du focus
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={values[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold',
            'border-2 rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:border-[#3E7A84] focus:ring-[#3E7A84] bg-white',
            values[index] && !error && 'border-[#3E7A84] bg-[#3E7A84]/5'
          )}
          aria-label={`Chiffre ${index + 1} du code`}
        />
      ))}
    </div>
  );
}
