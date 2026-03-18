import type { AppLocale } from "./config";

export const dictionaries = {
  de: {
    site: {
      name: "Bitcoin Dashboard",
      tagline: "Bitcoin in ruhigerem Fokus",
      languageSwitchLabel: "Sprache wechseln",
    },
    nav: {
      ariaLabel: "Hauptnavigation",
      dashboard: "Dashboard",
      tools: "Werkzeuge",
    },
    common: {
      unavailable: "Nicht verfuegbar",
      loading: "Lade neu...",
      retry: "Erneut laden",
      stale: "Veraltet",
      partially: "Teilweise",
      refreshing: "Aktualisierung laeuft",
      lastUpdated: "Zuletzt erneuert",
      status: "Stand",
      noSuccessfulFetch: "Noch kein erfolgreicher Abruf",
      noticeAriaLabel: "Hinweise",
      notices: "Hinweise",
      soon: "bald",
      justNow: "gerade eben",
      inFewSeconds: "in wenigen Sekunden",
    },
    metadata: {
      defaultDescription:
        "Bitcoin-Dashboard mit Preis, Marktstruktur, Netzwerkdaten, Sentiment und fokussierten Bitcoin-Werkzeugen.",
      home: {
        path: "/",
        title: "Bitcoin Dashboard fuer Markt, Netzwerk und Sentiment",
        description:
          "Bitcoin-Dashboard mit Preis, Marktstruktur, Netzwerkdaten und Sentiment in einer ruhigen, Bitcoin-only Ansicht.",
        schemaName: "Bitcoin Dashboard",
      },
      tools: {
        path: "/tools",
        title: "Bitcoin-Werkzeuge fuer DCA, Einstand und Entscheidungen",
        description:
          "Bitcoin-Werkzeuge fuer konkrete Entscheidungen. Den Anfang macht ein DCA-Rechner, der Einstand, Bestand und den Abstand zum aktuellen Marktpreis verstaendlich zeigt.",
        schemaName: "Bitcoin-Werkzeuge",
      },
      dca: {
        path: "/tools/dca-rechner",
        title: "Bitcoin DCA-Rechner fuer Durchschnittskaufpreis und Einstand",
        description:
          "Bitcoin DCA-Rechner zum Erfassen einzelner Kaeufe. Berechne Durchschnittskaufpreis, Bestand und den Vergleich zum aktuellen BTC-Marktpreis.",
        schemaName: "Bitcoin DCA-Rechner",
      },
    },
    tools: {
      dca: {
        slug: "dca-rechner",
        title: "DCA-Rechner",
        category: "Direkt nutzbar",
        description:
          "Trag Kaeufe ein und sieh sofort Durchschnittspreis, Bestand und Marktvergleich.",
        href: "/tools/dca-rechner",
        tags: ["DCA", "Einstand", "Bestand"],
      },
      teaser: {
        meta: "Fuer schnelle Eingaben und klare Ergebnisse.",
        open: "Werkzeug oeffnen",
      },
      page: {
        eyebrow: "Werkzeuge",
        title: "Werkzeuge, die wirklich helfen",
        description:
          "Weniger Auswahl, mehr Nutzen. Hier beginnen die Bitcoin-Werkzeuge, die du direkt verwenden kannst.",
        openFeatured: "DCA-Rechner oeffnen",
        focusEyebrow: "Klarer Fokus",
        focusTitle: "Weniger reden, mehr nutzen",
        focusDescription:
          "Hier geht es nicht um mehr Inhalt, sondern um bessere Entscheidungen.",
        pillars: [
          {
            title: "Schnell erfassbar",
            description: "Jedes Werkzeug loest eine klare Aufgabe ohne Umwege.",
          },
          {
            title: "Direkt nuetzlich",
            description:
              "Du sollst nach wenigen Sekunden wissen, was dir die Zahl bringt.",
          },
          {
            title: "Bewusst klein",
            description: "Neue Tools kommen nur dazu, wenn sie wirklich fehlen.",
          },
        ],
        highlightEyebrow: "Jetzt ausprobieren",
        highlightTitle: "Der DCA-Rechner ist der Start",
        highlightDescription:
          "Trag deine Kaeufe ein und sieh sofort Einstand, Bestand und Abstand zum Marktpreis.",
        highlightLead:
          "Ideal, wenn du regelmaessig sats stackst und wissen willst, wo du gerade stehst.",
        highlightBody: "Klar, schnell und ohne Ballast.",
        listAriaLabel: "Verfuegbare Werkzeuge",
        listEyebrow: "Aktuell live",
        listTitle: "Ein Werkzeug, das schon jetzt nuetzt",
        listDescription: "Der Bereich ist klein. Genau deshalb muss jedes Tool sitzen.",
        nextEyebrow: "Naechster Ausbau",
        nextTitle: "Mehr kommt spaeter",
        nextDescription:
          "Neue Werkzeuge kommen erst, wenn sie einen echten Mehrwert bringen.",
        nextLead: "Kein Katalog. Ein kleines Set guter Bitcoin-Helfer.",
        nextBody: "Lieber ein starkes Werkzeug als zehn halbe.",
      },
      preview: {
        ariaLabel: "Werkzeugvorschau",
        eyebrow: "Werkzeuge",
        title: "Werkzeuge fuer den naechsten Schritt",
        description: "Wenn der Blick sitzt, helfen die Werkzeuge beim Rechnen und Einordnen.",
        pageLink: "Werkzeugseite",
        followUpEyebrow: "Weiterfuehrend",
        followUpTitle: "Vom Blick zur Aktion",
        followUpDescription:
          "Hier wird aus Beobachtung eine konkrete Bitcoin-Entscheidung.",
        followUpLead:
          "Starte mit dem DCA-Rechner, wenn du Kaeufe sauber einordnen willst.",
        openDca: "DCA-Rechner",
        allTools: "Alle Werkzeuge",
      },
    },
    home: {
      headerEyebrow: "Bitcoin Dashboard",
      headerTitlePrefix: "Bitcoin auf einen",
      headerTitleAccent: "ruhigen Blick",
      headerDescription: "Preis, Stimmung und Netzwerk in einer klaren Bitcoin-Ansicht.",
      introAriaLabel: "Seiteneinordnung und Einstellungen",
      introBody:
        "Sieh in Sekunden, wo Bitcoin steht, wie der Markt wirkt und ob sich der naechste Klick lohnt.",
      jumpToChart: "Zum Chart",
      jumpToTools: "Zu den Werkzeugen",
      focusLabel: "Im Fokus",
      focusBody: "Preis zuerst. Kontext direkt danach.",
      sourcesLabel: "Datenquellen",
      sourcesBody: "CoinGecko, mempool.space und Alternative.me.",
    },
    dashboard: {
      contentAriaLabel: "Dashboard Bereiche",
      marketAndSentimentAriaLabel: "Marktkontext und Sentiment",
      marketAndSentimentEyebrow: "Marktumfeld",
      marketAndSentimentTitle: "Was den Preis gerade einordnet",
      marketAndSentimentDescription:
        "Stimmung und Marktgroesse zeigen, ob Bewegung eher laut oder belastbar wirkt.",
      controlsAriaLabel: "Aktualisierung und Einstellungen",
      controls: {
        currencyAriaLabel: "Waehrung waehlen",
        autoRefreshOn: "Live aktiv",
        autoRefreshOff: "Live pausiert",
        refreshNow: "Jetzt erneuern",
        refreshingView: "Ansicht wird erneuert...",
        statusLabel: "Aktualisierung:",
        everyMinute: "alle 60 Sekunden",
        paused: "pausiert",
        firstLoad:
          "Der erste Abruf laeuft. Die Bereiche fuellen sich, sobald die ersten Daten vorliegen.",
        stale:
          "Mindestens ein Bereich zeigt derzeit aeltere Daten. Vorhandene Inhalte bleiben sichtbar.",
        partial:
          "Einzelne Bereiche liefern gerade unvollstaendige Werte. Der Rest bleibt weiter nutzbar.",
        refreshing:
          "Die aktuelle Ansicht bleibt waehrend der Aktualisierung sichtbar.",
        persisted: "Deine Einstellungen bleiben auf diesem Geraet gespeichert.",
      },
      stateCopy: {
        overview: {
          loading: { title: "Marktdaten werden geladen", description: "Preis, 24h-Bewegung und Handelsspanne werden vorbereitet." },
          empty: { title: "Keine Marktdaten verfuegbar", description: "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktdaten." },
          error: { title: "Marktdaten sind gerade nicht verfuegbar", fallbackDescription: "Es konnten noch keine verlaesslichen Marktdaten geladen werden." },
          partial: { title: "Marktdaten sind teilweise verfuegbar", description: "Einzelne Kennzahlen fehlen im aktuellen Abruf. Verfuegbare Werte bleiben sichtbar." },
          stale: { title: "Letzte Marktdaten bleiben sichtbar", description: "Die letzte Aktualisierung ist fehlgeschlagen. Die angezeigten Werte koennen inzwischen ueberholt sein." },
        },
        chart: {
          loading: { title: "Chart wird vorbereitet", description: "Der Preisverlauf fuer den gewaehlten Zeitraum wird geladen und aufbereitet." },
          empty: { title: "Keine Chartdaten verfuegbar", description: "Fuer den ausgewaehlten Zeitraum liegen aktuell keine auswertbaren Kursdaten vor. Bitte waehle spaeter erneut oder wechsle kurz den Zeitraum." },
          error: { title: "Chart ist gerade nicht verfuegbar", fallbackDescription: "Es konnten gerade keine verlaesslichen Chartdaten geladen werden. Ein erneuter Abruf versucht denselben Zeitraum noch einmal." },
          partial: { title: "Chart ist teilweise verfuegbar", description: "Ein Teil der Kursdaten fehlt im aktuellen Abruf. Der Verlauf bleibt sichtbar, kann im Detail aber Luecken enthalten." },
          stale: { title: "Letzter Chart bleibt sichtbar", description: "Der Chart konnte nicht neu geladen werden. Der letzte nutzbare Verlauf bleibt sichtbar, bis wieder neue Kursdaten vorliegen." },
        },
        marketContext: {
          loading: { title: "Marktkontext wird geladen", description: "Market Cap und Handelsvolumen werden vorbereitet." },
          empty: { title: "Kein Marktkontext verfuegbar", description: "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktmetriken." },
          error: { title: "Marktkontext ist gerade nicht verfuegbar", fallbackDescription: "Es konnten noch keine verlaesslichen Marktmetriken geladen werden." },
          partial: { title: "Marktkontext ist teilweise verfuegbar", description: "Einzelne Metriken fehlen im aktuellen Abruf. Verfuegbare Werte bleiben sichtbar." },
          stale: { title: "Letzter Marktkontext bleibt sichtbar", description: "Die Aktualisierung ist fehlgeschlagen. Die angezeigten Kennzahlen koennen inzwischen ueberholt sein." },
        },
        network: {
          loading: { title: "Netzwerkdaten werden geladen", description: "Blockhoehe und Fee-Schaetzungen werden vorbereitet." },
          empty: { title: "Keine Netzwerkdaten verfuegbar", description: "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren On-Chain-Werte." },
          error: { title: "Netzwerkdaten sind gerade nicht verfuegbar", fallbackDescription: "Es konnten noch keine verlaesslichen Netzwerkdaten geladen werden." },
          partial: { title: "Netzwerkdaten sind teilweise verfuegbar", description: "Einzelne On-Chain-Werte fehlen im aktuellen Abruf. Verfuegbare Kennzahlen bleiben sichtbar." },
          stale: { title: "Letzte Netzwerkdaten bleiben sichtbar", description: "Die Aktualisierung hat nicht alle Werte erneuert. Die angezeigten Angaben koennen inzwischen ueberholt sein." },
        },
        sentiment: {
          loading: { title: "Sentiment wird geladen", description: "Der Fear-and-Greed-Index wird vorbereitet." },
          empty: { title: "Kein Sentiment verfuegbar", description: "Der Anbieter liefert aktuell keine verwertbaren Werte fuer diesen Index." },
          error: { title: "Sentiment ist gerade nicht verfuegbar", fallbackDescription: "Es konnten noch keine verlaesslichen Sentimentdaten geladen werden." },
          partial: { title: "Sentiment ist teilweise verfuegbar", description: "Der aktuelle Abruf ist unvollstaendig. Vorhandene Hinweise bleiben sichtbar." },
          stale: { title: "Letztes Sentiment bleibt sichtbar", description: "Es konnte kein neuer Indexstand geladen werden. Die Anzeige kann inzwischen ueberholt sein." },
        },
        metadata: {
          loading: { title: "Quellenhinweise werden geladen", description: "Zeitstempel und Anbieterangaben werden vorbereitet." },
          empty: { title: "Keine Quellenhinweise verfuegbar", description: "Sobald die ersten Daten vorliegen, erscheinen hier Quellen und Aktualisierungszeiten." },
          error: { title: "Quellenhinweise sind gerade nicht verfuegbar", fallbackDescription: "Es konnten noch keine verlaesslichen Hinweise zu Quellen und Zeitstempeln geladen werden." },
          partial: { title: "Quellenhinweise sind teilweise verfuegbar", description: "Einzelne Angaben fehlen noch. Vorhandene Quellenhinweise bleiben sichtbar." },
          stale: { title: "Letzte Quellenhinweise bleiben sichtbar", description: "Die angezeigten Zeitstempel und Quellen koennen inzwischen ueberholt sein." },
        },
        sanitizedErrors: {
          network: "Die Verbindung zum Datendienst ist gerade instabil. Bitte gleich erneut laden.",
          timeout: "Der Datendienst antwortet im Moment zu langsam. Bitte gleich erneut laden.",
          emptyResponse: "Der Datendienst liefert im Moment noch keine verwertbaren Angaben.",
        },
        warningNormalization: {
          usdDelayed: "USD-Marktdaten kommen gerade verzoegert an. Vorhandene Werte bleiben sichtbar.",
          eurDelayed: "EUR-Marktdaten kommen gerade verzoegert an. Vorhandene Werte bleiben sichtbar.",
          feeDelayed: "Fee-Schaetzungen werden gerade nicht vollstaendig erneuert. Vorhandene Werte bleiben sichtbar.",
          blockHeightMissing: "Die letzte Blockhoehe ist gerade nicht vollstaendig verfuegbar. Vorhandene Angaben bleiben sichtbar.",
          chartPointsMissing: "Ein Teil der Chartpunkte fehlt im aktuellen Abruf. Der Verlauf bleibt trotzdem lesbar.",
          sentimentUpdateMissing: "Die Zeit bis zur naechsten Sentiment-Aktualisierung ist gerade nicht verfuegbar.",
          fallbackSuffix: "Verfuegbare Daten bleiben sichtbar.",
        },
        fallbacks: {
          overviewUnavailable:
            "Marktdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
          networkUnavailable:
            "Netzwerkdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
          sentimentUnavailable:
            "Sentimentdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
          chartUnavailable:
            "Chartdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
        },
      },
    },
    dca: {
      heroEyebrow: "Werkzeug",
      heroTitle: "DCA-Rechner fuer deinen Durchschnittspreis",
      heroDescription:
        "Erfasse deine Bitcoin-Kaeufe, behalte deinen Durchschnittspreis im Blick und vergleiche deinen Einstieg mit dem aktuellen Referenzpreis in {currency}.",
      marketDataEyebrow: "Marktdaten",
      marketDataTitle: "Aktueller Referenzpreis",
      marketPriceLine: "Marktpreis: {value} / BTC",
      currencyAriaLabel: "Werkzeugwaehrung",
      refreshPrice: "Preis erneuern",
      insightEyebrow: "Einordnung",
      primaryEmptyTitle: "Noch keine Kaeufe erfasst",
      primaryEmptyDescription:
        "Trage deinen ersten Kauf ein. Danach zeigt dir der Rechner automatisch deinen Durchschnittspreis, deinen BTC-Bestand und den Vergleich zum aktuellen Marktpreis.",
      primarySummaryDescription:
        "Das ist dein durchschnittlicher Einstieg pro Bitcoin auf Basis aller erfassten Kaeufe in der aktiven Waehrung.",
      primarySummaryTitle: "Dein durchschnittlicher Kaufpreis liegt bei {value} / BTC",
      performanceEmpty:
        "Sobald du Kaeufe erfasst hast, erscheint hier eine ruhige Einordnung statt nur einzelner Zahlen.",
      performanceMissingPrice:
        "Deine Kaufhistorie ist gespeichert. Fuer den heutigen Vergleich fehlt gerade nur ein aktueller Referenzpreis.",
      performancePositive:
        "Beim aktuellen Referenzpreis liegt dein Bestand rund {currentValue} wert und etwa {deltaValue} bzw. {deltaPercent} ueber deinem eingesetzten Kapital.",
      performanceNegative:
        "Beim aktuellen Referenzpreis liegt dein Bestand rund {currentValue} wert und etwa {deltaValue} bzw. {deltaPercent} unter deinem eingesetzten Kapital.",
      performanceNeutral:
        "Beim aktuellen Referenzpreis entspricht dein Bestand mit rund {currentValue} nahezu deinem eingesetzten Kapital.",
      investedLabel: "Bisher investiert",
      investedDescription: "Summe aller erfassten Kaeufe in {currency}.",
      bitcoinLabel: "Erhaltenes BTC",
      bitcoinDescription: "Berechnet aus Betrag und BTC-Preis jedes Kaufs.",
      averageLabel: "Durchschnittlicher Kaufpreis",
      averageDescription: "Dein rechnerischer Einstieg ueber alle Eintraege hinweg.",
      currentPriceLabel: "Aktueller Vergleichspreis",
      currentPriceDescription: "Der zuletzt geladene BTC-Referenzpreis fuer diese Waehrung.",
      currentValueLabel: "Geschaetzter Wert heute",
      currentValueDescription: "So viel waere dein Bestand beim aktuellen Referenzpreis wert.",
      pnlLabel: "Abweichung zum Einsatz",
      marketState: {
        loadingTitle: "Referenzpreis wird geladen",
        loadingDescription: "Der aktuelle BTC-Preis fuer den Rechner wird vorbereitet.",
        emptyTitle: "Kein Referenzpreis verfuegbar",
        emptyDescription:
          "Der Abruf war erfolgreich, liefert fuer die aktive Waehrung aber keinen verwendbaren Preis.",
        errorTitle: "Referenzpreis ist gerade nicht verfuegbar",
        errorFallback:
          "Es konnte noch kein verlaesslicher Marktpreis fuer den Rechner geladen werden.",
        partialTitle: "Referenzpreis ist teilweise verfuegbar",
        partialDescription:
          "Der aktuelle Marktabruf ist unvollstaendig. Vorhandene Werte bleiben fuer den Rechner sichtbar.",
        staleTitle: "Letzter Referenzpreis bleibt sichtbar",
        staleDescription:
          "Die Aktualisierung ist fehlgeschlagen. Der angezeigte Preis kann inzwischen ueberholt sein.",
        loadError: "Der Referenzpreis konnte nicht geladen werden.",
      },
      formEyebrow: "Neuer Kauf",
      formTitle: "Kauf eintragen",
      formDescription:
        "Eintraege werden automatisch nur in diesem Browser gespeichert. USD und EUR bleiben bewusst getrennt, damit deine Reihen sauber vergleichbar bleiben.",
      fields: {
        date: "Kaufdatum",
        dateHint: "Nutze das Datum, an dem der Kauf ausgefuehrt wurde.",
        amount: "Wie viel hast du investiert? ({currency})",
        amountHint: "Gib den Gesamtbetrag des Kaufs ein. Komma und Punkt werden akzeptiert.",
        bitcoinPrice: "Welcher BTC-Preis galt beim Kauf? ({currency})",
        bitcoinPriceHint:
          "Das ist der Preis pro 1 BTC zum Kaufzeitpunkt, nicht dein investierter Gesamtbetrag.",
        note: "Kurze Notiz (optional)",
        notePlaceholder: "z. B. Monatsrate Maerz",
        noteHint:
          "Hilfreich fuer Erinnerungen wie Sparplan, Sonderkauf oder Ruecksetzer.",
      },
      savePurchase: "Kauf speichern",
      persistenceNote: "Deine Liste bleibt auf diesem Geraet erhalten, bis du sie selbst loeschst.",
      historyEyebrow: "Kaufhistorie",
      historySingular: "{count} Eintrag",
      historyPlural: "{count} Eintraege",
      historyFilled: "Du siehst hier deine lokal gespeicherte {currency}-Kaufreihe.",
      historyEmpty: "Noch keine lokal gespeicherten Kaeufe in {currency}.",
      clearSeries: "{currency}-Reihe loeschen",
      emptyStateTitle: "Deine {currency}-Kaufreihe ist noch leer",
      emptyStateDescription:
        "Sobald du den ersten Kauf eintraegst, zeigt dir der Rechner deinen Durchschnittspreis, deinen BTC-Bestand und den heutigen Vergleichswert.",
      backToTools: "Zur Werkzeugseite",
      firstPurchase: "Ersten Kauf erfassen",
      rowInvested: "Investiert: {value}",
      rowBuyPrice: "Kaufpreis: {value} / BTC",
      rowBitcoinReceived: "BTC erhalten: {value}",
      rowRemove: "Entfernen",
      validation: {
        missingDate: "Bitte waehle das Kaufdatum aus.",
        invalidDate: "Bitte gib ein gueltiges Kaufdatum an.",
        futureDate: "Das Kaufdatum darf nicht in der Zukunft liegen.",
        missingAmount: "Bitte gib ein, wie viel du investiert hast.",
        invalidAmount: "Der investierte Betrag muss groesser als 0 sein.",
        missingBitcoinPrice: "Bitte gib den BTC-Preis zum Kaufzeitpunkt ein.",
        invalidBitcoinPrice: "Der BTC-Preis muss groesser als 0 sein.",
      },
    },
    api: {
      requestFailed: "Anfrage fehlgeschlagen ({status}).",
      networkError: "Netzwerkfehler. Bitte spaeter erneut versuchen.",
      emptyResponse: "Leere Antwort vom Server erhalten.",
    },
  },
  en: {
    site: {
      name: "Bitcoin Dashboard",
      tagline: "Bitcoin with calmer focus",
      languageSwitchLabel: "Switch language",
    },
    nav: {
      ariaLabel: "Main navigation",
      dashboard: "Dashboard",
      tools: "Tools",
    },
    common: {
      unavailable: "Unavailable",
      loading: "Reloading...",
      retry: "Retry",
      stale: "Stale",
      partially: "Partial",
      refreshing: "Refreshing",
      lastUpdated: "Last updated",
      status: "Status",
      noSuccessfulFetch: "No successful fetch yet",
      noticeAriaLabel: "Notices",
      notices: "Notices",
      soon: "soon",
      justNow: "just now",
      inFewSeconds: "in a few seconds",
    },
    metadata: {
      defaultDescription:
        "Bitcoin dashboard with price, market structure, network data, sentiment, and focused Bitcoin tools.",
      home: {
        path: "/",
        title: "Bitcoin Dashboard for Market, Network, and Sentiment",
        description:
          "Bitcoin dashboard with price, market structure, network data, and sentiment in a calm Bitcoin-only view.",
        schemaName: "Bitcoin Dashboard",
      },
      tools: {
        path: "/tools",
        title: "Bitcoin Tools for DCA, Cost Basis, and Decisions",
        description:
          "Bitcoin tools for concrete decisions. It starts with a DCA calculator that makes cost basis, holdings, and distance to the current market price easy to understand.",
        schemaName: "Bitcoin Tools",
      },
      dca: {
        path: "/tools/dca-rechner",
        title: "Bitcoin DCA Calculator for Average Buy Price and Cost Basis",
        description:
          "Bitcoin DCA calculator for tracking individual buys. Calculate average buy price, holdings, and compare your position against the current BTC market price.",
        schemaName: "Bitcoin DCA Calculator",
      },
    },
    tools: {
      dca: {
        slug: "dca-rechner",
        title: "DCA Calculator",
        category: "Ready to use",
        description:
          "Track your buys and instantly see average entry price, holdings, and market comparison.",
        href: "/tools/dca-rechner",
        tags: ["DCA", "Cost basis", "Holdings"],
      },
      teaser: {
        meta: "For fast inputs and clear outputs.",
        open: "Open tool",
      },
      page: {
        eyebrow: "Tools",
        title: "Tools that actually help",
        description:
          "Less choice, more usefulness. This is where the Bitcoin tools begin that you can use right away.",
        openFeatured: "Open DCA Calculator",
        focusEyebrow: "Clear focus",
        focusTitle: "Less talking, more usefulness",
        focusDescription:
          "This is not about more content. It is about better decisions.",
        pillars: [
          {
            title: "Quick to grasp",
            description: "Each tool solves one clear job without detours.",
          },
          {
            title: "Immediately useful",
            description:
              "You should know within seconds what value a number gives you.",
          },
          {
            title: "Intentionally small",
            description: "New tools are added only when they are truly missing.",
          },
        ],
        highlightEyebrow: "Try it now",
        highlightTitle: "The DCA Calculator is the start",
        highlightDescription:
          "Enter your buys and immediately see cost basis, holdings, and distance to market price.",
        highlightLead:
          "Ideal if you stack sats regularly and want to know where you stand right now.",
        highlightBody: "Clear, fast, and without clutter.",
        listAriaLabel: "Available tools",
        listEyebrow: "Live now",
        listTitle: "One tool that is already useful",
        listDescription: "The section is small. That is exactly why every tool has to matter.",
        nextEyebrow: "Next expansion",
        nextTitle: "More will come later",
        nextDescription:
          "New tools only arrive when they add real value.",
        nextLead: "Not a catalog. A small set of strong Bitcoin helpers.",
        nextBody: "Better one strong tool than ten half-finished ones.",
      },
      preview: {
        ariaLabel: "Tool preview",
        eyebrow: "Tools",
        title: "Tools for the next step",
        description: "Once the view is clear, the tools help with calculation and context.",
        pageLink: "Tools page",
        followUpEyebrow: "Next up",
        followUpTitle: "From viewing to action",
        followUpDescription: "This is where observation turns into a concrete Bitcoin decision.",
        followUpLead:
          "Start with the DCA Calculator if you want to understand your buys cleanly.",
        openDca: "DCA Calculator",
        allTools: "All tools",
      },
    },
    home: {
      headerEyebrow: "Bitcoin Dashboard",
      headerTitlePrefix: "Bitcoin at a",
      headerTitleAccent: "calmer glance",
      headerDescription: "Price, sentiment, and network in a focused Bitcoin view.",
      introAriaLabel: "Page introduction and settings",
      introBody:
        "See in seconds where Bitcoin stands, how the market feels, and whether the next click is worth it.",
      jumpToChart: "Jump to chart",
      jumpToTools: "Go to tools",
      focusLabel: "In focus",
      focusBody: "Price first. Context right after.",
      sourcesLabel: "Data sources",
      sourcesBody: "CoinGecko, mempool.space, and Alternative.me.",
    },
    dashboard: {
      contentAriaLabel: "Dashboard sections",
      marketAndSentimentAriaLabel: "Market context and sentiment",
      marketAndSentimentEyebrow: "Market context",
      marketAndSentimentTitle: "What gives the price context right now",
      marketAndSentimentDescription:
        "Sentiment and market size help show whether a move looks noisy or durable.",
      controlsAriaLabel: "Refresh and settings",
      controls: {
        currencyAriaLabel: "Choose currency",
        autoRefreshOn: "Live on",
        autoRefreshOff: "Live paused",
        refreshNow: "Refresh now",
        refreshingView: "Refreshing view...",
        statusLabel: "Refresh:",
        everyMinute: "every 60 seconds",
        paused: "paused",
        firstLoad:
          "The first fetch is running. Sections will fill in as soon as the first data arrives.",
        stale:
          "At least one section currently shows older data. Existing content stays visible.",
        partial:
          "Some sections currently return incomplete values. The rest remains usable.",
        refreshing: "The current view stays visible while refreshing.",
        persisted: "Your settings stay saved on this device.",
      },
      stateCopy: {
        overview: {
          loading: { title: "Loading market data", description: "Price, 24h move, and range are being prepared." },
          empty: { title: "No market data available", description: "The fetch succeeded, but there is no usable market data right now." },
          error: { title: "Market data is currently unavailable", fallbackDescription: "No reliable market data could be loaded yet." },
          partial: { title: "Market data is partially available", description: "Some metrics are missing in the current fetch. Available values stay visible." },
          stale: { title: "Latest market data stays visible", description: "The latest refresh failed. The visible values may now be outdated." },
        },
        chart: {
          loading: { title: "Preparing chart", description: "Price action for the selected range is loading and being processed." },
          empty: { title: "No chart data available", description: "There is currently no usable price data for the selected range. Please try again later or switch the range briefly." },
          error: { title: "Chart is currently unavailable", fallbackDescription: "No reliable chart data could be loaded right now. A retry will request the same range again." },
          partial: { title: "Chart is partially available", description: "Some price points are missing in the current fetch. The line remains visible but may contain gaps." },
          stale: { title: "Latest chart stays visible", description: "The chart could not be refreshed. The last usable line stays visible until new market data arrives." },
        },
        marketContext: {
          loading: { title: "Loading market context", description: "Market cap and trading volume are being prepared." },
          empty: { title: "No market context available", description: "The fetch succeeded, but there are no usable market metrics right now." },
          error: { title: "Market context is currently unavailable", fallbackDescription: "No reliable market metrics could be loaded yet." },
          partial: { title: "Market context is partially available", description: "Some metrics are missing in the current fetch. Available values stay visible." },
          stale: { title: "Latest market context stays visible", description: "The refresh failed. The displayed metrics may now be outdated." },
        },
        network: {
          loading: { title: "Loading network data", description: "Block height and fee estimates are being prepared." },
          empty: { title: "No network data available", description: "The fetch succeeded, but there are no usable on-chain values right now." },
          error: { title: "Network data is currently unavailable", fallbackDescription: "No reliable network data could be loaded yet." },
          partial: { title: "Network data is partially available", description: "Some on-chain values are missing in the current fetch. Available metrics stay visible." },
          stale: { title: "Latest network data stays visible", description: "The refresh did not update all values. The displayed data may now be outdated." },
        },
        sentiment: {
          loading: { title: "Loading sentiment", description: "The Fear and Greed Index is being prepared." },
          empty: { title: "No sentiment available", description: "The provider currently returns no usable values for this index." },
          error: { title: "Sentiment is currently unavailable", fallbackDescription: "No reliable sentiment data could be loaded yet." },
          partial: { title: "Sentiment is partially available", description: "The current fetch is incomplete. Existing hints stay visible." },
          stale: { title: "Latest sentiment stays visible", description: "No new index value could be loaded. The display may now be outdated." },
        },
        metadata: {
          loading: { title: "Loading source details", description: "Timestamps and provider details are being prepared." },
          empty: { title: "No source details available", description: "As soon as the first data arrives, sources and refresh times will appear here." },
          error: { title: "Source details are currently unavailable", fallbackDescription: "No reliable source and timestamp details could be loaded yet." },
          partial: { title: "Source details are partially available", description: "Some details are still missing. Existing source details stay visible." },
          stale: { title: "Latest source details stay visible", description: "The displayed timestamps and sources may now be outdated." },
        },
        sanitizedErrors: {
          network: "The connection to the data service is unstable right now. Please try again in a moment.",
          timeout: "The data service is responding too slowly right now. Please try again in a moment.",
          emptyResponse: "The data service is currently not returning usable details.",
        },
        warningNormalization: {
          usdDelayed: "USD market data is arriving with a delay. Available values stay visible.",
          eurDelayed: "EUR market data is arriving with a delay. Available values stay visible.",
          feeDelayed: "Fee estimates are not being fully refreshed right now. Available values stay visible.",
          blockHeightMissing: "The latest block height is not fully available right now. Available details stay visible.",
          chartPointsMissing: "Some chart points are missing in the current fetch. The chart remains readable.",
          sentimentUpdateMissing: "The time until the next sentiment update is not available right now.",
          fallbackSuffix: "Available data stays visible.",
        },
        fallbacks: {
          overviewUnavailable: "Market data is currently unavailable. Please try again later.",
          networkUnavailable: "Network data is currently unavailable. Please try again later.",
          sentimentUnavailable: "Sentiment data is currently unavailable. Please try again later.",
          chartUnavailable: "Chart data is currently unavailable. Please try again later.",
        },
      },
    },
    dca: {
      heroEyebrow: "Tool",
      heroTitle: "DCA Calculator for your average entry price",
      heroDescription:
        "Track your Bitcoin buys, keep your average entry price in view, and compare your position with the current reference price in {currency}.",
      marketDataEyebrow: "Market data",
      marketDataTitle: "Current reference price",
      marketPriceLine: "Market price: {value} / BTC",
      currencyAriaLabel: "Tool currency",
      refreshPrice: "Refresh price",
      insightEyebrow: "Interpretation",
      primaryEmptyTitle: "No buys tracked yet",
      primaryEmptyDescription:
        "Add your first buy. After that, the calculator will automatically show your average buy price, BTC holdings, and comparison with the current market price.",
      primarySummaryDescription:
        "This is your average entry per Bitcoin based on all tracked buys in the active currency.",
      primarySummaryTitle: "Your average buy price is {value} / BTC",
      performanceEmpty:
        "As soon as you add buys, you will see calm context here instead of isolated numbers.",
      performanceMissingPrice:
        "Your buy history is saved. For today's comparison, only a current reference price is missing right now.",
      performancePositive:
        "At the current reference price, your holdings are worth about {currentValue} and sit around {deltaValue} or {deltaPercent} above your invested capital.",
      performanceNegative:
        "At the current reference price, your holdings are worth about {currentValue} and sit around {deltaValue} or {deltaPercent} below your invested capital.",
      performanceNeutral:
        "At the current reference price, your holdings at around {currentValue} are nearly equal to your invested capital.",
      investedLabel: "Invested so far",
      investedDescription: "Sum of all tracked buys in {currency}.",
      bitcoinLabel: "BTC received",
      bitcoinDescription: "Calculated from amount and BTC price of each buy.",
      averageLabel: "Average buy price",
      averageDescription: "Your calculated entry across all entries.",
      currentPriceLabel: "Current comparison price",
      currentPriceDescription: "The latest loaded BTC reference price for this currency.",
      currentValueLabel: "Estimated value today",
      currentValueDescription: "This is what your holdings would be worth at the current reference price.",
      pnlLabel: "Difference vs. invested capital",
      marketState: {
        loadingTitle: "Loading reference price",
        loadingDescription: "The current BTC price for the calculator is being prepared.",
        emptyTitle: "No reference price available",
        emptyDescription:
          "The fetch succeeded, but there is no usable price for the active currency.",
        errorTitle: "Reference price is currently unavailable",
        errorFallback:
          "No reliable market price for the calculator could be loaded yet.",
        partialTitle: "Reference price is partially available",
        partialDescription:
          "The current market fetch is incomplete. Available values stay visible for the calculator.",
        staleTitle: "Latest reference price stays visible",
        staleDescription:
          "The refresh failed. The displayed price may now be outdated.",
        loadError: "The reference price could not be loaded.",
      },
      formEyebrow: "New buy",
      formTitle: "Add buy",
      formDescription:
        "Entries are stored automatically only in this browser. USD and EUR stay separate on purpose so your series remains cleanly comparable.",
      fields: {
        date: "Buy date",
        dateHint: "Use the date on which the buy was executed.",
        amount: "How much did you invest? ({currency})",
        amountHint: "Enter the total amount of the buy. Commas and dots are accepted.",
        bitcoinPrice: "What BTC price applied at the time of the buy? ({currency})",
        bitcoinPriceHint:
          "This is the price per 1 BTC at the time of the buy, not the total amount you invested.",
        note: "Short note (optional)",
        notePlaceholder: "e.g. Monthly buy March",
        noteHint: "Helpful for reminders like recurring buy, extra buy, or dip buy.",
      },
      savePurchase: "Save buy",
      persistenceNote: "Your list stays on this device until you delete it yourself.",
      historyEyebrow: "Buy history",
      historySingular: "{count} entry",
      historyPlural: "{count} entries",
      historyFilled: "You can see your locally stored {currency} buy series here.",
      historyEmpty: "No locally stored buys yet in {currency}.",
      clearSeries: "Clear {currency} series",
      emptyStateTitle: "Your {currency} buy series is still empty",
      emptyStateDescription:
        "As soon as you add your first buy, the calculator will show your average buy price, BTC holdings, and current comparison value.",
      backToTools: "Back to tools",
      firstPurchase: "Add first buy",
      rowInvested: "Invested: {value}",
      rowBuyPrice: "Buy price: {value} / BTC",
      rowBitcoinReceived: "BTC received: {value}",
      rowRemove: "Remove",
      validation: {
        missingDate: "Please choose the buy date.",
        invalidDate: "Please enter a valid buy date.",
        futureDate: "The buy date cannot be in the future.",
        missingAmount: "Please enter how much you invested.",
        invalidAmount: "The invested amount must be greater than 0.",
        missingBitcoinPrice: "Please enter the BTC price at the time of the buy.",
        invalidBitcoinPrice: "The BTC price must be greater than 0.",
      },
    },
    api: {
      requestFailed: "Request failed ({status}).",
      networkError: "Network error. Please try again later.",
      emptyResponse: "Received an empty response from the server.",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[AppLocale];

export function getDictionary(locale: AppLocale) {
  return dictionaries[locale];
}
