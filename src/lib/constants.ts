export const VISITOR_COOKIE = "pb_vid";
export const PASS_STORAGE_KEY = "pb_pass";
export const NAME_STORAGE_KEY = "pb_name";
export const OPEN_DRAFT_KEY = "pb_open_draft";
export const SESSION_DRAFT_KEY = "pb_draft_session";

export function draftStorageKey(id: string) {
  return `pb_draft_${id}`;
}
