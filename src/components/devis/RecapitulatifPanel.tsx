/**
 * Panel récapitulatif du devis (colonne de droite)
 * Affiche le résultat du calcul et les détails
 */

import { memo, useMemo, useState } from 'react';
import { Calculator, Loader2, Mail, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useDevisContext } from '@/contexts/DevisContext';
import { isDateComplete } from '@/services/devis';

// Type pour un bénéficiaire affiché
interface BeneficiaireDisplay {
  prenom: string;
  nom: string;
  qualite: string;
  age: number;
}

// Fonction pour formater les prix à la française
function formatPrixFR(prix: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(prix);
}

// Définition des garanties par option
const garantiesParOption: Record<number, Array<{ categorie: string; details: string }>> = {
  1: [
    { categorie: 'Hospitalisation', details: 'Chambre particulière : 40€/jour | Forfait journalier : 100%' },
    { categorie: 'Soins courants', details: 'Consultation : 100% BR | Analyses : 100% BR' },
    { categorie: 'Pharmacie', details: 'Médicaments : 100% BR' },
    { categorie: 'Optique', details: '100€/an | Monture + verres simples' },
    { categorie: 'Dentaire', details: 'Soins : 100% BR | Prothèses : 200%' },
  ],
  2: [
    { categorie: 'Hospitalisation', details: 'Chambre particulière : 60€/jour | Forfait journalier : 100%' },
    { categorie: 'Soins courants', details: 'Consultation : 150% BR | Analyses : 150% BR' },
    { categorie: 'Pharmacie', details: 'Médicaments : 100% BR' },
    { categorie: 'Optique', details: '150€/an | Monture + verres complexes' },
    { categorie: 'Dentaire', details: 'Soins : 150% BR | Prothèses : 300%' },
  ],
  3: [
    { categorie: 'Hospitalisation', details: 'Chambre particulière : 80€/jour | Forfait journalier : 100%' },
    { categorie: 'Soins courants', details: 'Consultation : 200% BR | Analyses : 200% BR' },
    { categorie: 'Pharmacie', details: 'Médicaments : 150% BR | Homéopathie : 50€/an' },
    { categorie: 'Optique', details: '200€/an | Monture + verres progressifs' },
    { categorie: 'Dentaire', details: 'Soins : 200% BR | Prothèses : 400% | Orthodontie : 300€/an' },
    { categorie: 'Médecines douces', details: '4 séances/an | 25€/séance' },
  ],
  4: [
    { categorie: 'Hospitalisation', details: 'Chambre particulière : 100€/jour | Forfait journalier : 100%' },
    { categorie: 'Soins courants', details: 'Consultation : 250% BR | Analyses : 250% BR' },
    { categorie: 'Pharmacie', details: 'Médicaments : 200% BR | Homéopathie : 75€/an' },
    { categorie: 'Optique', details: '300€/an | Monture + verres progressifs' },
    { categorie: 'Dentaire', details: 'Soins : 250% BR | Prothèses : 500% | Orthodontie : 400€/an' },
    { categorie: 'Médecines douces', details: '6 séances/an | 30€/séance' },
    { categorie: 'Prévention', details: 'Vaccins : 50€/an | Dépistage : 100€/an' },
  ],
  5: [
    { categorie: 'Hospitalisation', details: 'Chambre particulière : 120€/jour | Forfait journalier : 100%' },
    { categorie: 'Soins courants', details: 'Consultation : 300% BR | Analyses : 300% BR' },
    { categorie: 'Pharmacie', details: 'Médicaments : 250% BR | Homéopathie : 100€/an' },
    { categorie: 'Optique', details: '400€/an | Monture + verres progressifs premium' },
    { categorie: 'Dentaire', details: 'Soins : 300% BR | Prothèses : 600% | Orthodontie : 500€/an' },
    { categorie: 'Médecines douces', details: '8 séances/an | 35€/séance' },
    { categorie: 'Prévention', details: 'Vaccins : 75€/an | Dépistage : 150€/an' },
  ],
  6: [
    { categorie: 'Hospitalisation', details: 'Chambre particulière : 150€/jour | Forfait journalier : 100%' },
    { categorie: 'Soins courants', details: 'Consultation : 350% BR | Analyses : 350% BR' },
    { categorie: 'Pharmacie', details: 'Médicaments : 300% BR | Homéopathie : 150€/an' },
    { categorie: 'Optique', details: '500€/an | Monture + verres progressifs premium + options' },
    { categorie: 'Dentaire', details: 'Soins : 350% BR | Prothèses : 700% | Orthodontie : 600€/an | Implants : 500€/an' },
    { categorie: 'Médecines douces', details: '10 séances/an | 40€/séance' },
    { categorie: 'Prévention', details: 'Vaccins : 100€/an | Dépistage : 200€/an' },
    { categorie: 'Cure thermale', details: 'Forfait : 500€/an' },
  ],
};

function RecapitulatifPanel() {
  const { devis, isLoading, formData, hasConjoint } = useDevisContext();
  const [accordionGaranties, setAccordionGaranties] = useState<string | undefined>(undefined);

  const garanties = garantiesParOption[formData.option] || [];

  // Construire la liste des bénéficiaires avec leurs informations
  const beneficiaires = useMemo((): BeneficiaireDisplay[] => {
    if (!devis) return [];

    const result: BeneficiaireDisplay[] = [];

    // Assuré principal
    if (formData.assurePrenom && formData.assureNom) {
      const assureDetail = devis.details.find(d =>
        d.beneficiaire.includes('Assuré')
      );
      if (assureDetail) {
        result.push({
          prenom: formData.assurePrenom,
          nom: formData.assureNom,
          qualite: 'Assuré',
          age: assureDetail.age,
        });
      }
    }

    // Conjoint
    if (hasConjoint && formData.conjointPrenom && formData.conjointNom) {
      const conjointDetail = devis.details.find(d =>
        d.beneficiaire === 'Conjoint'
      );
      if (conjointDetail) {
        result.push({
          prenom: formData.conjointPrenom,
          nom: formData.conjointNom,
          qualite: 'Conjoint',
          age: conjointDetail.age,
        });
      }
    }

    // Enfants - Filtrer de la même manière que dans buildDevisInput
    // On ne garde que les enfants avec date de naissance complète
    const enfantsAvecDateComplete = formData.enfants.filter(e =>
      e.prenom && e.nom && isDateComplete(e.dateNaissance)
    );
    const enfantDetails = devis.details.filter(d => d.beneficiaire.startsWith('Enfant'));

    enfantsAvecDateComplete.forEach((enfant, index) => {
      if (enfantDetails[index]) {
        result.push({
          prenom: enfant.prenom,
          nom: enfant.nom,
          qualite: 'Enfant',
          age: enfantDetails[index].age,
        });
      }
    });

    return result;
  }, [devis, formData, hasConjoint]);

  // Ne rien afficher si pas de devis calculé
  if (!devis) {
    return null;
  }

  return (
    <>
      {/* Desktop : sticky à droite */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-20">
          <Card className="shadow-xl border-0 overflow-hidden">
            {/* Header avec gradient teal */}
            <CardHeader className="bg-gradient-to-r from-[#407b85] to-[#407b85]/80 text-white pb-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <h3 className="text-lg font-bold">Récapitulatif</h3>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Loading */}
              {isLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#407b85]" />
                  <p className="font-medium text-gray-900">Calcul en cours...</p>
                </div>
              )}

              {/* Résultat */}
              {!isLoading && (
                <div className="space-y-6">
                  {/* Tarif principal */}
                  <div className="bg-gradient-to-br from-[#407b85]/10 to-[#407b85]/5 rounded-xl p-6 text-center border border-[#407b85]/30">
                    <p className="text-sm text-gray-600 mb-2">Tarif mensuel</p>
                    <p className="text-4xl font-bold text-[#407b85]">
                      {formatPrixFR(devis.tarifMensuel)} €
                      <span className="text-base font-normal text-[#407b85]/70">/mois</span>
                    </p>
                  </div>

                  {/* Accordéons détails */}
                  <div className="space-y-3">
                    {/* Accordéon bénéficiaires */}
                    <Accordion
                      type="single"
                      collapsible
                      className="border rounded-lg"
                    >
                      <AccordionItem value="beneficiaires" className="border-0">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#407b85]" />
                            <span className="text-sm font-medium">
                              Bénéficiaires ({beneficiaires.length})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-2">
                            {beneficiaires.map((beneficiaire, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="font-medium text-sm text-[#407b85]">
                                    {beneficiaire.prenom} {beneficiaire.nom}
                                  </div>
                                  <span className="text-xs bg-[#407b85]/10 text-[#407b85] px-2 py-0.5 rounded-full font-medium">
                                    {beneficiaire.qualite}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {beneficiaire.age} ans
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Accordéon garanties */}
                    <Accordion
                      type="single"
                      collapsible
                      value={accordionGaranties}
                      onValueChange={setAccordionGaranties}
                      className="border rounded-lg"
                    >
                      <AccordionItem value="garanties" className="border-0">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <span className="text-sm font-medium">Détail des garanties principales</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-2">
                            {garanties.map((garantie, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                              >
                                <div className="font-medium text-sm text-[#407b85] mb-1">
                                  {garantie.categorie}
                                </div>
                                <div className="text-xs text-gray-600 leading-relaxed">
                                  {garantie.details}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Bouton d'envoi */}
                  <Button className="w-full bg-[#407b85] hover:bg-[#407b85]/90">
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer le devis par email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile : sticky en bas de l'écran - Version condensée */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <Card className="shadow-2xl border-0 rounded-t-xl rounded-b-none overflow-hidden">
          {/* Header avec gradient teal - Version compacte */}
          <div className="bg-gradient-to-r from-[#407b85] to-[#407b85]/80 px-4 py-2.5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <h3 className="text-sm font-bold">Résultat</h3>
              </div>
              {!isLoading && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  ✓
                </span>
              )}
            </div>
          </div>

          <CardContent className="pt-3 pb-3 px-4">
            {/* Loading */}
            {isLoading && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-[#407b85]" />
                <p className="font-medium text-gray-900 text-xs">Calcul...</p>
              </div>
            )}

            {/* Résultat */}
            {!isLoading && (
                <div className="space-y-2">
                  {/* Tarif principal - Version ultra compacte */}
                  <div className="bg-gradient-to-br from-[#407b85]/10 to-[#407b85]/5 rounded-lg p-2.5 text-center border border-[#407b85]/30">
                    <p className="text-2xl font-bold text-[#407b85] leading-none">
                      {formatPrixFR(devis.tarifMensuel)} €
                      <span className="text-xs font-normal text-[#407b85]/70">/mois</span>
                    </p>
                  </div>

                  {/* Infos condensées */}
                  <div className="flex items-center justify-center text-xs">
                    <span className="text-gray-600">{devis.details.length} bénéficiaire{devis.details.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </>
  );
}

export default memo(RecapitulatifPanel);
