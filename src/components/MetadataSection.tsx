import { FALLBACK_TEXT, formatDateTime } from "../lib/format";
import type { ChartData, Currency, Network, Overview, Sentiment } from "../types/dashboard";
import Card from "./ui/Card";
import MetaText from "./ui/content/MetaText";
import SectionHeader from "./ui/layout/SectionHeader";
import Stack from "./ui/layout/Stack";

type MetadataSectionProps = {
  chart: ChartData | null;
  currency: Currency;
  network: Network | null;
  overview: Overview | null;
  sentiment: Sentiment | null;
};

export default function MetadataSection({
  chart,
  currency,
  network,
  overview,
  sentiment,
}: MetadataSectionProps) {
  return (
    <Card as="section" tone="muted" gap="lg">
      <SectionHeader
        eyebrow="Quellen und Zeitstempel"
        title="Nachvollziehbarkeit"
        titleAs="h3"
        titleSize="md"
        description={`Aktive Wahrung: ${currency.toUpperCase()}. Diese Angaben stuetzen Vertrauen und Datenherkunft, bleiben aber bewusst im Fussbereich der Seite.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stack gap="xs">
          <MetaText size="xs">Market source</MetaText>
          <p className="text-sm text-fg-secondary">{overview?.source ?? FALLBACK_TEXT}</p>
        </Stack>
        <Stack gap="xs">
          <MetaText size="xs">Network source</MetaText>
          <p className="text-sm text-fg-secondary">{network?.source ?? FALLBACK_TEXT}</p>
        </Stack>
        <Stack gap="xs">
          <MetaText size="xs">Sentiment source</MetaText>
          <p className="text-sm text-fg-secondary">{sentiment?.source ?? FALLBACK_TEXT}</p>
        </Stack>
        <Stack gap="xs">
          <MetaText size="xs">Chart source</MetaText>
          <p className="text-sm text-fg-secondary">{chart?.source ?? FALLBACK_TEXT}</p>
        </Stack>
        <Stack gap="xs">
          <MetaText size="xs">CoinGecko lastUpdatedAt</MetaText>
          <p className="text-sm text-fg-secondary">
            {formatDateTime(overview?.lastUpdatedAt ?? null)}
          </p>
        </Stack>
        <Stack gap="xs">
          <MetaText size="xs">Network fetchedAt</MetaText>
          <p className="text-sm text-fg-secondary">
            {formatDateTime(network?.fetchedAt ?? null)}
          </p>
        </Stack>
        <Stack gap="xs">
          <MetaText size="xs">Sentiment fetchedAt</MetaText>
          <p className="text-sm text-fg-secondary">
            {formatDateTime(sentiment?.fetchedAt ?? null)}
          </p>
        </Stack>
        <Stack gap="xs">
          <MetaText size="xs">Chart fetchedAt</MetaText>
          <p className="text-sm text-fg-secondary">
            {formatDateTime(chart?.fetchedAt ?? null)}
          </p>
        </Stack>
      </div>
    </Card>
  );
}
