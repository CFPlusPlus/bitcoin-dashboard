export default function PageHeader() {
  return (
    <header className="space-y-3">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">MVP+</p>
      <h1>Bitcoin Dashboard</h1>
      <p className="max-w-[65ch] text-fg-muted">
        Marktdaten über CoinGecko, Netzwerkdaten über mempool.space und Sentiment über Alternative.me. Einstellungen
        bleiben jetzt auf diesem Gerät gespeichert.
      </p>
    </header>
  );
}
