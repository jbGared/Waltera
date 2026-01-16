/**
 * Section Assuré Principal
 * Prénom, Nom, Date de naissance, Email, Assuré seul (TNS)
 */

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useDevisContext } from '@/contexts/DevisContext';

function AssurePrincipalSection() {
  const { formData, updateField, hasConjoint } = useDevisContext();

  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="font-semibold text-lg text-gray-900">Assuré principal</h3>

      {/* Prénom et Nom de l'assuré */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="assurePrenom" className="text-gray-700 font-medium">
            Prénom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="assurePrenom"
            type="text"
            value={formData.assurePrenom}
            onChange={(e) => updateField('assurePrenom', e.target.value)}
            placeholder="Prénom"
            className="border-gray-300"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assureNom" className="text-gray-700 font-medium">
            Nom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="assureNom"
            type="text"
            value={formData.assureNom}
            onChange={(e) => updateField('assureNom', e.target.value)}
            placeholder="Nom"
            className="border-gray-300"
          />
        </div>
      </div>

      {/* Date de naissance et Email */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="assureNaissance" className="text-gray-700 font-medium">
            Date de naissance <span className="text-red-500">*</span>
          </Label>
          <Input
            id="assureNaissance"
            type="date"
            value={formData.assureNaissance}
            onChange={(e) => updateField('assureNaissance', e.target.value)}
            className="border-gray-300"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assureEmail" className="text-gray-700 font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="assureEmail"
            type="email"
            value={formData.assureEmail}
            onChange={(e) => updateField('assureEmail', e.target.value)}
            placeholder="email@exemple.fr"
            className="border-gray-300"
          />
        </div>
      </div>

      {/* Assuré seul (TNS uniquement) */}
      {formData.gamme === 'TNS_FORMULES' && (
        <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <Checkbox
            id="assureSeul"
            checked={formData.assureSeul}
            onCheckedChange={(checked) =>
              updateField('assureSeul', checked === true)
            }
            disabled={hasConjoint || formData.enfants.length > 0}
          />
          <Label
            htmlFor="assureSeul"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Assuré seul (sans conjoint ni enfants)
          </Label>
        </div>
      )}
    </div>
  );
}

export default memo(AssurePrincipalSection);
