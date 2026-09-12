/** BFS over the room adjacency graph. Returns the hop sequence excluding `from` and
 * including `to`, or null if unreachable. */
export function findPath(
  adjacency: Record<string, string[]>,
  from: string,
  to: string,
): string[] | null {
  const prev: Record<string, string | null> = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const n = queue.shift()!;
    if (n === to) break;
    for (const m of adjacency[n] ?? []) {
      if (!(m in prev)) {
        prev[m] = n;
        queue.push(m);
      }
    }
  }
  if (!(to in prev)) return null;
  const out: string[] = [];
  let c = to;
  while (c !== from) {
    out.unshift(c);
    c = prev[c]!;
  }
  return out;
}
