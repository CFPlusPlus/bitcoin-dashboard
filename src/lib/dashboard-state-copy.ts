type DashboardSectionKey =
  | "overview"
  | "chart"
  | "marketContext"
  | "network"
  | "sentiment"
  | "metadata";

type SectionStateCopy = {
  empty: {
    description: string;
    title: string;
  };
  error: {
    fallbackDescription: string;
    title: string;
  };
  loading: {
    description: string;
    title: string;
  };
  partial: {
    description: string;
    title: string;
  };
  stale: {
    description: string;
    title: string;
  };
};

const SECTION_STATE_COPY: Record<DashboardSectionKey, SectionStateCopy> = {
  overview: {
    loading: {
      title: "Marktdaten werden geladen",
      description: "Preis, 24h-Bewegung und Handelsspanne werden vorbereitet.",
    },
    empty: {
      title: "Keine Marktdaten verfuegbar",
      description:
        "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktdaten.",
    },
    error: {
      title: "Marktdaten sind gerade nicht verfuegbar",
      fallbackDescription:
        "Es konnten noch keine verlaesslichen Marktdaten geladen werden.",
    },
    partial: {
      title: "Marktdaten sind teilweise verfuegbar",
      description: "Einzelne Kennzahlen fehlen im aktuellen Abruf. Verfuegbare Werte bleiben sichtbar.",
    },
    stale: {
      title: "Letzte Marktdaten bleiben sichtbar",
      description:
        "Die letzte Aktualisierung ist fehlgeschlagen. Die angezeigten Werte koennen inzwischen ueberholt sein.",
    },
  },
  chart: {
    loading: {
      title: "Chart wird vorbereitet",
      description: "Der Preisverlauf fuer den gewaehlten Zeitraum wird geladen und aufbereitet.",
    },
    empty: {
      title: "Keine Chartdaten verfuegbar",
      description:
        "Fuer den ausgewaehlten Zeitraum liegen aktuell keine auswertbaren Kursdaten vor. Bitte waehle spaeter erneut oder wechsle kurz den Zeitraum.",
    },
    error: {
      title: "Chart ist gerade nicht verfuegbar",
      fallbackDescription:
        "Es konnten gerade keine verlaesslichen Chartdaten geladen werden. Ein erneuter Abruf versucht denselben Zeitraum noch einmal.",
    },
    partial: {
      title: "Chart ist teilweise verfuegbar",
      description:
        "Ein Teil der Kursdaten fehlt im aktuellen Abruf. Der Verlauf bleibt sichtbar, kann im Detail aber Luecken enthalten.",
    },
    stale: {
      title: "Letzter Chart bleibt sichtbar",
      description:
        "Der Chart konnte nicht neu geladen werden. Der letzte nutzbare Verlauf bleibt sichtbar, bis wieder neue Kursdaten vorliegen.",
    },
  },
  marketContext: {
    loading: {
      title: "Marktkontext wird geladen",
      description: "Market Cap und Handelsvolumen werden vorbereitet.",
    },
    empty: {
      title: "Kein Marktkontext verfuegbar",
      description:
        "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktmetriken.",
    },
    error: {
      title: "Marktkontext ist gerade nicht verfuegbar",
      fallbackDescription: "Es konnten noch keine verlaesslichen Marktmetriken geladen werden.",
    },
    partial: {
      title: "Marktkontext ist teilweise verfuegbar",
      description: "Einzelne Metriken fehlen im aktuellen Abruf. Verfuegbare Werte bleiben sichtbar.",
    },
    stale: {
      title: "Letzter Marktkontext bleibt sichtbar",
      description:
        "Die Aktualisierung ist fehlgeschlagen. Die angezeigten Kennzahlen koennen inzwischen ueberholt sein.",
    },
  },
  network: {
    loading: {
      title: "Netzwerkdaten werden geladen",
      description: "Blockhoehe und Fee-Schaetzungen werden vorbereitet.",
    },
    empty: {
      title: "Keine Netzwerkdaten verfuegbar",
      description:
        "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren On-Chain-Werte.",
    },
    error: {
      title: "Netzwerkdaten sind gerade nicht verfuegbar",
      fallbackDescription: "Es konnten noch keine verlaesslichen Netzwerkdaten geladen werden.",
    },
    partial: {
      title: "Netzwerkdaten sind teilweise verfuegbar",
      description:
        "Einzelne On-Chain-Werte fehlen im aktuellen Abruf. Verfuegbare Kennzahlen bleiben sichtbar.",
    },
    stale: {
      title: "Letzte Netzwerkdaten bleiben sichtbar",
      description:
        "Die Aktualisierung hat nicht alle Werte erneuert. Die angezeigten Angaben koennen inzwischen ueberholt sein.",
    },
  },
  sentiment: {
    loading: {
      title: "Sentiment wird geladen",
      description: "Der Fear-and-Greed-Index wird vorbereitet.",
    },
    empty: {
      title: "Kein Sentiment verfuegbar",
      description: "Der Anbieter liefert aktuell keine verwertbaren Werte fuer diesen Index.",
    },
    error: {
      title: "Sentiment ist gerade nicht verfuegbar",
      fallbackDescription: "Es konnten noch keine verlaesslichen Sentimentdaten geladen werden.",
    },
    partial: {
      title: "Sentiment ist teilweise verfuegbar",
      description: "Der aktuelle Abruf ist unvollstaendig. Vorhandene Hinweise bleiben sichtbar.",
    },
    stale: {
      title: "Letztes Sentiment bleibt sichtbar",
      description:
        "Es konnte kein neuer Indexstand geladen werden. Die Anzeige kann inzwischen ueberholt sein.",
    },
  },
  metadata: {
    loading: {
      title: "Quellenhinweise werden geladen",
      description: "Zeitstempel und Anbieterangaben werden vorbereitet.",
    },
    empty: {
      title: "Keine Quellenhinweise verfuegbar",
      description: "Sobald die ersten Daten vorliegen, erscheinen hier Quellen und Aktualisierungszeiten.",
    },
    error: {
      title: "Quellenhinweise sind gerade nicht verfuegbar",
      fallbackDescription: "Es konnten noch keine verlaesslichen Hinweise zu Quellen und Zeitstempeln geladen werden.",
    },
    partial: {
      title: "Quellenhinweise sind teilweise verfuegbar",
      description: "Einzelne Angaben fehlen noch. Vorhandene Quellenhinweise bleiben sichtbar.",
    },
    stale: {
      title: "Letzte Quellenhinweise bleiben sichtbar",
      description: "Die angezeigten Zeitstempel und Quellen koennen inzwischen ueberholt sein.",
    },
  },
};

const UNAVAILABLE_TEXT = "Nicht verfuegbar";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toLowerText(value: string) {
  return normalizeText(value).toLowerCase();
}

export function getUnavailableText() {
  return UNAVAILABLE_TEXT;
}

export function sanitizeDashboardErrorMessage(
  error: string | null | undefined,
  fallback: string
) {
  const trimmed = error ? normalizeText(error) : "";

  if (!trimmed) {
    return fallback;
  }

  const normalized = toLowerText(trimmed);

  if (normalized.includes("netzwerkfehler")) {
    return "Die Verbindung zum Datendienst ist gerade instabil. Bitte gleich erneut laden.";
  }

  if (normalized.includes("timeout")) {
    return "Der Datendienst antwortet im Moment zu langsam. Bitte gleich erneut laden.";
  }

  if (normalized.includes("leere antwort")) {
    return "Der Datendienst liefert im Moment noch keine verwertbaren Angaben.";
  }

  if (
    normalized.includes("provider") ||
    normalized.includes("coingecko") ||
    normalized.includes("mempool") ||
    normalized.includes("alternative.me") ||
    normalized.includes("anfrage fehlgeschlagen") ||
    normalized.includes("request failed") ||
    normalized.includes("upstream") ||
    /\b\d{3}\b/.test(normalized)
  ) {
    return fallback;
  }

  return trimmed;
}

export function getDashboardSectionStateMessages(
  section: DashboardSectionKey,
  error?: string | null
) {
  const copy = SECTION_STATE_COPY[section];

  return {
    loading: copy.loading,
    empty: copy.empty,
    error: {
      title: copy.error.title,
      description: sanitizeDashboardErrorMessage(error, copy.error.fallbackDescription),
    },
    partial: copy.partial,
    stale: copy.stale,
  };
}

export function normalizeDashboardWarningMessage(warning: string) {
  const trimmed = normalizeText(warning);
  const normalized = toLowerText(warning);

  if (!trimmed) {
    return "";
  }

  if (normalized.includes("usd-marktdaten")) {
    return "USD-Marktdaten kommen gerade verzoegert an. Vorhandene Werte bleiben sichtbar.";
  }

  if (normalized.includes("eur-marktdaten")) {
    return "EUR-Marktdaten kommen gerade verzoegert an. Vorhandene Werte bleiben sichtbar.";
  }

  if (normalized.includes("fee-daten")) {
    return "Fee-Schaetzungen werden gerade nicht vollstaendig erneuert. Vorhandene Werte bleiben sichtbar.";
  }

  if (normalized.includes("blockh")) {
    return "Die letzte Blockhoehe ist gerade nicht vollstaendig verfuegbar. Vorhandene Angaben bleiben sichtbar.";
  }

  if (normalized.includes("chartpunkte")) {
    return "Ein Teil der Chartpunkte fehlt im aktuellen Abruf. Der Verlauf bleibt trotzdem lesbar.";
  }

  if (normalized.includes("sentiment-update")) {
    return "Die Zeit bis zur naechsten Sentiment-Aktualisierung ist gerade nicht verfuegbar.";
  }

  const prefix = trimmed.split(":")[0]?.trim();

  if (prefix && prefix !== trimmed) {
    return `${prefix}. Verfuegbare Daten bleiben sichtbar.`;
  }

  return trimmed;
}
