import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddressFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    id: string;
    name: string;
    postcode: string;
    citycode: string;
    x: number;
    y: number;
    city: string;
    context: string;
    type: string;
    importance: number;
    street?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, postalCode: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  label = "Adresse du client",
  placeholder = "Tapez l'adresse...",
  required = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fermer les suggestions si clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rechercher les adresses via l'API data.gouv.fr
  useEffect(() => {
    const searchAddress = async () => {
      if (inputValue.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Ne pas rechercher si c'est une adresse complète déjà sélectionnée
      if (inputValue === value && value.length > 10) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(inputValue)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erreur lors de la recherche d\'adresse:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchAddress, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  const handleSelectAddress = (feature: AddressFeature) => {
    const address = feature.properties.label;
    const postalCode = feature.properties.postcode;

    // Mettre à jour l'input
    setInputValue(address);

    // Fermer immédiatement le dropdown
    setShowSuggestions(false);
    setSuggestions([]);

    // Remonter l'adresse et le code postal au parent
    onChange(address, postalCode);
  };

  return (
    <div ref={wrapperRef} className="space-y-2 relative">
      <Label htmlFor="address" className="text-gray-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          id="address"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 border-gray-300"
          autoComplete="off"
          required={required}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#407b85] animate-spin" />
        )}
      </div>

      {/* Liste de suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
          {suggestions.map((feature, index) => (
            <button
              key={feature.properties.id || index}
              type="button"
              onClick={() => handleSelectAddress(feature)}
              className="w-full text-left px-4 py-3 hover:bg-[#407b85]/5 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-[#407b85]/10"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-[#407b85] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {feature.properties.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {feature.properties.context}
                  </p>
                  <p className="text-xs font-medium text-[#407b85] mt-1">
                    {feature.properties.postcode} {feature.properties.city}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Message si pas de résultats */}
      {showSuggestions && !isLoading && inputValue.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4 text-center">
          <p className="text-sm text-gray-500">Aucune adresse trouvée</p>
          <p className="text-xs text-gray-400 mt-1">Essayez de préciser votre recherche</p>
        </div>
      )}
    </div>
  );
}
