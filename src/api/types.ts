export interface VisitorRecord {
  id: string;
  name: string;
  enteredAt: string;
}

export type CreateVisitorResponse = VisitorRecord;

export interface GuestbookResponse {
  entries: VisitorRecord[];
  total: number;
  nextCursor: string | null;
}
