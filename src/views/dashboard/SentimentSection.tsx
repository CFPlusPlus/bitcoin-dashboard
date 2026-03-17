import AsyncContent from "../../components/AsyncContent";
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
    <article className="card">
      <p className="label">Fear &amp; Greed</p>
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
        <>
          <h2>{sentiment?.value ?? FALLBACK_TEXT} / 100</h2>
          <p className="muted">{sentiment?.classification ?? FALLBACK_TEXT}</p>
          <p className="muted">
            Nachstes Update in: {formatCountdown(sentiment?.timeUntilUpdateSeconds ?? null)}
          </p>
          <p className="muted">{sentiment?.attribution ?? FALLBACK_TEXT}</p>
        </>
      </AsyncContent>
    </article>
  );
}
