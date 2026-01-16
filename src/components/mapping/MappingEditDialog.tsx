import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { NasMapping, IdccOption } from '@/types/mapping';

interface MappingEditDialogProps {
  open: boolean;
  mapping: NasMapping | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MappingEditDialog({
  open,
  mapping,
  onClose,
  onSuccess,
}: MappingEditDialogProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    category: 'Clients',
    status: 'pending',
    notes: '',
  });
  const [selectedIdcc, setSelectedIdcc] = useState<string[]>([]);
  const [idccInput, setIdccInput] = useState('');
  const [idccOptions, setIdccOptions] = useState<IdccOption[]>([]);
  const [idccSuggestions, setIdccSuggestions] = useState<IdccOption[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIdccOptions();
  }, []);

  useEffect(() => {
    if (mapping) {
      setFormData({
        clientName: mapping.client_name || '',
        category: mapping.category || 'Clients',
        status: mapping.status || 'pending',
        notes: mapping.notes || '',
      });
      setSelectedIdcc(mapping.idcc || []);
    } else {
      // Reset form
      setFormData({
        clientName: '',
        category: 'Clients',
        status: 'pending',
        notes: '',
      });
      setSelectedIdcc([]);
    }
  }, [mapping]);

  async function fetchIdccOptions() {
    try {
      const { data, error } = await (supabase as any)
        .from('idcc_ref')
        .select('idcc, label')
        .eq('active', true)
        .order('idcc');

      if (error) {
        console.error('Erreur lors de la récupération des IDCC:', error);
        return;
      }

      setIdccOptions(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  }

  function handleIdccInputChange(value: string) {
    setIdccInput(value);

    if (value.length > 0) {
      const filtered = idccOptions.filter(
        (option) =>
          option.idcc.includes(value) ||
          option.label.toLowerCase().includes(value.toLowerCase())
      );
      setIdccSuggestions(filtered.slice(0, 5));
    } else {
      setIdccSuggestions([]);
    }
  }

  function addIdcc(idcc: string) {
    if (!selectedIdcc.includes(idcc)) {
      setSelectedIdcc([...selectedIdcc, idcc]);
    }
    setIdccInput('');
    setIdccSuggestions([]);
  }

  function removeIdcc(idcc: string) {
    setSelectedIdcc(selectedIdcc.filter((i) => i !== idcc));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!mapping) return;

    setSaving(true);
    try {
      const updateData = {
        client_name: formData.clientName || null,
        idcc: selectedIdcc.length > 0 ? selectedIdcc : null,
        category: formData.category,
        status: formData.status,
        notes: formData.notes || null,
      };

      const { error } = await (supabase as any)
        .from('nas_client_mapping')
        .update(updateData)
        .eq('id', mapping.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Mapping mis à jour',
        description: `Le mapping pour "${mapping.folder_name}" a été mis à jour avec succès.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour du mapping.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!mapping) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Éditer le mapping</DialogTitle>
          <DialogDescription>
            Associer le dossier <strong>{mapping.folder_name}</strong> à un client et ses IDCC
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nom du dossier (lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dossier NAS
            </label>
            <Input
              value={mapping.folder_name}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Nom du client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du client
            </label>
            <Input
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              placeholder="Ex: ACME Corporation"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clients">Clients</SelectItem>
                <SelectItem value="Prospects">Prospects</SelectItem>
                <SelectItem value="Partenaires">Partenaires</SelectItem>
                <SelectItem value="Résiliations">Résiliations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* IDCC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Codes IDCC
            </label>

            {/* IDCC sélectionnés */}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedIdcc.map((idcc) => {
                const option = idccOptions.find((o) => o.idcc === idcc);
                return (
                  <Badge key={idcc} variant="secondary" className="gap-1">
                    <span className="font-mono">{idcc}</span>
                    {option && <span className="text-xs">- {option.label}</span>}
                    <button
                      type="button"
                      onClick={() => removeIdcc(idcc)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>

            {/* Input pour ajouter des IDCC */}
            <div className="relative">
              <Input
                value={idccInput}
                onChange={(e) => handleIdccInputChange(e.target.value)}
                placeholder="Rechercher un IDCC par code ou nom..."
              />

              {/* Suggestions */}
              {idccSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {idccSuggestions.map((option) => (
                    <button
                      key={option.idcc}
                      type="button"
                      onClick={() => addIdcc(option.idcc)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span className="font-mono text-sm font-semibold text-[#407b85]">
                        {option.idcc}
                      </span>
                      <span className="text-sm text-gray-600">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="mapped">Mappé</SelectItem>
                <SelectItem value="ignored">Ignoré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notes optionnelles..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#407b85] to-[#407b85]/80"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
