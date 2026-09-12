/** The tooltip's DOM node, written directly by pointermove at 60fps-ish rates — kept
 * out of the store entirely so cursor tracking never touches React. */
export const tooltipNodeRef: { current: HTMLDivElement | null } = { current: null };

export function positionTooltip(x: number, y: number): void {
  const node = tooltipNodeRef.current;
  if (!node) return;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
}
