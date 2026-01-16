import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download, Globe } from 'lucide-react';
import type { CcnAvailable } from '@/services/ccnService';

interface CcnAvailableListProps {
  availableCcn: CcnAvailable[];
  selectedIdcc: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSelection: (idcc: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function CcnAvailableList({
  availableCcn,
  selectedIdcc,
  searchQuery,
  onSearchChange,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
}: CcnAvailableListProps) {
  const filteredCcn = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return availableCcn.filter(
      (ccn) =>
        ccn.idcc.toLowerCase().includes(query) ||
        ccn.label.toLowerCase().includes(query)
    );
  }, [availableCcn, searchQuery]);

  const allSelected = useMemo(() => {
    if (filteredCcn.length === 0) return false;
    return filteredCcn.every((ccn) => selectedIdcc.includes(ccn.idcc));
  }, [filteredCcn, selectedIdcc]);

  const handleSelectAll = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <Card className="hover-lift shadow-md hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Globe className="h-5 w-5 text-blue-600" />
            CCN Disponibles
            <Badge variant="outline" className="ml-2">
              {filteredCcn.length}
            </Badge>
          </CardTitle>
          {selectedIdcc.length > 0 && (
            <Badge className="bg-blue-600">
              {selectedIdcc.length} sélectionnée{selectedIdcc.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par IDCC ou titre..."
            className="pl-9"
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={filteredCcn.length === 0}
          >
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
          {selectedIdcc.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Effacer ({selectedIdcc.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {filteredCcn.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {searchQuery
                  ? 'Aucune CCN disponible avec ces critères'
                  : 'Toutes les CCN disponibles ont été importées !'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Tout sélectionner"
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">IDCC</TableHead>
                  <TableHead>Titre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCcn.map((ccn) => {
                  const isSelected = selectedIdcc.includes(ccn.idcc);
                  return (
                    <TableRow
                      key={ccn.idcc}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => onToggleSelection(ccn.idcc)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelection(ccn.idcc)}
                          aria-label={`Sélectionner ${ccn.idcc}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="font-mono text-blue-600 font-semibold">
                          {ccn.idcc}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" title={ccn.label}>
                          {ccn.label}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              <strong>{filteredCcn.length}</strong> CCN disponible
              {filteredCcn.length > 1 ? 's' : ''}
            </span>
            {selectedIdcc.length > 0 && (
              <span className="text-blue-600 font-medium flex items-center gap-1">
                <Download className="h-4 w-4" />
                Sélectionnez et importez
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
