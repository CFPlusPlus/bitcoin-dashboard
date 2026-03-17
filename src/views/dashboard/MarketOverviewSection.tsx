import AsyncContent from "../../components/AsyncContent";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import MetaText from "../../components/ui/content/MetaText";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";
import { formatCurrency, formatPercent } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";

type MarketOverviewSectionProps = {
  currency: Currency;
  overview: Overview | null;
  overviewError: string;
  overviewLoading: boolean;
  showOverviewSkeleton: boolean;
  onRetry: () => void;
};

export default function MarketOverviewSection({
  currency,
  overview,
  overviewError,
  overviewLoading,
  showOverviewSkeleton,
  onRetry,
}: MarketOverviewSectionProps) {
  if (!overview) {
    return (
      <AsyncContent
        error={overviewError}
        hasContent={false}
        loading={showOverviewSkeleton || overviewLoading}
        loadingMessage="Preis, Volumen und Market Cap werden aktualisiert."
        loadingTitle="Marktdaten werden geladen"
        onAction={onRetry}
        unavailableMessage={overviewError}
        unavailableTitle="Marktdaten vorubergehend nicht verfugbar"
      >
        {null}
      </AsyncContent>
    );
  }

  const currencyLabel = currency.toUpperCase();
  const selectedPrice = currency === "usd" ? overview.priceUsd : overview.priceEur;
  const selectedChange24h =
    currency === "usd" ? overview.change24hUsd : overview.change24hEur;
  const selectedVolume24h =
    currency === "usd" ? overview.volume24hUsd : overview.volume24hEur;
  const selectedMarketCap =
    currency === "usd" ? overview.marketCapUsd : overview.marketCapEur;
  const selectedHigh24h = currency === "usd" ? overview.high24hUsd : overview.high24hEur;
  const selectedLow24h = currency === "usd" ? overview.low24hUsd : overview.low24hEur;

  const changeTone =
    typeof selectedChange24h === "number" && selectedChange24h > 0
      ? "positive"
      : typeof selectedChange24h === "number" && selectedChange24h < 0
        ? "negative"
        : "default";

  return (
    <Card as="section" className="gap-5">
      <SectionHeader
        eyebrow="Marktueberblick"
        title="Live-Marktuebersicht"
        description="Preis, Veraenderung, Liquiditaet und Spanne in einem wiederverwendbaren KPI-Block."
      />

      <AsyncContent
        error={overviewError}
        hasContent
        loading={showOverviewSkeleton || overviewLoading}
        loadingMessage="Preis, Volumen und Market Cap werden aktualisiert."
        loadingTitle="Marktdaten werden geladen"
        onAction={onRetry}
        preserveContentOnError
        unavailableMessage="Letzte Marktdaten werden angezeigt. Live-Daten sind gerade nicht verfugbar."
        unavailableTitle="Marktdaten vorubergehend nicht verfugbar"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label={`BTC Preis (${currencyLabel})`}
            value={formatCurrency(selectedPrice, currency)}
          />

          <MetricCard
            label={`24h Anderung (${currencyLabel})`}
            value={formatPercent(selectedChange24h)}
            valueTone={changeTone}
          />

          <MetricCard
            label={`24h Volumen (${currencyLabel})`}
            value={formatCurrency(selectedVolume24h, currency)}
          />

          <MetricCard
            label={`Market Cap (${currencyLabel})`}
            value={formatCurrency(selectedMarketCap, currency)}
          />

          <Card as="article" tone="muted" padding="sm" gap="sm">
            <MetaText className="uppercase tracking-[0.04em]" size="xs">
              24h High / Low ({currencyLabel})
            </MetaText>
            <Stack gap="sm">
              <div className="flex items-center justify-between gap-3">
                <MetaText>High</MetaText>
                <p className="text-base font-semibold text-fg">
                  {formatCurrency(selectedHigh24h, currency)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <MetaText>Low</MetaText>
                <p className="text-base font-semibold text-fg">
                  {formatCurrency(selectedLow24h, currency)}
                </p>
              </div>
            </Stack>
          </Card>
        </div>
      </AsyncContent>
    </Card>
  );
}
