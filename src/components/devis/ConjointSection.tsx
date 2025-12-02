/**
 * Section Conjoint
 * Checkbox + informations du conjoint si coché
 */

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useDevisContext } from '@/contexts/DevisContext';

interface ConjointSectionProps {
  hasConjoint: boolean;
  setHasConjoint: (value: boolean) => void;
}

function ConjointSection({ hasConjoint, setHasConjoint }: ConjointSectionProps) {
  const { formData, updateField } = useDevisContext();

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-900">Conjoint</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasConjoint"
            checked={hasConjoint}
            onCheckedChange={(checked) => setHasConjoint(checked === true)}
          />
          <Label
            htmlFor="hasConjoint"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Ajouter un conjoint
          </Label>
        </div>
      </div>

      {hasConjoint && (
        <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
          {/* Prénom et Nom du conjoint */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="conjointPrenom" className="text-gray-700 font-medium">
                Prénom
              </Label>
              <Input
                id="conjointPrenom"
                type="text"
                value={formData.conjointPrenom}
                onChange={(e) => updateField('conjointPrenom', e.target.value)}
                placeholder="Prénom"
                className="border-gray-300 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conjointNom" className="text-gray-700 font-medium">
                Nom
              </Label>
              <Input
                id="conjointNom"
                type="text"
                value={formData.conjointNom}
                onChange={(e) => updateField('conjointNom', e.target.value)}
                placeholder="Nom"
                className="border-gray-300 bg-white"
              />
            </div>
          </div>

          {/* Date de naissance du conjoint */}
          <div className="space-y-2">
            <Label htmlFor="conjointNaissance" className="text-gray-700 font-medium">
              Date de naissance
            </Label>
            <Input
              id="conjointNaissance"
              type="date"
              value={formData.conjointNaissance}
              onChange={(e) => updateField('conjointNaissance', e.target.value)}
              className="border-gray-300 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ConjointSection);
