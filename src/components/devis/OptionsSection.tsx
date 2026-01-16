/**
 * Section Options de couverture
 * Slider option, Surcomplémentaire, Renfort Hospi
 */

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useDevisContext } from '@/contexts/DevisContext';
import type { Option } from '@/services/tarificateur';

function OptionsSection() {
  const { formData, updateField, setFormData } = useDevisContext();

  const optionLabels: Record<number, string> = {
    1: 'Économique',
    2: 'Essentiel',
    3: 'Confort',
    4: 'Étendu',
    5: 'Premium',
    6: 'Excellence',
  };

  return (
    <div className="space-y-6 border-t pt-6">
      <h3 className="font-semibold text-lg text-gray-900">Options de couverture</h3>

      {/* Slider d'option */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 font-medium">Niveau de couverture</Label>
          <span className="text-lg font-bold text-[#407b85]">
            Option {formData.option} - {optionLabels[formData.option]}
          </span>
        </div>
        <Slider
          value={[formData.option]}
          onValueChange={([value]) => {
            setFormData(prev => ({
              ...prev,
              option: value as Option,
              // Auto-décocher surcomplémentaire si option < 3
              surcomplementaire: value < 3 ? false : prev.surcomplementaire,
            }));
          }}
          min={1}
          max={6}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Économique</span>
          <span>Excellence</span>
        </div>
      </div>

      {/* Surcomplémentaire */}
      {formData.option >= 3 && (
        <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <Checkbox
            id="surcomplementaire"
            checked={formData.surcomplementaire}
            onCheckedChange={(checked) =>
              updateField('surcomplementaire', checked === true)
            }
          />
          <Label
            htmlFor="surcomplementaire"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Ajouter la surcomplémentaire (options 3 à 6)
          </Label>
        </div>
      )}

      {/* Renfort Hospi (SENIORS_PLUS uniquement) */}
      {formData.gamme === 'SANTE_SENIORS_PLUS' && (
        <div className="flex items-center space-x-2 bg-green-50 rounded-lg p-3 border border-green-200">
          <Checkbox
            id="renfortHospi"
            checked={formData.renfortHospi}
            onCheckedChange={(checked) =>
              updateField('renfortHospi', checked === true)
            }
          />
          <Label
            htmlFor="renfortHospi"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Renfort Hospitalisation (Séniors Plus)
          </Label>
        </div>
      )}
    </div>
  );
}

export default memo(OptionsSection);
