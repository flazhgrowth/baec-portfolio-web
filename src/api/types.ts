export interface VisitorRecord {
  /** Not always present on GET /guests entries — see docs/api-contract.md. */
  id?: number;
  name: string;
  visited_at: string;
}

export type CreateVisitorResponse = VisitorRecord;

export interface GuestbookResponse {
  guests: VisitorRecord[];
  pagination: {
    total: number;
    cursor: string | null;
  };
}

export interface NoteRecord {
  /** Not always present — see docs/api-contract.md's GET /notes note. */
  id?: number;
  name: string;
  note: string;
  left_at: string;
}

export interface NotesResponse {
  notes: NoteRecord[];
  pagination: {
    total: number;
    cursor: string | null;
  };
}

export interface NotesSummaryResponse {
  art_keys: string[];
}
