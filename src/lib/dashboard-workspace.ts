export const DASHBOARD_SECTION_IDS = [
  "overview",
  "performance",
  "market",
  "cycle",
  "network",
  "onchain",
  "sources",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

const dashboardSectionIdSet = new Set<string>(DASHBOARD_SECTION_IDS);

export function isDashboardSectionId(
  value: string | null | undefined
): value is DashboardSectionId {
  return typeof value === "string" && dashboardSectionIdSet.has(value);
}

export function getDashboardSectionId(value: string | null | undefined): DashboardSectionId {
  return isDashboardSectionId(value) ? value : "overview";
}
