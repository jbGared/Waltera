/**
 * Section Enfants
 * Liste dynamique avec ajout/suppression
 */

import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDevisContext } from '@/contexts/DevisContext';

function EnfantsSection() {
  const { formData, addEnfant, removeEnfant, updateEnfant } = useDevisContext();

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-900">Enfants</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEnfant}
          className="text-[#407b85] border-[#407b85] hover:bg-[#407b85] hover:text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter un enfant
        </Button>
      </div>

      {formData.enfants.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Aucun enfant ajouté</p>
      ) : (
        <div className="space-y-3">
          {formData.enfants.map((enfant, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Enfant {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEnfant(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`enfant-prenom-${index}`} className="text-gray-700 font-medium text-sm">
                    Prénom
                  </Label>
                  <Input
                    id={`enfant-prenom-${index}`}
                    type="text"
                    value={enfant.prenom}
                    onChange={(e) => updateEnfant(index, 'prenom', e.target.value)}
                    placeholder="Prénom"
                    className="border-gray-300 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`enfant-nom-${index}`} className="text-gray-700 font-medium text-sm">
                    Nom
                  </Label>
                  <Input
                    id={`enfant-nom-${index}`}
                    type="text"
                    value={enfant.nom}
                    onChange={(e) => updateEnfant(index, 'nom', e.target.value)}
                    placeholder="Nom"
                    className="border-gray-300 bg-white"
                  />
                </div>
              </div>

              {/* Date de naissance */}
              <div className="space-y-2">
                <Label htmlFor={`enfant-date-${index}`} className="text-gray-700 font-medium text-sm">
                  Date de naissance
                </Label>
                <Input
                  id={`enfant-date-${index}`}
                  type="date"
                  value={enfant.dateNaissance}
                  onChange={(e) => updateEnfant(index, 'dateNaissance', e.target.value)}
                  className="border-gray-300 bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(EnfantsSection);
