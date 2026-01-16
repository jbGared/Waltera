export interface NasMapping {
  id: string;
  folder_name: string;
  client_name: string | null;
  client_id: string | null;
  idcc: string[] | null;
  category: 'Clients' | 'Prospects' | 'Partenaires' | 'Résiliations' | null;
  status: 'pending' | 'mapped' | 'ignored';
  notes: string | null;
  created_at: string;
  updated_at: string;
  mapped_at: string | null;
  mapped_by: string | null;
}

export interface IdccOption {
  idcc: string;
  label: string;
  active?: boolean;
}

export type StatusFilter = 'all' | 'pending' | 'mapped' | 'ignored';
export type CategoryType = 'Clients' | 'Prospects' | 'Partenaires' | 'Résiliations';
export type StatusType = 'pending' | 'mapped' | 'ignored';
