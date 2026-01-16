import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, Download, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface CCNReferentiel {
  idcc: string;
  label: string;
  kalicont_id: string | null;
  active: boolean | null;
}

interface CCNSelectorProps {
  importedIDCCs: string[]; // Liste des IDCC déjà importés
  onImport: (idcc: string, titre: string) => void;
}

export default function CCNSelector({ importedIDCCs, onImport }: CCNSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCCN, setSelectedCCN] = useState<CCNReferentiel | null>(null);
  const [ccnList, setCcnList] = useState<CCNReferentiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchCCNReferentiel();
  }, []);

  async function fetchCCNReferentiel() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('idcc_ref')
        .select('idcc, label, kalicont_id, active')
        .eq('active', true)
        .order('idcc');

      if (error) {
        console.error('Erreur Supabase:', error);
        return;
      }

      setCcnList((data as CCNReferentiel[]) || []);
    } catch (err) {
      console.error('Erreur lors de la récupération du référentiel CCN:', err);
    } finally {
      setLoading(false);
    }
  }

  function isImported(idcc: string): boolean {
    return importedIDCCs.includes(idcc);
  }

  function handleSelect(ccn: CCNReferentiel) {
    setSelectedCCN(ccn);
    setOpen(false);
  }

  async function handleImport() {
    if (!selectedCCN) return;

    setImporting(true);
    try {
      // Appeler la fonction d'import fournie par le parent
      await onImport(selectedCCN.idcc, selectedCCN.label);

      // Réinitialiser la sélection après l'import
      setSelectedCCN(null);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
      {/* Combobox de sélection */}
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner une convention collective
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto min-h-[40px] py-2"
              disabled={loading}
            >
              {selectedCCN ? (
                <div className="flex items-center gap-2 flex-1 text-left">
                  <span className="font-mono text-[#407b85] font-semibold">
                    {selectedCCN.idcc}
                  </span>
                  <span className="text-gray-700 truncate">
                    {selectedCCN.label}
                  </span>
                  {isImported(selectedCCN.idcc) && (
                    <Badge variant="default" className="bg-green-500 ml-auto">
                      Déjà importée
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-gray-500">
                  {loading ? 'Chargement...' : 'Rechercher par IDCC ou titre...'}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Rechercher par IDCC ou titre..."
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>Aucune convention collective trouvée</p>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {ccnList.map((ccn) => {
                    const imported = isImported(ccn.idcc);

                    return (
                      <CommandItem
                        key={ccn.idcc}
                        value={`${ccn.idcc} ${ccn.label}`}
                        onSelect={() => handleSelect(ccn)}
                        className="flex items-center gap-2 py-3"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedCCN?.idcc === ccn.idcc ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex-1 flex items-center gap-3">
                          <span className="font-mono text-sm font-semibold text-[#407b85] min-w-[60px]">
                            {ccn.idcc}
                          </span>
                          <span className="text-sm text-gray-700 flex-1">
                            {ccn.label}
                          </span>
                          {imported && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Informations sur la CCN sélectionnée */}
        {selectedCCN && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedCCN.kalicont_id && (
              <p>KALICONT ID : {selectedCCN.kalicont_id}</p>
            )}
            {isImported(selectedCCN.idcc) && (
              <p className="text-green-600 font-medium">
                ✓ Cette convention collective est déjà dans votre base
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bouton d'import */}
      <div>
        <Button
          onClick={handleImport}
          disabled={!selectedCCN || importing || (selectedCCN && isImported(selectedCCN.idcc))}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white min-w-[150px]"
        >
          {importing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Import en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Importer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
