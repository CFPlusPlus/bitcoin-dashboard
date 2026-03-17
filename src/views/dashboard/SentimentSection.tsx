import type { AsyncDataState } from "../../lib/data-state";
import { FALLBACK_TEXT, formatCountdown } from "../../lib/format";
import type { Sentiment } from "../../types/dashboard";
import { cn } from "../../lib/cn";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import KpiValue from "../../components/ui/content/KpiValue";
import MetaText from "../../components/ui/content/MetaText";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";

type SentimentSectionProps = {
  onRetry: () => void;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
};

function getSentimentTone(classification: string | null) {
  const normalized = classification?.toLowerCase() ?? "";

  if (normalized.includes("greed")) {
    return {
      badgeClassName: "border-success/30 bg-success/10 text-success",
      tone: "positive" as const,
    };
  }

  if (normalized.includes("fear")) {
    return {
      badgeClassName: "border-danger/30 bg-danger/10 text-danger",
      tone: "negative" as const,
    };
  }

  return {
    badgeClassName: "border-border-default bg-muted-surface text-fg-secondary",
    tone: "default" as const,
  };
}

export default function SentimentSection({
  onRetry,
  sentiment,
  sentimentState,
}: SentimentSectionProps) {
  const sentimentUi = getSentimentTone(sentiment?.classification ?? null);

  return (
    <Card as="section" tone="muted" className="h-full gap-5">
      <SectionHeader
        eyebrow="Sentiment"
        title="Fear &amp; Greed"
        description="Ein kompakter Signalblock fuer Marktstimmung, der schnell erfassbar bleibt und sich klar hinter Preis und Chart einordnet."
        meta={<DataStateMeta state={sentimentState} />}
      />

      <DataState
        state={sentimentState}
        onRetry={onRetry}
        retryBusy={sentimentState.isLoading}
        messages={{
          loading: {
            title: "Sentiment wird geladen",
            description: "Der Fear-and-Greed-Index wird vorbereitet.",
          },
          empty: {
            title: "Kein Sentiment verfuegbar",
            description:
              "Der Anbieter hat aktuell keine verwertbaren Werte fuer diesen Index geliefert.",
          },
          error: {
            title: "Sentiment ist gerade nicht verfuegbar",
            description:
              sentimentState.error ??
              "Es konnten noch keine verlaesslichen Sentimentdaten geladen werden.",
          },
          partial: {
            title: "Sentiment ist teilweise verfuegbar",
            description:
              "Der aktuelle Abruf ist unvollstaendig. Vorhandene Hinweise bleiben sichtbar.",
          },
          stale: {
            title: "Letztes Sentiment bleibt sichtbar",
            description:
              "Es konnte kein neuer Indexstand geladen werden. Die Anzeige kann inzwischen veraltet sein.",
          },
        }}
      >
        <Stack gap="md">
          <Card as="article" tone="default" padding="sm" gap="md" className="border-border-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <KpiValue
                label="Indexstand"
                value={`${sentiment?.value ?? FALLBACK_TEXT} / 100`}
                meta="Fear & Greed Index"
                size="lg"
                tone={sentimentUi.tone}
              />
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em]",
                  sentimentUi.badgeClassName
                )}
              >
                {sentiment?.classification ?? FALLBACK_TEXT}
              </span>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card as="article" tone="default" padding="sm" gap="sm" className="border-border-subtle">
              <MetaText size="xs" className="uppercase tracking-[0.04em]">
                Naechstes Update
              </MetaText>
              <p className="text-base font-semibold text-fg">
                {formatCountdown(sentiment?.timeUntilUpdateSeconds ?? null)}
              </p>
            </Card>

            <Card as="article" tone="default" padding="sm" gap="sm" className="border-border-subtle">
              <MetaText size="xs" className="uppercase tracking-[0.04em]">
                Quelle
              </MetaText>
              <p className="text-base font-semibold text-fg">
                {sentiment?.attribution ?? FALLBACK_TEXT}
              </p>
            </Card>
          </div>
        </Stack>
      </DataState>
    </Card>
  );
}
