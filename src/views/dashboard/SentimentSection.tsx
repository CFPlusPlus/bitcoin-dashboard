import { FALLBACK_TEXT, formatCountdown } from "../../lib/format";
import type { Sentiment } from "../../types/dashboard";

type SentimentSectionProps = {
  sentiment: Sentiment | null;
  sentimentError: string;
  sentimentLoading: boolean;
  showSentimentSkeleton: boolean;
};

export default function SentimentSection({
  sentiment,
  sentimentError,
  sentimentLoading,
  showSentimentSkeleton,
}: SentimentSectionProps) {
  return (
    <article className="card">
      <p className="label">Fear &amp; Greed</p>

      {sentimentError && <p className="muted">Fehler: {sentimentError}</p>}
      {showSentimentSkeleton && <p className="muted">Lade Sentiment...</p>}

      {!sentimentError && !sentimentLoading && sentiment && (
        <>
          <h2>{sentiment.value ?? FALLBACK_TEXT} / 100</h2>
          <p className="muted">{sentiment.classification ?? FALLBACK_TEXT}</p>
          <p className="muted">
            Nächstes Update in: {formatCountdown(sentiment.timeUntilUpdateSeconds)}
          </p>
          <p className="muted">{sentiment.attribution}</p>
        </>
      )}
    </article>
  );
}
