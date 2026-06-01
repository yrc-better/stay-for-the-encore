export const DEFAULT_BAND_NAME = "未命名乐队";

export function normalizeBandName(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : DEFAULT_BAND_NAME;
}
