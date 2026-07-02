export function formatCount(value: number, label: string) {
  return `${value.toLocaleString()} ${label}${value === 1 ? "" : "s"}`;
}
