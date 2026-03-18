import type { AsyncDataState } from "../lib/data-state";
import { getDashboardSectionStateMessages } from "../lib/dashboard-state-copy";
import { FALLBACK_TEXT, formatDateTime } from "../lib/format";
import type { ChartData, Currency, Network, Overview, Sentiment } from "../types/dashboard";
import Card from "./ui/Card";
import DataState from "./ui/data-state/DataState";
import DataStateMeta from "./ui/data-state/DataStateMeta";
import MetaText from "./ui/content/MetaText";
import SectionHeader from "./ui/layout/SectionHeader";
import Stack from "./ui/layout/Stack";

type MetadataSectionProps = {
  chart: ChartData | null;
  currency: Currency;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  network: Network | null;
  onRetry: () => void;
  overview: Overview | null;
  sentiment: Sentiment | null;
};

type MetadataItemProps = {
  label: string;
  value: string;
};

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <Stack gap="xs">
      <MetaText size="xs">{label}</MetaText>
      <p className="text-sm text-fg-secondary">{value}</p>
    </Stack>
  );
}

function getMetadataValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : FALLBACK_TEXT;
}

export default function MetadataSection({
  chart,
  currency,
  dashboardState,
  network,
  onRetry,
  overview,
  sentiment,
}: MetadataSectionProps) {
  const stateMessages = getDashboardSectionStateMessages("metadata", dashboardState.error);

  return (
    <Card as="section" tone="muted" gap="lg">
      <SectionHeader
        eyebrow="Quellen und Zeitstempel"
        title="Quellen und Aktualisierung"
        titleAs="h3"
        titleSize="md"
        description={`Aktive Währung: ${currency.toUpperCase()}. Kompakt, damit Quelle und letzter Stand schnell sichtbar bleiben.`}
        meta={<DataStateMeta lastUpdatedLabel="Zuletzt erneuert" state={dashboardState} />}
      />

      <DataState
        state={dashboardState}
        onRetry={onRetry}
        retryBusy={dashboardState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetadataItem label="Quelle Marktdaten" value={getMetadataValue(overview?.source)} />
          <MetadataItem label="Quelle Netzwerk" value={getMetadataValue(network?.source)} />
          <MetadataItem label="Quelle Sentiment" value={getMetadataValue(sentiment?.source)} />
          <MetadataItem label="Quelle Chart" value={getMetadataValue(chart?.source)} />
          <MetadataItem
            label="Letzte Anbieter-Aktualisierung Markt"
            value={formatDateTime(overview?.lastUpdatedAt ?? null)}
          />
          <MetadataItem
            label="Letzte Aktualisierung Netzwerk"
            value={formatDateTime(network?.fetchedAt ?? null)}
          />
          <MetadataItem
            label="Letzte Aktualisierung Sentiment"
            value={formatDateTime(sentiment?.fetchedAt ?? null)}
          />
          <MetadataItem
            label="Letzte Aktualisierung Chart"
            value={formatDateTime(chart?.fetchedAt ?? null)}
          />
        </div>
      </DataState>
    </Card>
  );
}
