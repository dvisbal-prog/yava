import { ChipTabs } from "@/components/ui/tabs";
import { RANGE_LABEL, type RangeKey } from "@/lib/overview";
import { buildQuery, type SearchParams } from "@/lib/utils";

export function RangeChips({ active, searchParams, basePath = "" }: { active: RangeKey; searchParams: SearchParams; basePath?: string }) {
  const keys: RangeKey[] = ["hoy", "7d", "30d"];
  return (
    <ChipTabs
      active={active}
      items={keys.map((k) => ({ key: k, label: RANGE_LABEL[k], href: `${basePath}${buildQuery(searchParams, { range: k === "hoy" ? null : k, from: null, to: null, page: null })}` }))}
    />
  );
}
