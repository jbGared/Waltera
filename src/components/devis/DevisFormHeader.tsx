/**
 * Section des informations générales du devis
 * Produit, Adresse, Date d'effet, Commission
 */

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useDevisContext } from '@/contexts/DevisContext';
import type { Gamme, Commission } from '@/services/tarificateur';

interface DevisFormHeaderProps {
  onAddressChange: (address: string, postalCode: string) => void;
}

function DevisFormHeader({ onAddressChange }: DevisFormHeaderProps) {
  const { formData, updateField } = useDevisContext();

  return (
    <div className="space-y-4">
      {/* Sélectionner un produit */}
      <div className="space-y-2">
        <Label htmlFor="gamme" className="text-gray-700 font-medium">
          Sélectionner un produit <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.gamme || undefined}
          onValueChange={(value: Gamme) => updateField('gamme', value)}
        >
          <SelectTrigger id="gamme" className="border-gray-300">
            <SelectValue placeholder="Sélectionnez un produit..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SANTE_SENIORS">Santé Seniors</SelectItem>
            <SelectItem value="SANTE_SENIORS_PLUS">Santé Seniors Plus</SelectItem>
            <SelectItem value="TNS_FORMULES">TNS Formules</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Adresse avec autocomplete */}
      <AddressAutocomplete
        value={formData.adresseComplete}
        onChange={onAddressChange}
        label="Adresse du client"
        placeholder="Commencez à taper l'adresse..."
        required
      />

      {/* Code postal (en lecture seule, rempli par l'autocomplete) */}
      {formData.codePostal && formData.codePostal.length === 5 && (
        <div className="bg-[#407b85]/10 rounded-lg p-3 border border-[#407b85]/30">
          <p className="text-xs text-[#407b85] mb-1 font-medium">Code postal détecté</p>
          <p className="text-sm font-semibold text-[#407b85]">{formData.codePostal}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date d'effet */}
        <div className="space-y-2">
          <Label htmlFor="dateEffet" className="text-gray-700 font-medium">Date d'Effet</Label>
          <Input
            id="dateEffet"
            type="date"
            value={formData.dateEffet}
            onChange={(e) => updateField('dateEffet', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="border-gray-300"
          />
        </div>

        {/* Commission */}
        <div className="space-y-2">
          <Label htmlFor="commission" className="text-gray-700 font-medium">Commission</Label>
          <Select
            value={formData.commission.toString()}
            onValueChange={(value) => updateField('commission', parseInt(value) as Commission)}
          >
            <SelectTrigger id="commission" className="border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="15">15%</SelectItem>
              <SelectItem value="20">20%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default memo(DevisFormHeader);
