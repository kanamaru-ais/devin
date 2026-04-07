export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return dateStr.split("T")[0];
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.endsWith("Z") ? "" : "Z"));
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
