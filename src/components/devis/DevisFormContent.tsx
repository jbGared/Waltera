/**
 * Contenu principal du formulaire de devis
 * Utilise le DevisContext et les sous-composants
 */

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDevisContext } from '@/contexts/DevisContext';
import { calculerDevisSupabase } from '@/services/tarificateur';
import { enregistrerDemandeDevis } from '@/services/tarificateur/supabase';
import {
  buildDevisInput,
  buildBeneficiairesData,
  buildDemandeDevisData,
  isDateComplete,
  isFormReadyForSave,
} from '@/services/devis';

// Sous-composants
import DevisFormHeader from './DevisFormHeader';
import AssurePrincipalSection from './AssurePrincipalSection';
import ConjointSection from './ConjointSection';
import EnfantsSection from './EnfantsSection';
import OptionsSection from './OptionsSection';
import RecapitulatifPanel from './RecapitulatifPanel';

export default function DevisFormContent() {
  const {
    formData,
    setFormData,
    setDevis,
    setIsLoading,
    hasConjoint,
    setHasConjoint,
  } = useDevisContext();

  const [showForm, setShowForm] = useState(false);
  const [tempRgpdConsent, setTempRgpdConsent] = useState(false);

  // Gérer "Assuré seul" automatiquement
  useEffect(() => {
    // Si on ajoute un conjoint ou un enfant, décocher "Assuré seul"
    if (
      (hasConjoint || formData.enfants.length > 0) &&
      formData.assureSeul &&
      formData.gamme === 'TNS_FORMULES'
    ) {
      setFormData(prev => ({ ...prev, assureSeul: false }));
    }
    // Recocher si plus de conjoint ni d'enfants (pour TNS uniquement)
    else if (
      !hasConjoint &&
      formData.enfants.length === 0 &&
      !formData.assureSeul &&
      formData.gamme === 'TNS_FORMULES'
    ) {
      setFormData(prev => ({ ...prev, assureSeul: true }));
    }
  }, [hasConjoint, formData.enfants.length, formData.gamme]);

  // Calcul automatique en temps réel
  useEffect(() => {
    if (
      formData.gamme &&
      formData.codePostal.length === 5 &&
      formData.dateEffet &&
      isDateComplete(formData.assureNaissance) &&
      formData.rgpdConsent
    ) {
      calculerDevisAutomatique();
    }
  }, [
    formData.gamme,
    formData.codePostal,
    formData.dateEffet,
    formData.assureNaissance,
    formData.assureSeul,
    formData.conjointNaissance,
    formData.enfants.map(e => e.dateNaissance).join(','),
    formData.option,
    formData.surcomplementaire,
    formData.renfortHospi,
    formData.commission,
    formData.rgpdConsent,
    hasConjoint,
  ]);

  const calculerDevisAutomatique = async () => {
    try {
      setIsLoading(true);

      const input = buildDevisInput(formData, hasConjoint);
      const result = await calculerDevisSupabase(input);
      setDevis(result);

      if (isFormReadyForSave(formData, result.tarifMensuel)) {
        const beneficiaires = buildBeneficiairesData(formData, result, hasConjoint);
        const demandeData = buildDemandeDevisData(formData, result, beneficiaires);

        enregistrerDemandeDevis(demandeData).catch(error => {
          console.error('Erreur lors de l\'enregistrement du devis:', error);
        });
      }
    } catch (err) {
      console.error('Erreur lors du calcul:', err);
      setDevis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDevis = () => {
    if (tempRgpdConsent) {
      setFormData(prev => ({ ...prev, rgpdConsent: true }));
      setShowForm(true);
    }
  };

  const handleAddressChange = (address: string, postalCode: string) => {
    setFormData(prev => ({
      ...prev,
      adresseComplete: address,
      codePostal: postalCode,
    }));
  };

  // Page d'introduction avec consentement RGPD
  if (!showForm) {
    return (
      <div className="max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#407b85]/5 to-transparent">
            <CardTitle className="text-2xl text-gray-900">
              Simulateur de Tarifs Santé
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="prose prose-sm">
              <p className="text-gray-700">
                Bienvenue sur notre simulateur de tarifs de complémentaire santé.
              </p>
              <p className="text-gray-700">
                Nous allons vous accompagner pour établir un devis personnalisé en fonction de votre profil et de vos besoins.
              </p>
            </div>

            {/* RGPD Consent */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                Consentement pour le traitement des données
              </h3>
              <p className="text-xs text-gray-700">
                En cochant cette case, vous acceptez que vos données soient utilisées pour établir un devis et être recontacté par nos services. Vos données sont traitées conformément au RGPD et ne seront jamais partagées avec des tiers.
              </p>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="rgpdConsent"
                  checked={tempRgpdConsent}
                  onCheckedChange={(checked) => setTempRgpdConsent(checked === true)}
                />
                <Label
                  htmlFor="rgpdConsent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  J'accepte que mes données soient utilisées pour établir un devis
                  <span className="text-red-500 ml-1">*</span>
                </Label>
              </div>
            </div>

            <button
              onClick={handleStartDevis}
              disabled={!tempRgpdConsent}
              className="w-full bg-[#407b85] hover:bg-[#407b85]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Commencer le devis
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulaire principal
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulaire - 2 colonnes */}
      <div className={`lg:col-span-2 ${formData ? 'pb-32 lg:pb-0' : ''}`}>
        <Card className="shadow-md border-0">
          <CardHeader className="bg-gradient-to-r from-[#407b85]/5 to-transparent border-b">
            <CardTitle className="text-xl text-gray-900">Informations du Devis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <DevisFormHeader onAddressChange={handleAddressChange} />
            <AssurePrincipalSection />
            <ConjointSection hasConjoint={hasConjoint} setHasConjoint={setHasConjoint} />
            <EnfantsSection />
            <OptionsSection />
          </CardContent>
        </Card>
      </div>

      {/* Panel récapitulatif - 1 colonne */}
      <RecapitulatifPanel />
    </div>
  );
}
