import AsyncContent from "../../components/AsyncContent";
import Card from "../../components/ui/Card";
import KpiValue from "../../components/ui/content/KpiValue";
import MetaText from "../../components/ui/content/MetaText";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";
import { FALLBACK_TEXT, formatCountdown } from "../../lib/format";
import type { Sentiment } from "../../types/dashboard";

type SentimentSectionProps = {
  onRetry: () => void;
  sentiment: Sentiment | null;
  sentimentError: string;
  sentimentLoading: boolean;
  showSentimentSkeleton: boolean;
};

export default function SentimentSection({
  onRetry,
  sentiment,
  sentimentError,
  sentimentLoading,
  showSentimentSkeleton,
}: SentimentSectionProps) {
  const hasSentiment =
    sentiment !== null &&
    (sentiment.value !== null ||
      sentiment.classification !== null ||
      sentiment.timeUntilUpdateSeconds !== null);

  return (
    <Card as="section">
      <SectionHeader
        eyebrow="Sentiment"
        title="Fear &amp; Greed"
        description="Ein kompakter Signalblock fuer Marktstimmung und den naechsten Veroeffentlichungszeitpunkt."
      />

      <AsyncContent
        emptyMessage="Der Sentiment-Index liefert aktuell keine verwertbaren Werte."
        emptyTitle="Kein Sentiment verfugbar"
        error={sentimentError}
        hasContent={hasSentiment}
        isEmpty={sentiment !== null && !hasSentiment}
        loading={showSentimentSkeleton || sentimentLoading}
        loadingMessage="Der Fear-and-Greed-Index wird geladen."
        loadingTitle="Sentiment wird geladen"
        onAction={onRetry}
        preserveContentOnError
        unavailableMessage="Letzte Sentimentdaten werden angezeigt. Neue Werte sind gerade nicht verfugbar."
        unavailableTitle="Sentiment vorubergehend nicht verfugbar"
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
      </AsyncContent>
    </Card>
  );
}
