/**
 * Compute the inclusive [from, to] range for a Supabase .range() call.
 *
 * @param page    1-based page number
 * @param perPage Number of items per page
 * @returns { from, to } — both are inclusive, matching Supabase's range() API
 */
export function paginationRange(page: number, perPage: number): { from: number; to: number } {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  return { from, to };
}
