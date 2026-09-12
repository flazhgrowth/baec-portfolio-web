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
