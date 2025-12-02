/**
 * Formulaire de devis - Point d'entrée principal
 * Wrapper avec DevisProvider pour gérer le state global
 */

import { DevisProvider } from '@/contexts/DevisContext';
import DevisFormContent from './devis/DevisFormContent';

export default function DevisForm() {
  return (
    <DevisProvider>
      <DevisFormContent />
    </DevisProvider>
  );
}
