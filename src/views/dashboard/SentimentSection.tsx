import type { AsyncDataState } from "../../lib/data-state";
import { FALLBACK_TEXT, formatCountdown } from "../../lib/format";
import type { Sentiment } from "../../types/dashboard";
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

export default function SentimentSection({
  onRetry,
  sentiment,
  sentimentState,
}: SentimentSectionProps) {
  return (
    <Card as="section">
      <SectionHeader
        eyebrow="Sentiment"
        title="Fear &amp; Greed"
        description="Ein kompakter Signalblock fuer Marktstimmung und den naechsten Veroeffentlichungszeitpunkt."
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
          <KpiValue
            label="Indexstand"
            value={`${sentiment?.value ?? FALLBACK_TEXT} / 100`}
            meta={sentiment?.classification ?? FALLBACK_TEXT}
          />
          <MetaText>
            Naechstes Update in: {formatCountdown(sentiment?.timeUntilUpdateSeconds ?? null)}
          </MetaText>
          <MetaText>{sentiment?.attribution ?? FALLBACK_TEXT}</MetaText>
        </Stack>
      </DataState>
    </Card>
  );
}
