import type { AppLocale } from "./config";

export const dictionaries = {
  de: {
    site: {
      name: "bitstats.org",
      tagline: "Bitcoin in ruhigerem Fokus",
      languageSwitchLabel: "Sprache wechseln",
      themeSwitchToLight: "Zum hellen Modus wechseln",
      themeSwitchToDark: "Zum dunklen Modus wechseln",
      currencySwitchLabel: "Währung wechseln",
      currencySearchLabel: "Währung suchen",
      currencySearchPlaceholder: "Code oder Name eingeben",
      currencyCloseLabel: "Währungsauswahl schließen",
      currencyRecentLabel: "Zuletzt genutzt",
      currencyScopeLabel: "Anzeigen",
      currencyScopeFiatOnly: "Nur Fiat",
      currencyScopeAllQuotes: "Alle inkl. Krypto",
      currencyPopularLabel: "Beliebt",
      currencyAllLabel: "Alle verfügbaren Währungen",
      currencyNoResults: "Keine passende Währung gefunden.",
      footer: {
        description:
          "Ein ruhiger Bitcoin-Blick auf Markt, Netzwerk, Sentiment und fokussierte Werkzeuge.",
        navigation: "Navigation",
        legal: "Rechtliches",
        dashboard: "Zum Dashboard",
        tools: "Zu den Werkzeugen",
        imprint: "Impressum",
        privacy: "Datenschutz",
        version: "Version",
      },
    },
    nav: {
      ariaLabel: "Hauptnavigation",
      dashboard: "Dashboard",
      tools: "Werkzeuge",
    },
    common: {
      unavailable: "Nicht verfügbar",
      loading: "Lade neu...",
      retry: "Erneut laden",
      stale: "Veraltet",
      partially: "Teilweise",
      refreshing: "Aktualisierung läuft",
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
      social: {
        footer: "Markt, Netzwerk, Sentiment und Werkzeuge",
      },
      home: {
        path: "/",
        title: "Bitcoin Dashboard für Markt, Netzwerk und Sentiment",
        description:
          "Bitcoin-Dashboard mit Preis, Marktstruktur, Netzwerkdaten und Sentiment in einer ruhigen, Bitcoin-only Ansicht.",
        schemaName: "Bitcoin Dashboard",
        socialEyebrow: "Dashboard",
        socialTitle: "Bitcoin Dashboard",
        socialSummary:
          "Preis, Marktstruktur, Netzwerkdaten und Sentiment in einer klaren Bitcoin-only Ansicht.",
      },
      tools: {
        path: "/tools",
        title: "Bitcoin-Werkzeuge für DCA, Einstand und Entscheidungen",
        description:
          "Bitcoin-Werkzeuge für konkrete Entscheidungen. Den Anfang macht ein DCA-Rechner, der Einstand, Bestand und den Abstand zum aktuellen Marktpreis verständlich zeigt.",
        schemaName: "Bitcoin-Werkzeuge",
        socialEyebrow: "Werkzeuge",
        socialTitle: "Bitcoin-Werkzeuge",
        socialSummary:
          "Fokussierte Bitcoin-Werkzeuge für Einstand, Bestand und klare Entscheidungen statt überladener Werkzeug-Sammlungen.",
      },
      dca: {
        path: "/tools/dca-rechner",
        title: "Bitcoin DCA-Rechner für Durchschnittskaufpreis und Einstand",
        description:
          "Bitcoin DCA-Rechner zum Erfassen einzelner Käufe. Berechne Durchschnittskaufpreis, Bestand und den Vergleich zum aktuellen BTC-Marktpreis.",
        schemaName: "Bitcoin DCA-Rechner",
        socialEyebrow: "Werkzeug",
        socialTitle: "Bitcoin DCA-Rechner",
        socialSummary:
          "Bitcoin-Käufe erfassen, Durchschnittskaufpreis berechnen und den eigenen Einstand mit dem aktuellen Marktpreis vergleichen.",
      },
      imprint: {
        path: "/impressum",
        title: "Impressum",
        description: "Vorbereitete Platzhalterseite fuer das Impressum des Bitcoin Dashboards.",
        schemaName: "Impressum",
      },
      privacy: {
        path: "/datenschutz",
        title: "Datenschutz",
        description:
          "Vorbereitete Platzhalterseite fuer die Datenschutzhinweise des Bitcoin Dashboards.",
        schemaName: "Datenschutz",
      },
    },
    tools: {
      dca: {
        slug: "dca-rechner",
        title: "DCA-Rechner",
        category: "Direkt nutzbar",
        description:
          "Trag Käufe ein und sieh sofort Durchschnittspreis, Bestand und Marktvergleich.",
        href: "/tools/dca-rechner",
        tags: ["DCA", "Einstand", "Bestand"],
      },
      teaser: {
        meta: "Für schnelle Eingaben und klare Ergebnisse.",
        open: "Werkzeug öffnen",
      },
      page: {
        eyebrow: "Werkzeuge",
        title: "Werkzeuge, die wirklich helfen",
        description:
          "Weniger Auswahl, mehr Nutzen. Hier beginnen die Bitcoin-Werkzeuge, die du direkt verwenden kannst.",
        openFeatured: "DCA-Rechner öffnen",
        focusEyebrow: "Klarer Fokus",
        focusTitle: "Weniger reden, mehr nutzen",
        focusDescription: "Hier geht es nicht um mehr Inhalt, sondern um bessere Entscheidungen.",
        pillars: [
          {
            title: "Schnell erfassbar",
            description: "Jedes Werkzeug löst eine klare Aufgabe ohne Umwege.",
          },
          {
            title: "Direkt nützlich",
            description: "Du sollst nach wenigen Sekunden wissen, was dir die Zahl bringt.",
          },
          {
            title: "Bewusst klein",
            description: "Neue Tools kommen nur dazu, wenn sie wirklich fehlen.",
          },
        ],
        highlightEyebrow: "Jetzt ausprobieren",
        highlightTitle: "Der DCA-Rechner ist der Start",
        highlightDescription:
          "Trag deine Käufe ein und sieh sofort Einstand, Bestand und Abstand zum Marktpreis.",
        highlightLead:
          "Ideal, wenn du regelmäßig sats stackst und wissen willst, wo du gerade stehst.",
        highlightBody: "Klar, schnell und ohne Ballast.",
        listAriaLabel: "Verfügbare Werkzeuge",
        listEyebrow: "Aktuell live",
        listTitle: "Ein Werkzeug, das schon jetzt nützt",
        listDescription: "Der Bereich ist klein. Genau deshalb muss jedes Tool sitzen.",
        nextEyebrow: "Nächster Ausbau",
        nextTitle: "Mehr kommt später",
        nextDescription: "Neue Werkzeuge kommen erst, wenn sie einen echten Mehrwert bringen.",
        nextLead: "Kein Katalog. Ein kleines Set guter Bitcoin-Helfer.",
        nextBody: "Lieber ein starkes Werkzeug als zehn halbe.",
      },
      preview: {
        ariaLabel: "Werkzeugvorschau",
        eyebrow: "Werkzeuge",
        title: "Werkzeuge für den nächsten Schritt",
        description: "Wenn der Blick sitzt, helfen die Werkzeuge beim Rechnen und Einordnen.",
        pageLink: "Werkzeugseite",
        followUpEyebrow: "Weiterführend",
        followUpTitle: "Vom Blick zur Aktion",
        followUpDescription: "Hier wird aus Beobachtung eine konkrete Bitcoin-Entscheidung.",
        followUpLead: "Starte mit dem DCA-Rechner, wenn du Käufe sauber einordnen willst.",
        followUpBody:
          "Ein starkes Werkzeug reicht hier mehr als eine Rasterwand. Der nächste Schritt soll sofort klar sein.",
        openDca: "DCA-Rechner",
        allTools: "Alle Werkzeuge",
      },
    },
    home: {
      headerEyebrow: "bitstats.org",
      headerTitlePrefix: "Bitcoin verstehen,",
      headerTitleAccent: "bevor du weiterklickst",
      headerDescription:
        "Die ruhige Startseite für alle, die Bitcoin in wenigen Sekunden einordnen wollen.",
      introAriaLabel: "Seiteneinstieg und Aktualisierung",
      introBody:
        "Sieh in Sekunden, wo Bitcoin steht, wie der Markt wirkt und ob sich der nächste Klick lohnt.",
      heroBody:
        "Preis, Stimmung und Netzwerk in einer klaren Ansicht, damit du sofort erkennst, was gerade wichtig ist und wo sich der nächste Blick lohnt.",
      todayTitle: "Heute wichtig",
      todayDescription:
        "Drei Signale für den ersten Überblick: Preis, Stimmung und der Zustand des Netzwerks.",
      jumpToChart: "Zum Chart",
      jumpToTools: "Werkzeuge entdecken",
      benefits: [
        {
          title: "Markt auf einen Blick",
          description: "Spotpreis, 24h-Richtung und Verlauf ohne Umwege erfassen.",
        },
        {
          title: "Bewegung besser einordnen",
          description:
            "Stimmung und Marktkontext zeigen, ob der Markt eher nervös oder belastbar wirkt.",
        },
        {
          title: "Tiefer gehen, wenn es sich lohnt",
          description:
            "Netzwerkdaten und Werkzeuge warten genau dann, wenn du mehr als nur den Preis brauchst.",
        },
      ],
      snapshotEyebrow: "Schneller Einstieg",
      snapshotTitle: "Dein täglicher Bitcoin-Check",
      snapshotDescription:
        "Keine überladene Trading-Ansicht, sondern ein ruhiger Überblick für den ersten Blick des Tages.",
      snapshotPoints: [
        "Preis, Trend und Verlauf sofort sehen",
        "Stimmung und Marktumfeld ohne Overload einordnen",
        "Werkzeuge für den nächsten Schritt direkt erreichen",
      ],
    },
    dashboard: {
      contentAriaLabel: "Dashboard Bereiche",
      marketAndSentimentAriaLabel: "Marktkontext und Sentiment",
      marketAndSentimentEyebrow: "Marktumfeld",
      marketAndSentimentTitle: "Was den Preis gerade einordnet",
      marketAndSentimentDescription:
        "Stimmung und Marktgröße zeigen, ob Bewegung eher laut oder belastbar wirkt.",
      cycleAriaLabel: "Zyklus und Einordnung",
      cycleEyebrow: "Zyklus",
      cycleTitle: "Zyklus und Einordnung",
      cycleDescription:
        "ATH und Halving geben gemeinsam den ruhigeren Makroblick auf die aktuelle Bitcoin-Phase.",
      controlsAriaLabel: "Aktualisierung und Einstellungen",
      controls: {
        currencyAriaLabel: "Währung wählen",
        autoRefreshOn: "Live aktiv",
        autoRefreshOff: "Live pausiert",
        refreshNow: "Jetzt erneuern",
        refreshingView: "Ansicht wird erneuert...",
        statusLabel: "Aktualisierung:",
        everyMinute: "alle 60 Sekunden",
        paused: "pausiert",
        firstLoad:
          "Der erste Abruf läuft. Die Bereiche füllen sich, sobald die ersten Daten vorliegen.",
        stale:
          "Mindestens ein Bereich zeigt derzeit ältere Daten. Vorhandene Inhalte bleiben sichtbar.",
        partial:
          "Einzelne Bereiche liefern gerade unvollständige Werte. Der Rest bleibt weiter nutzbar.",
        refreshing: "Die aktuelle Ansicht bleibt während der Aktualisierung sichtbar.",
        persisted: "Deine Einstellungen bleiben auf diesem Gerät gespeichert.",
      },
      overview: {
        eyebrow: "Marktüberblick",
        title: "Bitcoin jetzt",
        description: "Preis zuerst. Hoch, Tief und 24h-Richtung direkt daneben.",
        spotLabel: "BTC Spotpreis ({currency})",
        spotMeta: "24h-Entwicklung zum aktuellen Spotpreis in {currency}",
        lead: "Preis zuerst. Alles andere nur, wenn es beim Einordnen hilft.",
        providerUpdated: "Letzte Anbieter-Aktualisierung: {value}",
        spotBadge: "BTC Spot",
        liveChartLabel: "Live-Verlauf",
        liveChartAriaLabel: "Bitcoin Live-Preisverlauf der letzten 30 Sekunden",
        liveChartEmpty: "Live-Verlauf wird aufgebaut.",
        liveWindow: "letzte 30 Sekunden",
        liveCoverageStart: "Start",
        liveCoverageEnd: "Ende",
        liveDeltaLabel: "(24h)",
        liveStatusActive: "Live-Preis aktualisiert sich laufend.",
        liveStatusConnecting: "Live-Stream wird verbunden.",
        liveStatusReconnecting: "Live-Stream verbindet sich erneut.",
        liveStatusFallback:
          "Live-Preis konnte gerade nicht erneuert werden. Letzter Wert bleibt sichtbar.",
        liveStatusConverted:
          "Live-Preis wird ueber BTC-USD bezogen und fortlaufend in {currency} umgerechnet.",
        liveStatusUnsupported:
          "Live-Ticker ist fuer {currency} derzeit nicht verfuegbar, weil keine stabile USD-Referenz fuer die Umrechnung vorliegt.",
        liveUpdated: "Live-Stand: {value}",
        highLabel: "24h Tageshoch ({currency})",
        highMeta: "Höchster Preis der letzten 24 Stunden.",
        highFootnote: "Zeigt, wie weit BTC heute nach oben gelaufen ist.",
        lowLabel: "24h Tagestief ({currency})",
        lowMeta: "Niedrigster Preis der letzten 24 Stunden.",
        lowFootnote: "Zeigt, wie tief BTC heute schon gefallen ist.",
        rankLabel: "Marktrang",
        rankMeta: "Position nach Marktkapitalisierung unter allen Coins.",
        rankFootnote: "Ordnet Bitcoin gegen den restlichen Kryptomarkt ein.",
      },
      ath: {
        eyebrow: "ATH-Kontext",
        title: "Der letzte Rekord als Referenz",
        description:
          "Das letzte Allzeithoch in {currency}, wie weit Bitcoin aktuell davon entfernt ist und wie lange der Rekord schon steht.",
        lastAthLabel: "Letztes ATH",
        lastAthMeta: "Rekord vom {value}",
        lastAthFootnote:
          "Das ist der bisher höchste erreichte Bitcoin-Preis in der aktiven Währung.",
        distanceLabel: "Abstand zum ATH",
        distanceMeta: "Prozentuale Distanz vom aktuellen Preis zum letzten Rekord.",
        distanceFootnote: "Zeigt, wie nah Bitcoin gerade am historischen Hoch notiert.",
        gapLabel: "Fehlt bis ATH",
        gapMeta: "Preisstrecke, die zum Erreichen des Rekords noch fehlt.",
        gapFootnote: "Hilft beim schnellen Einordnen der absoluten Distanz in der aktiven Währung.",
        daysSinceLabel: "Seit dem Rekord",
        daysSinceValue: "{value} Tage",
        daysSinceMeta: "So lange liegt das letzte Allzeithoch bereits zurück.",
        daysSinceFootnote:
          "Setzt die aktuelle Marktphase zeitlich ins Verhältnis zum letzten Hoch.",
      },
      halving: {
        eyebrow: "Halving",
        title: "Countdown bis zum nächsten Halving",
        description:
          "Ein eigener Blick auf den aktuellen Halving-Zyklus mit Restblöcken, Fortschritt und dem Zielblock.",
        countdownLabel: "Halving Countdown",
        blocksSuffix: "Blöcke",
        daysRemainingValue: "ca. {value} Tage verbleibend",
        progressValue: "{value} des Zyklus abgeschlossen",
        currentBlockLabel: "Aktueller Block",
        rewardChangeLabel: "Blockbelohnung",
        nextHalvingLabel: "Halving bei Block",
      },
      performance: {
        eyebrow: "Performance",
        title: "Bitcoin über mehrere Zeiträume",
        description:
          "Die prozentuale BTC-Performance in {currency} für wichtige Vergleichsfenster.",
        athDistanceLabel: "Abstand zum ATH",
        athDate: "ATH am {value}",
        athPrice: "ATH: {value}",
        referenceDate: "Seit {value}",
        referencePrice: "Referenz: {value}",
        structureTitle: "Marktstruktur",
        rangeHighLabel: "52W Hoch",
        rangeHighMeta: "Hoch vom {value}",
        rangeHighFootnote: "Abstand heute: {value}",
        rangeLowLabel: "52W Tief",
        rangeLowMeta: "Tief vom {value}",
        rangeLowFootnote: "Setzt das aktuelle Preisniveau gegen das letzte Jahrestief.",
        movingAverageLabel: "200D Durchschnitt",
        movingAverageMeta: "Gleitender Durchschnitt der letzten 200 Tage.",
        movingAverageFootnote: "Abstand zum 200D MA: {value}",
        volatility30dLabelSafe: "30D Volatilität",
        volatility90dLabelSafe: "90D Volatilität",
        volatility30dLabel: "30D Volatilität",
        volatility30dMeta: "Realisiert und auf Jahresbasis hochgerechnet.",
        volatility30dFootnote: "Zeigt, wie stark BTC in den letzten 30 Tagen geschwankt hat.",
        volatility90dLabel: "90D Volatilität",
        volatility90dMeta: "Realisiert und auf Jahresbasis hochgerechnet.",
        volatility90dFootnote: "Hilft, kurzfristige und breitere Marktunruhe zu vergleichen.",
        periods: {
          "7d": "7 Tage",
          "30d": "30 Tage",
          "90d": "90 Tage",
          "1y": "1 Jahr",
          ytd: "YTD",
        },
      },
      chart: {
        eyebrow: "Preisverlauf",
        title: "Bitcoin-Chart in {currency}",
        description: "So hat sich der BTC-Preis für {range} bewegt.",
        chooseRange: "Zeitraum wählen",
        chooseRangeAriaLabel: "Chart-Zeitraum wählen",
        preserveHint: "Beim Wechsel bleibt der letzte Verlauf sichtbar.",
        retryLabel: "Chart neu laden",
        emptyChart: "Keine Chartdaten vorhanden.",
        contextLabel: "Chart-Kontext",
        contextLine: "Bitcoin in {currency} über die {range}",
        contextCoverage: "Die Linie zeigt den Preisverlauf von {start} bis {end}.",
        lowInWindow: "Tief im Fenster",
        highInWindow: "Hoch im Fenster",
        latest: "Zuletzt",
        direction:
          "Leserichtung: links älter, rechts aktueller. Der markierte Punkt zeigt den letzten Kurs im gewählten Bereich.",
        timeWindow: "Zeitfenster: {start} bis {end}",
        ariaLabel: "Bitcoin-Preischart für {days} Tage in {currency}",
        axisContext:
          "Achsenkontext: unten Zeit, links Preisniveau. Die Skala passt sich automatisch an den gewählten Zeitraum an.",
        lastVisiblePoint: "Letzter sichtbarer Punkt: {value}",
        rangeLabel24h: "die letzten 24 Stunden",
        rangeLabel7d: "die letzten 7 Tage",
        rangeLabel30d: "die letzten 30 Tage",
        option1Helper: "Intraday",
        option7Helper: "Woche",
        option30Helper: "Monat",
      },
      marketContext: {
        eyebrow: "Marktkontext",
        title: "Marktgröße im Blick",
        description: "Marktgröße, Angebotsfortschritt und Bewertung in einem ruhigen Überblick.",
        marketCapLabel: "Marktkapitalisierung ({currency})",
        marketCapMeta: "Wert aller umlaufenden BTC.",
        marketCapFootnote: "Zeigt die Größe des Bitcoin-Markts.",
        volumeLabel: "24h Volumen ({currency})",
        volumeMeta: "Geschätztes Handelsvolumen der letzten 24 Stunden.",
        volumeFootnote: "Mehr Volumen heißt meist mehr echte Marktaktivität.",
        supplyLabel: "Umlaufende Menge",
        supplyMeta: "Bereits geminte BTC, die aktuell im Umlauf sind.",
        supplyCap: "Obergrenze: {value} BTC",
        supplyProgress: "{value} der maximalen Bitcoin-Menge sind im Umlauf.",
        fdvLabel: "Fully Diluted Valuation",
        fdvMeta: "Bewertung auf Basis der maximalen Bitcoin-Menge.",
        fdvFootnote: "Hilft, Marktwert und feste Angebotsgrenze zusammen zu lesen.",
        atlLabel: "ATL",
        atlMeta: "Tief vom {value}",
        atlFootnote: "Das markiert das bisherige Mehrjahrestief in der aktiven Währung.",
        atlDistanceLabel: "Abstand zum ATL",
        atlDistanceMeta: "Prozentuale Distanz vom aktuellen Preis zum Allzeittief.",
        atlDistanceFootnote:
          "Hilft einzuordnen, wie weit Bitcoin seit dem tiefsten Punkt gestiegen ist.",
        volumeMarketCapRatioLabel: "Volumen / Market Cap",
        volumeMarketCapRatioMeta: "24h Volumen relativ zur aktuellen Marktkapitalisierung.",
        volumeMarketCapRatioFootnote:
          "Gibt ein Gefühl dafür, wie viel Handelsaktivität relativ zur Marktgröße stattfindet.",
      },
      onChainActivity: {
        eyebrow: "On-Chain Aktivität",
        title: "Nutzung auf der Blockchain",
        description:
          "Aktive Adressen und Transaktionen ergänzen Fees und Mempool um reale Netzwerknutzung.",
        groups: {
          usage: "Nutzung",
          transfers: "Transferaktivität",
          holders: "Besitzstruktur",
          fees: "Fees",
        },
        activeAddressesLabel: "Aktive Adressen",
        activeAddressesMeta: "Letzter Tageswert aus der Coin Metrics Community API.",
        activeAddressesFootnote:
          "Zeigt, wie viele Adressen zuletzt aktiv am Netzwerk beteiligt waren.",
        activeAddressesChangeLabel: "Aktive Adressen 7d",
        activeAddressesChangeMeta: "Veränderung des letzten Tageswerts gegenüber vor 7 Tagen.",
        activeAddressesChangeFootnote:
          "Hilft, die aktuelle Nutzung gegen die jüngste Vorwoche zu lesen.",
        transactionCountLabel: "Transaktionsanzahl",
        transactionCountMeta: "Letzter Tageswert aus der Coin Metrics Community API.",
        transactionCountFootnote:
          "Zeigt, wie viele Transaktionen zuletzt on-chain bestätigt wurden.",
        transactionCountChangeLabel: "Transaktionen 7d",
        transferCountLabel: "Transfer Count",
        transferCountMeta: "Letzter Tageswert aus der Coin Metrics Community API.",
        transferCountFootnote:
          "Zeigt, wie viele Transfers zuletzt zwischen Entitäten auf der Kette stattfanden.",
        transfersPerTransactionLabel: "Transfers pro Transaktion",
        transfersPerTransactionMeta:
          "Verhältnis aus aktuellem Transfer Count zur aktuellen Transaktionsanzahl.",
        transfersPerTransactionFootnote:
          "Hilft einzuschätzen, wie viel tatsächliche Transferaktivität in einer Transaktion steckt.",
        nonZeroAddressesLabel: "Adressen mit Guthaben",
        nonZeroAddressesMeta: "Anzahl der Adressen mit positivem BTC-Bestand.",
        nonZeroAddressesFootnote:
          "Gibt einen einfachen Blick auf Verteilung und langfristige Nutzung.",
        nonZeroAddressesChangeLabel: "Non-zero Adressen 7d",
        nonZeroAddressesChangeMeta: "Veränderung der Adressen mit Guthaben gegenüber vor 7 Tagen.",
        nonZeroAddressesChangeFootnote:
          "Zeigt, ob die Zahl der gehaltenen Bestände zuletzt wächst oder sinkt.",
        dailyFeesLabel: "Fees pro Tag",
        dailyFeesMeta: "Gesamte bestätigte On-Chain-Fees des letzten Tages in BTC.",
        dailyFeesFootnote:
          "Ergänzt Fee-Empfehlungen um die tatsächlich bezahlten Tagesgebühren im Netzwerk.",
        dailyFeesAverage7dLabel: "Fees Ø 7d",
        dailyFeesAverage7dMeta: "7-Tage-Durchschnitt der bestätigten Tagesfees in BTC.",
        dailyFeesAverage7dFootnote:
          "Glättet Ausreißer und zeigt, auf welchem Gebührensockel das Netzwerk zuletzt lief.",
        transactionCountChangeMeta: "Veränderung des letzten Tageswerts gegenüber vor 7 Tagen.",
        transactionCountChangeFootnote:
          "Hilft beim schnellen Blick, ob die Aktivität gerade zunimmt oder abnimmt.",
      },
      network: {
        eyebrow: "Netzwerk",
        title: "Bitcoin im Netzwerk",
        description:
          "Hashrate, Schwierigkeit und Gebühren zeigen, wie belastet oder ruhig das Netzwerk gerade läuft.",
        statsCardTitle: "Netzwerk-Status",
        hashrateCardTitle: "Hashrate",
        difficultyCardTitle: "Schwierigkeit",
        halvingCardTitle: "Nächstes Halving",
        feesCardTitle: "Mempool-Gebühren",
        latestBlock: "Letzter Block",
        latestBlockMeta: "Zuletzt gesehene Blockhöhe.",
        latestBlockFootnote: "Steigt fortlaufend, wenn das Netzwerk sauber weiterläuft.",
        fastestFee: "Prioritäts-Fee",
        fastestFeeMeta: "Fee für schnelle Bestätigung.",
        fastestFeeFootnote: "Sinnvoll, wenn es möglichst bald durchgehen soll.",
        halfHourFee: "Fee in ca. 30 Minuten",
        halfHourFeeMeta: "Fee mit etwas Zeitpuffer.",
        halfHourFeeFootnote: "Gut für Zahlungen, die bald ankommen sollen.",
        hourFee: "Fee in ca. 60 Minuten",
        hourFeeMeta: "Niedrigere Fee mit mehr Geduld.",
        hourFeeFootnote: "Praktisch, wenn Kosten vor Tempo gehen.",
        hashrateCurrentLabel: "Hashrate",
        difficultyCurrentLabel: "Schwierigkeit",
        pendingTransactionsLabel: "Mempool",
        priorityFeeLabel: "Median-Fee",
        unconfirmedSizeLabel: "Unbestätigt MB",
        hashrateLowLabel: "30d Tief",
        hashrateHighLabel: "30d Hoch",
        hashrateAverageLabel: "30d Schnitt",
        epochCompleteLabel: "der Epoche abgeschlossen",
        halvingDaysRemainingLabel: "Tage bis Halving",
        halvingCycleCompleteLabel: "des aktuellen Zyklus geschafft",
        blocksLeftLabel: "Blöcke offen",
        estimatedDateLabel: "Geschätztes Datum",
        retargetLabel: "Nächste Anpassung",
        nextHalvingLabel: "Nächstes Halving",
        highPriorityLabel: "Hoch",
        mediumPriorityLabel: "Mittel",
        hourPriorityLabel: "60 Min",
        economyPriorityLabel: "Sparsam",
        minimumPriorityLabel: "Minimum",
        latestBlocksTitle: "Letzte Blöcke",
        latestBlocksEmpty: "Keine letzten Blöcke verfügbar.",
        blockAgeLabel: "Gefunden",
        blockSizeLabel: "Größe",
        projectedBlocksTitle: "Nächste Blöcke",
        activityCardTitle: "Blockfluss",
        averageBlockTimeLabel: "Ø Blockzeit",
        averageBlockTimeMeta: "Durchschnitt der letzten sichtbaren Blockabstände.",
        averageTransactionsPerBlockLabel: "Ø Transaktionen / Block",
        averageTransactionsPerBlockMeta:
          "Wie dicht die letzten Blöcke durchschnittlich gefüllt waren.",
        averageBlockSizeLabel: "Ø Blockgröße",
        averageBlockSizeMeta: "Hilft beim Einordnen der aktuellen Blockauslastung.",
        backlogBlocksLabel: "Backlog",
        backlogBlocksMeta: "Unbestätigter Rückstau als ungefähre Anzahl voller Blöcke.",
        backlogBlocksSuffix: "Blöcke",
        feeSpreadTitle: "Fee-Spreads",
        feeSpreadDescription: "Absolute Abstandsmaße zwischen den sichtbaren Fee-Stufen.",
        feeSpreadDetail:
          "Je größer der Abstand, desto stärker trennt der Markt gerade zwischen Geduld und Priorität.",
        fastestToHourSpreadLabel: "Priorität → 60 Min",
        hourToMinimumSpreadLabel: "60 Min → Minimum",
        fastestToMinimumSpreadLabel: "Priorität → Minimum",
        activityCardTitleSafe: "Blockfluss",
        averageBlockTimeLabelSafe: "Ø Blockzeit",
        averageBlockTimeMetaSafe: "Durchschnitt der letzten sichtbaren Blockabstände.",
        averageTransactionsPerBlockLabelSafe: "Ø Transaktionen / Block",
        averageTransactionsPerBlockMetaSafe:
          "Wie dicht die letzten Blöcke durchschnittlich gefüllt waren.",
        averageBlockSizeLabelSafe: "Ø Blockgröße",
        averageBlockSizeMetaSafe: "Hilft beim Einordnen der aktuellen Blockauslastung.",
        backlogBlocksLabelSafe: "Backlog",
        backlogBlocksMetaSafe: "Unbestätigter Rückstau als ungefähre Anzahl voller Blöcke.",
        backlogBlocksSuffixSafe: "Blöcke",
        feeSpreadTitleSafe: "Fee-Spreads",
        feeSpreadDescriptionSafe: "Absolute Abstandsmaße zwischen den sichtbaren Fee-Stufen.",
        feeSpreadDetailSafe:
          "Je größer der Abstand, desto stärker trennt der Markt gerade zwischen Geduld und Priorität.",
        fastestToHourSpreadLabelSafe: "Priorität → 60 Min",
        hourToMinimumSpreadLabelSafe: "60 Min → Minimum",
        fastestToMinimumSpreadLabelSafe: "Priorität → Minimum",
        transactionsSuffix: "Transaktionen",
      },
      sentiment: {
        eyebrow: "Sentiment",
        title: "Marktstimmung",
        description: "Fear & Greed zeigt, ob der Markt gerade eher nervös oder gierig ist.",
        scaleLabel: "Stimmungsskala",
        scaleHint: "Links liegt defensives Sentiment, rechts nimmt Risikoappetit und Euphorie zu.",
        indexLabel: "Fear & Greed Index",
        indexMeta: "Stimmungsindikator für das aktuelle Marktumfeld",
        currentZoneLabel: "Aktuelle Einordnung",
        average7dLabel: "Fear & Greed 7d",
        average7dMeta: "Durchschnitt der letzten 7 gemeldeten Indexwerte.",
        average7dFootnote: "Glättet Tagesausschläge und zeigt die jüngste Grundstimmung.",
        change7dLabel: "Fear & Greed 7d Delta",
        change7dMeta: "Veränderung des aktuellen Werts gegenüber vor 7 Tagen.",
        change7dFootnote: "Positiv heißt: der Markt ist zuletzt gieriger geworden.",
        weekContextLabel: "Wochenkontext",
        weekAboveAverage: "Aktuell über dem 7-Tage-Schnitt von {value}.",
        weekBelowAverage: "Aktuell unter dem 7-Tage-Schnitt von {value}.",
        weekNearAverage: "Aktuell nahe am 7-Tage-Schnitt von {value}.",
        nextUpdate: "Nächste Aktualisierung",
        nextUpdateHint: "Dann kommt der nächste Stimmungscheck.",
        sourceLabel: "Datenquelle",
        sourceHint: "Quelle des angezeigten Index.",
        zones: {
          extremeFear: {
            label: "Extreme Angst",
            description:
              "Der Markt wirkt sehr defensiv. Risiko wird gemieden und Unsicherheit dominiert.",
          },
          fear: {
            label: "Angst",
            description:
              "Das Umfeld bleibt vorsichtig. Marktteilnehmer reagieren zurückhaltender auf neue Impulse.",
          },
          neutral: {
            label: "Neutral",
            description:
              "Aktuell gibt es kein starkes emotionales Übergewicht. Der Markt wirkt vergleichsweise ausgeglichen.",
          },
          greed: {
            label: "Gier",
            description:
              "Optimismus ist vorhanden und Risikoappetit steigt, ohne zwingend schon extrem zu sein.",
          },
          extremeGreed: {
            label: "Extreme Gier",
            description:
              "Das Sentiment ist sehr heiß gelaufen. Euphorie dominiert und Rücksetzer werden oft leichter ausgeblendet.",
          },
          unknown: {
            label: "Ohne Einordnung",
            description:
              "Für den aktuellen Sentimentwert ist gerade keine eindeutige Einordnung verfügbar.",
          },
        },
      },
      metadata: {
        eyebrow: "Quellen und Zeitstempel",
        title: "Quellen und Aktualisierung",
        description:
          "Aktive Währung: {currency}. Kompakt, damit Quelle und letzter Stand schnell sichtbar bleiben.",
        sourcesTitle: "Datenquellen",
        refreshTitle: "Letzter Stand",
        activeCurrencyLabel: "Aktive Währung",
        dashboardUpdated: "Letzte Dashboard-Aktualisierung",
        marketSource: "Quelle Marktdaten",
        networkSource: "Quelle Netzwerk",
        sentimentSource: "Quelle Sentiment",
        chartSource: "Quelle Chart",
        marketUpdated: "Letzte Anbieter-Aktualisierung Markt",
        networkUpdated: "Letzte Aktualisierung Netzwerk",
        sentimentUpdated: "Letzte Aktualisierung Sentiment",
        chartUpdated: "Letzte Aktualisierung Chart",
      },
      stateCopy: {
        overview: {
          loading: {
            title: "Marktdaten werden geladen",
            description: "Preis, 24h-Bewegung und Handelsspanne werden vorbereitet.",
          },
          empty: {
            title: "Keine Marktdaten verfügbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktdaten.",
          },
          error: {
            title: "Marktdaten sind gerade nicht verfügbar",
            fallbackDescription: "Es konnten noch keine verlässlichen Marktdaten geladen werden.",
          },
          partial: {
            title: "Marktdaten sind teilweise verfügbar",
            description:
              "Einzelne Kennzahlen fehlen im aktuellen Abruf. Verfügbare Werte bleiben sichtbar.",
          },
          stale: {
            title: "Letzte Marktdaten bleiben sichtbar",
            description:
              "Die letzte Aktualisierung ist fehlgeschlagen. Die angezeigten Werte können inzwischen überholt sein.",
          },
        },
        ath: {
          loading: {
            title: "ATH-Kontext wird geladen",
            description: "Rekordpreis, Abstand und Zeitkontext werden vorbereitet.",
          },
          empty: {
            title: "Kein ATH-Kontext verfügbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine verwertbaren ATH-Daten.",
          },
          error: {
            title: "ATH-Kontext ist gerade nicht verfügbar",
            fallbackDescription: "Es konnten noch keine verlässlichen ATH-Daten geladen werden.",
          },
          partial: {
            title: "ATH-Kontext ist teilweise verfügbar",
            description:
              "Einzelne ATH-Werte fehlen im aktuellen Abruf. Verfügbare Hinweise bleiben sichtbar.",
          },
          stale: {
            title: "Letzter ATH-Kontext bleibt sichtbar",
            description:
              "Die Aktualisierung ist fehlgeschlagen. Die angezeigten ATH-Hinweise können inzwischen überholt sein.",
          },
        },
        halving: {
          loading: {
            title: "Halving-Countdown wird geladen",
            description:
              "Restblöcke, Fortschritt und die nächste Blockbelohnung werden vorbereitet.",
          },
          empty: {
            title: "Kein Halving-Kontext verfügbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine verwertbaren Halving-Werte.",
          },
          error: {
            title: "Halving-Kontext ist gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten noch keine verlässlichen Halving-Daten geladen werden.",
          },
          partial: {
            title: "Halving-Kontext ist teilweise verfügbar",
            description:
              "Einzelne Halving-Werte fehlen im aktuellen Abruf. Verfügbare Hinweise bleiben sichtbar.",
          },
          stale: {
            title: "Letzter Halving-Kontext bleibt sichtbar",
            description:
              "Die Aktualisierung ist fehlgeschlagen. Der angezeigte Countdown kann inzwischen ueberholt sein.",
          },
        },
        performance: {
          loading: {
            title: "Performance wird geladen",
            description: "Die BTC-Performance für mehrere Vergleichszeiträume wird vorbereitet.",
          },
          empty: {
            title: "Keine Performance verfügbar",
            description:
              "Der Abruf war erfolgreich, liefert aber aktuell keine auswertbaren Vergleichswerte.",
          },
          error: {
            title: "Performance ist gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten noch keine verlässlichen Performance-Daten geladen werden.",
          },
          partial: {
            title: "Performance ist teilweise verfügbar",
            description:
              "Einzelne Zeiträume fehlen im aktuellen Abruf. Verfügbare Werte bleiben sichtbar.",
          },
          stale: {
            title: "Letzte Performance bleibt sichtbar",
            description:
              "Die Aktualisierung ist fehlgeschlagen. Die angezeigten Vergleichswerte können inzwischen überholt sein.",
          },
        },
        chart: {
          loading: {
            title: "Chart wird vorbereitet",
            description:
              "Der Preisverlauf für den gewählten Zeitraum wird geladen und aufbereitet.",
          },
          empty: {
            title: "Keine Chartdaten verfügbar",
            description:
              "Für den ausgewählten Zeitraum liegen aktuell keine auswertbaren Kursdaten vor. Bitte wähle später erneut oder wechsle kurz den Zeitraum.",
          },
          error: {
            title: "Chart ist gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten gerade keine verlässlichen Chartdaten geladen werden. Ein erneuter Abruf versucht denselben Zeitraum noch einmal.",
          },
          partial: {
            title: "Chart ist teilweise verfügbar",
            description:
              "Ein Teil der Kursdaten fehlt im aktuellen Abruf. Der Verlauf bleibt sichtbar, kann im Detail aber Lücken enthalten.",
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
            title: "Kein Marktkontext verfügbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktmetriken.",
          },
          error: {
            title: "Marktkontext ist gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten noch keine verlässlichen Marktmetriken geladen werden.",
          },
          partial: {
            title: "Marktkontext ist teilweise verfügbar",
            description:
              "Einzelne Metriken fehlen im aktuellen Abruf. Verfügbare Werte bleiben sichtbar.",
          },
          stale: {
            title: "Letzter Marktkontext bleibt sichtbar",
            description:
              "Die Aktualisierung ist fehlgeschlagen. Die angezeigten Kennzahlen können inzwischen überholt sein.",
          },
        },
        onChainActivity: {
          loading: {
            title: "On-Chain Aktivität wird geladen",
            description: "Aktive Adressen und Transaktionszahlen werden vorbereitet.",
          },
          empty: {
            title: "Keine On-Chain Aktivität verfügbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine verwertbaren Aktivitätswerte.",
          },
          error: {
            title: "On-Chain Aktivität ist gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten noch keine verlässlichen Aktivitätsdaten geladen werden.",
          },
          partial: {
            title: "On-Chain Aktivität ist teilweise verfügbar",
            description:
              "Einzelne Aktivitätswerte fehlen im aktuellen Abruf. Verfügbare Werte bleiben sichtbar.",
          },
          stale: {
            title: "Letzte On-Chain Aktivität bleibt sichtbar",
            description:
              "Die Aktualisierung ist fehlgeschlagen. Die angezeigten Aktivitätswerte können inzwischen überholt sein.",
          },
        },
        network: {
          loading: {
            title: "Netzwerkdaten werden geladen",
            description: "Blockhöhe und Fee-Schätzungen werden vorbereitet.",
          },
          empty: {
            title: "Keine Netzwerkdaten verfügbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren On-Chain-Werte.",
          },
          error: {
            title: "Netzwerkdaten sind gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten noch keine verlässlichen Netzwerkdaten geladen werden.",
          },
          partial: {
            title: "Netzwerkdaten sind teilweise verfügbar",
            description:
              "Einzelne On-Chain-Werte fehlen im aktuellen Abruf. Verfügbare Kennzahlen bleiben sichtbar.",
          },
          stale: {
            title: "Letzte Netzwerkdaten bleiben sichtbar",
            description:
              "Die Aktualisierung hat nicht alle Werte erneuert. Die angezeigten Angaben können inzwischen überholt sein.",
          },
        },
        sentiment: {
          loading: {
            title: "Sentiment wird geladen",
            description: "Der Fear-and-Greed-Index wird vorbereitet.",
          },
          empty: {
            title: "Kein Sentiment verfügbar",
            description: "Der Anbieter liefert aktuell keine verwertbaren Werte für diesen Index.",
          },
          error: {
            title: "Sentiment ist gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten noch keine verlässlichen Sentimentdaten geladen werden.",
          },
          partial: {
            title: "Sentiment ist teilweise verfügbar",
            description:
              "Der aktuelle Abruf ist unvollständig. Vorhandene Hinweise bleiben sichtbar.",
          },
          stale: {
            title: "Letztes Sentiment bleibt sichtbar",
            description:
              "Es konnte kein neuer Indexstand geladen werden. Die Anzeige kann inzwischen überholt sein.",
          },
        },
        metadata: {
          loading: {
            title: "Quellenhinweise werden geladen",
            description: "Zeitstempel und Anbieterangaben werden vorbereitet.",
          },
          empty: {
            title: "Keine Quellenhinweise verfügbar",
            description:
              "Sobald die ersten Daten vorliegen, erscheinen hier Quellen und Aktualisierungszeiten.",
          },
          error: {
            title: "Quellenhinweise sind gerade nicht verfügbar",
            fallbackDescription:
              "Es konnten noch keine verlässlichen Hinweise zu Quellen und Zeitstempeln geladen werden.",
          },
          partial: {
            title: "Quellenhinweise sind teilweise verfügbar",
            description:
              "Einzelne Angaben fehlen noch. Vorhandene Quellenhinweise bleiben sichtbar.",
          },
          stale: {
            title: "Letzte Quellenhinweise bleiben sichtbar",
            description: "Die angezeigten Zeitstempel und Quellen können inzwischen überholt sein.",
          },
        },
        sanitizedErrors: {
          network: "Die Verbindung zum Datendienst ist gerade instabil. Bitte gleich erneut laden.",
          timeout: "Der Datendienst antwortet im Moment zu langsam. Bitte gleich erneut laden.",
          emptyResponse: "Der Datendienst liefert im Moment noch keine verwertbaren Angaben.",
        },
        persistentNotices: {
          networkCriticalLoss:
            "Wichtige Netzwerkdaten sind seit einigen Minuten nur eingeschränkt verfügbar. Vorhandene Kennzahlen bleiben sichtbar.",
          networkUnavailable:
            "Netzwerkdaten sind seit einigen Minuten nicht verlässlich verfügbar. Bitte später erneut laden.",
        },
        fallbacks: {
          overviewUnavailable: "Marktdaten sind gerade nicht verfügbar. Bitte später erneut laden.",
          performanceUnavailable:
            "Performance-Daten sind gerade nicht verfügbar. Bitte später erneut laden.",
          networkUnavailable:
            "Netzwerkdaten sind gerade nicht verfügbar. Bitte später erneut laden.",
          onChainActivityUnavailable:
            "On-Chain Aktivität ist gerade nicht verfügbar. Bitte später erneut laden.",
          sentimentUnavailable:
            "Sentimentdaten sind gerade nicht verfügbar. Bitte später erneut laden.",
          chartUnavailable: "Chartdaten sind gerade nicht verfügbar. Bitte später erneut laden.",
        },
      },
    },
    dca: {
      heroEyebrow: "Werkzeug",
      heroTitle: "DCA-Rechner für deinen Durchschnittspreis",
      heroDescription:
        "Erfasse deine Bitcoin-Käufe, behalte deinen Durchschnittspreis im Blick und vergleiche deinen Einstieg mit dem aktuellen Referenzpreis in {currency}.",
      marketDataEyebrow: "Marktdaten",
      marketDataTitle: "Aktueller Referenzpreis",
      marketPriceLine: "Marktpreis: {value} / BTC",
      currencyAriaLabel: "Werkzeugwährung",
      refreshPrice: "Preis erneuern",
      insightEyebrow: "Einordnung",
      primaryEmptyTitle: "Noch keine Käufe erfasst",
      primaryEmptyDescription:
        "Trage deinen ersten Kauf ein. Danach zeigt dir der Rechner automatisch deinen Durchschnittspreis, deinen BTC-Bestand und den Vergleich zum aktuellen Marktpreis.",
      primarySummaryDescription:
        "Das ist dein durchschnittlicher Einstieg pro Bitcoin auf Basis aller erfassten Käufe in der aktiven Währung.",
      primarySummaryTitle: "Dein durchschnittlicher Kaufpreis liegt bei {value} / BTC",
      performanceEmpty:
        "Sobald du Käufe erfasst hast, erscheint hier eine ruhige Einordnung statt nur einzelner Zahlen.",
      performanceMissingPrice:
        "Deine Kaufhistorie ist gespeichert. Für den heutigen Vergleich fehlt gerade nur ein aktueller Referenzpreis.",
      performancePositive:
        "Beim aktuellen Referenzpreis liegt dein Bestand rund {currentValue} wert und etwa {deltaValue} bzw. {deltaPercent} über deinem eingesetzten Kapital.",
      performanceNegative:
        "Beim aktuellen Referenzpreis liegt dein Bestand rund {currentValue} wert und etwa {deltaValue} bzw. {deltaPercent} unter deinem eingesetzten Kapital.",
      performanceNeutral:
        "Beim aktuellen Referenzpreis entspricht dein Bestand mit rund {currentValue} nahezu deinem eingesetzten Kapital.",
      investedLabel: "Bisher investiert",
      investedDescription: "Summe aller erfassten Käufe in {currency}.",
      bitcoinLabel: "Erhaltenes BTC",
      bitcoinDescription: "Berechnet aus Betrag und BTC-Preis jedes Kaufs.",
      averageLabel: "Durchschnittlicher Kaufpreis",
      averageDescription: "Dein rechnerischer Einstieg über alle Einträge hinweg.",
      currentPriceLabel: "Aktueller Vergleichspreis",
      currentPriceDescription: "Der zuletzt geladene BTC-Referenzpreis für diese Währung.",
      currentValueLabel: "Geschätzter Wert heute",
      currentValueDescription: "So viel wäre dein Bestand beim aktuellen Referenzpreis wert.",
      pnlLabel: "Abweichung zum Einsatz",
      marketState: {
        loadingTitle: "Referenzpreis wird geladen",
        loadingDescription: "Der aktuelle BTC-Preis für den Rechner wird vorbereitet.",
        emptyTitle: "Kein Referenzpreis verfügbar",
        emptyDescription:
          "Der Abruf war erfolgreich, liefert für die aktive Währung aber keinen verwendbaren Preis.",
        errorTitle: "Referenzpreis ist gerade nicht verfügbar",
        errorFallback:
          "Es konnte noch kein verlässlicher Marktpreis für den Rechner geladen werden.",
        partialTitle: "Referenzpreis ist teilweise verfügbar",
        partialDescription:
          "Der aktuelle Marktabruf ist unvollständig. Vorhandene Werte bleiben für den Rechner sichtbar.",
        staleTitle: "Letzter Referenzpreis bleibt sichtbar",
        staleDescription:
          "Die Aktualisierung ist fehlgeschlagen. Der angezeigte Preis kann inzwischen überholt sein.",
        loadError: "Der Referenzpreis konnte nicht geladen werden.",
      },
      formEyebrow: "Neuer Kauf",
      formTitle: "Kauf eintragen",
      formDescription:
        "Einträge werden automatisch nur in diesem Browser gespeichert. Jede Währung bleibt getrennt, damit deine Reihen sauber vergleichbar bleiben.",
      fields: {
        date: "Kaufdatum",
        dateHint: "Nutze das Datum, an dem der Kauf ausgeführt wurde.",
        amount: "Wie viel hast du investiert? ({currency})",
        amountHint: "Gib den Gesamtbetrag des Kaufs ein. Komma und Punkt werden akzeptiert.",
        bitcoinPrice: "Welcher BTC-Preis galt beim Kauf? ({currency})",
        bitcoinPriceHint:
          "Das ist der Preis pro 1 BTC zum Kaufzeitpunkt, nicht dein investierter Gesamtbetrag.",
        note: "Kurze Notiz (optional)",
        notePlaceholder: "z. B. Monatsrate März",
        noteHint: "Hilfreich für Erinnerungen wie Sparplan, Sonderkauf oder Rücksetzer.",
      },
      savePurchase: "Kauf speichern",
      persistenceNote: "Deine Liste bleibt auf diesem Gerät erhalten, bis du sie selbst löschst.",
      historyEyebrow: "Kaufhistorie",
      historySingular: "{count} Eintrag",
      historyPlural: "{count} Einträge",
      historyFilled: "Du siehst hier deine lokal gespeicherte {currency}-Kaufreihe.",
      historyEmpty: "Noch keine lokal gespeicherten Käufe in {currency}.",
      clearSeries: "{currency}-Reihe löschen",
      emptyStateTitle: "Deine {currency}-Kaufreihe ist noch leer",
      emptyStateDescription:
        "Sobald du den ersten Kauf einträgst, zeigt dir der Rechner deinen Durchschnittspreis, deinen BTC-Bestand und den heutigen Vergleichswert.",
      backToTools: "Zur Werkzeugseite",
      firstPurchase: "Ersten Kauf erfassen",
      rowInvested: "Investiert: {value}",
      rowBuyPrice: "Kaufpreis: {value} / BTC",
      rowBitcoinReceived: "BTC erhalten: {value}",
      rowRemove: "Entfernen",
      validation: {
        missingDate: "Bitte wähle das Kaufdatum aus.",
        invalidDate: "Bitte gib ein gültiges Kaufdatum an.",
        futureDate: "Das Kaufdatum darf nicht in der Zukunft liegen.",
        missingAmount: "Bitte gib ein, wie viel du investiert hast.",
        invalidAmount: "Der investierte Betrag muss größer als 0 sein.",
        missingBitcoinPrice: "Bitte gib den BTC-Preis zum Kaufzeitpunkt ein.",
        invalidBitcoinPrice: "Der BTC-Preis muss größer als 0 sein.",
      },
    },
    api: {
      requestFailed: "Anfrage fehlgeschlagen ({status}).",
      networkError: "Netzwerkfehler. Bitte später erneut versuchen.",
      emptyResponse: "Leere Antwort vom Server erhalten.",
    },
    legal: {
      imprint: {
        eyebrow: "Rechtliches",
        title: "Impressum",
        description:
          "Diese Seite ist als Platzhalter vorbereitet. Die finalen Anbieterangaben und Kontaktdaten werden hier ergaenzt.",
        bodyTitle: "In Vorbereitung",
        body: "Hier entsteht das vollstaendige Impressum fuer das Bitcoin Dashboard. Bis zur finalen Veroeffentlichung dient diese Seite als strukturierter Platzhalter.",
      },
      privacy: {
        eyebrow: "Rechtliches",
        title: "Datenschutz",
        description:
          "Diese Seite ist als Platzhalter vorbereitet. Die finalen Datenschutzhinweise und Informationen zur Datenverarbeitung werden hier ergaenzt.",
        bodyTitle: "In Vorbereitung",
        body: "Hier entstehen die Datenschutzhinweise fuer das Bitcoin Dashboard. Bis zur finalen Ausarbeitung dient diese Seite als strukturierter Platzhalter.",
      },
    },
  },
  en: {
    site: {
      name: "bitstats.org",
      tagline: "Bitcoin with calmer focus",
      languageSwitchLabel: "Switch language",
      themeSwitchToLight: "Switch to light mode",
      themeSwitchToDark: "Switch to dark mode",
      currencySwitchLabel: "Switch currency",
      currencySearchLabel: "Search currency",
      currencySearchPlaceholder: "Enter code or name",
      currencyCloseLabel: "Close currency menu",
      currencyRecentLabel: "Recently used",
      currencyScopeLabel: "Show",
      currencyScopeFiatOnly: "Fiat only",
      currencyScopeAllQuotes: "All incl. crypto",
      currencyPopularLabel: "Popular",
      currencyAllLabel: "All available currencies",
      currencyNoResults: "No matching currency found.",
      footer: {
        description: "A calmer Bitcoin view of market, network, sentiment, and focused tools.",
        navigation: "Navigation",
        legal: "Legal",
        dashboard: "Go to dashboard",
        tools: "Go to tools",
        imprint: "Imprint",
        privacy: "Privacy",
        version: "Version",
      },
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
      social: {
        footer: "Market, network, sentiment, and tools",
      },
      home: {
        path: "/",
        title: "Bitcoin Dashboard for Market, Network, and Sentiment",
        description:
          "Bitcoin dashboard with price, market structure, network data, and sentiment in a calm Bitcoin-only view.",
        schemaName: "Bitcoin Dashboard",
        socialEyebrow: "Dashboard",
        socialTitle: "Bitcoin Dashboard",
        socialSummary:
          "Price, market structure, network data, and sentiment in a calm Bitcoin-only view.",
      },
      tools: {
        path: "/tools",
        title: "Bitcoin Tools for DCA, Cost Basis, and Decisions",
        description:
          "Bitcoin tools for concrete decisions. It starts with a DCA calculator that makes cost basis, holdings, and distance to the current market price easy to understand.",
        schemaName: "Bitcoin Tools",
        socialEyebrow: "Tools",
        socialTitle: "Bitcoin Tools",
        socialSummary:
          "Focused Bitcoin tools for cost basis, holdings, and clearer decisions without overloaded tool catalogs.",
      },
      dca: {
        path: "/tools/dca-rechner",
        title: "Bitcoin DCA Calculator for Average Buy Price and Cost Basis",
        description:
          "Bitcoin DCA calculator for tracking individual buys. Calculate average buy price, holdings, and compare your position against the current BTC market price.",
        schemaName: "Bitcoin DCA Calculator",
        socialEyebrow: "Tool",
        socialTitle: "Bitcoin DCA Calculator",
        socialSummary:
          "Track Bitcoin buys, calculate average buy price, and compare your entry with the current market price.",
      },
      imprint: {
        path: "/impressum",
        title: "Imprint",
        description: "Prepared placeholder page for the Bitcoin Dashboard imprint.",
        schemaName: "Imprint",
      },
      privacy: {
        path: "/datenschutz",
        title: "Privacy",
        description: "Prepared placeholder page for the Bitcoin Dashboard privacy notice.",
        schemaName: "Privacy",
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
        focusDescription: "This is not about more content. It is about better decisions.",
        pillars: [
          {
            title: "Quick to grasp",
            description: "Each tool solves one clear job without detours.",
          },
          {
            title: "Immediately useful",
            description: "You should know within seconds what value a number gives you.",
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
        nextDescription: "New tools only arrive when they add real value.",
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
        followUpLead: "Start with the DCA Calculator if you want to understand your buys cleanly.",
        followUpBody:
          "One strong tool matters here more than a grid of options. The next step should be clear immediately.",
        openDca: "DCA Calculator",
        allTools: "All tools",
      },
    },
    home: {
      headerEyebrow: "bitstats.org",
      headerTitlePrefix: "Understand Bitcoin",
      headerTitleAccent: "before you click further",
      headerDescription:
        "A calm starting point for anyone who wants to size up Bitcoin in a few seconds.",
      introAriaLabel: "Page intro and refresh controls",
      introBody:
        "See in seconds where Bitcoin stands, how the market feels, and whether the next click is worth it.",
      heroBody:
        "Price, sentiment, and network in one focused view so you can spot what matters now and decide where to dig deeper.",
      todayTitle: "Today matters",
      todayDescription:
        "Three signals for the first read: price, sentiment, and how the network feels right now.",
      jumpToChart: "Jump to chart",
      jumpToTools: "Explore tools",
      benefits: [
        {
          title: "Read the market fast",
          description: "See spot price, 24h direction, and the latest move without extra noise.",
        },
        {
          title: "Add context right away",
          description: "Sentiment and market context show whether the move looks shaky or durable.",
        },
        {
          title: "Go deeper when needed",
          description:
            "Network data and tools are ready when you want more than just the headline price.",
        },
      ],
      snapshotEyebrow: "Quick start",
      snapshotTitle: "Your daily Bitcoin check",
      snapshotDescription:
        "Not an overloaded trading screen, but a calm overview for the first Bitcoin look of the day.",
      snapshotPoints: [
        "See price, trend, and chart instantly",
        "Place sentiment and market context without overload",
        "Reach the next-step tools right away",
      ],
    },
    dashboard: {
      contentAriaLabel: "Dashboard sections",
      marketAndSentimentAriaLabel: "Market context and sentiment",
      marketAndSentimentEyebrow: "Market context",
      marketAndSentimentTitle: "What gives the price context right now",
      marketAndSentimentDescription:
        "Sentiment and market size help show whether a move looks noisy or durable.",
      cycleAriaLabel: "Cycle and framing",
      cycleEyebrow: "Cycle",
      cycleTitle: "Cycle and framing",
      cycleDescription:
        "ATH and halving together provide the calmer macro read on Bitcoin's current phase.",
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
        stale: "At least one section currently shows older data. Existing content stays visible.",
        partial: "Some sections currently return incomplete values. The rest remains usable.",
        refreshing: "The current view stays visible while refreshing.",
        persisted: "Your settings stay saved on this device.",
      },
      overview: {
        eyebrow: "Market overview",
        title: "Bitcoin now",
        description: "Price first. High, low, and 24h direction right beside it.",
        spotLabel: "BTC spot price ({currency})",
        spotMeta: "24h move for the current spot price in {currency}",
        lead: "Price first. Everything else only when it helps with context.",
        providerUpdated: "Latest provider update: {value}",
        spotBadge: "BTC Spot",
        liveChartLabel: "Live trace",
        liveChartAriaLabel: "Bitcoin live price trace for the last 30 seconds",
        liveChartEmpty: "Building live trace.",
        liveWindow: "last 30 seconds",
        liveCoverageStart: "Start",
        liveCoverageEnd: "End",
        liveDeltaLabel: "(24h)",
        liveStatusActive: "Live price is updating continuously.",
        liveStatusConnecting: "Connecting live stream.",
        liveStatusReconnecting: "Reconnecting live stream.",
        liveStatusFallback:
          "Live price could not be refreshed right now. The last value stays visible.",
        liveStatusConverted:
          "Live price is sourced from BTC-USD and continuously converted into {currency}.",
        liveStatusUnsupported:
          "Live ticker is currently unavailable for {currency} because no stable USD reference is available for conversion.",
        liveUpdated: "Live status: {value}",
        highLabel: "24h high ({currency})",
        highMeta: "Highest price in the last 24 hours.",
        highFootnote: "Shows how far BTC has moved up today.",
        lowLabel: "24h low ({currency})",
        lowMeta: "Lowest price in the last 24 hours.",
        lowFootnote: "Shows how far BTC has already dropped today.",
        rankLabel: "Market rank",
        rankMeta: "Position by market cap across all tracked coins.",
        rankFootnote: "Places Bitcoin against the broader crypto market.",
      },
      ath: {
        eyebrow: "ATH context",
        title: "The last record as a reference",
        description:
          "The last all-time high in {currency}, how far Bitcoin currently sits below it, and how long that record has been standing.",
        lastAthLabel: "Latest ATH",
        lastAthMeta: "Record from {value}",
        lastAthFootnote: "This is the highest Bitcoin price reached so far in the active currency.",
        distanceLabel: "Distance to ATH",
        distanceMeta: "Percentage distance from the current price to the last record.",
        distanceFootnote: "Shows how close Bitcoin is currently trading to its historical high.",
        gapLabel: "Needed for ATH",
        gapMeta: "Price distance still missing to reclaim the record.",
        gapFootnote: "Helps frame the absolute gap in the active currency.",
        daysSinceLabel: "Since the record",
        daysSinceValue: "{value} days",
        daysSinceMeta: "How long ago the latest all-time high was set.",
        daysSinceFootnote: "Places the current market phase in time relative to the last peak.",
      },
      halving: {
        eyebrow: "Halving",
        title: "Countdown to the next halving",
        description:
          "A dedicated read on the current halving cycle with remaining blocks, progress, and the target block.",
        countdownLabel: "Halving Countdown",
        blocksSuffix: "blocks",
        daysRemainingValue: "about {value} days remaining",
        progressValue: "{value} complete",
        currentBlockLabel: "Current block",
        rewardChangeLabel: "Reward",
        nextHalvingLabel: "Next halving",
      },
      performance: {
        eyebrow: "Performance",
        title: "Bitcoin across key timeframes",
        description:
          "BTC percentage performance in {currency} across the comparison windows that matter most.",
        athDistanceLabel: "Distance to ATH",
        athDate: "ATH on {value}",
        athPrice: "ATH: {value}",
        referenceDate: "Since {value}",
        referencePrice: "Reference: {value}",
        structureTitle: "Market structure",
        rangeHighLabel: "52w high",
        rangeHighMeta: "High on {value}",
        rangeHighFootnote: "Distance today: {value}",
        rangeLowLabel: "52w low",
        rangeLowMeta: "Low on {value}",
        rangeLowFootnote: "Sets today's price level against the lowest point of the last year.",
        movingAverageLabel: "200d average",
        movingAverageMeta: "Moving average across the last 200 days.",
        movingAverageFootnote: "Distance to the 200d MA: {value}",
        volatility30dLabelSafe: "30d volatility",
        volatility90dLabelSafe: "90d volatility",
        volatility30dLabel: "30d volatility",
        volatility30dMeta: "Realized and annualized.",
        volatility30dFootnote: "Shows how strongly BTC moved over the last 30 days.",
        volatility90dLabel: "90d volatility",
        volatility90dMeta: "Realized and annualized.",
        volatility90dFootnote: "Useful for comparing shorter-term and broader market turbulence.",
        periods: {
          "7d": "7 days",
          "30d": "30 days",
          "90d": "90 days",
          "1y": "1 year",
          ytd: "YTD",
        },
      },
      chart: {
        eyebrow: "Price action",
        title: "Bitcoin chart in {currency}",
        description: "This is how BTC moved over {range}.",
        chooseRange: "Choose range",
        chooseRangeAriaLabel: "Choose chart range",
        preserveHint: "When switching, the last visible line stays on screen.",
        retryLabel: "Reload chart",
        emptyChart: "No chart data available.",
        contextLabel: "Chart context",
        contextLine: "Bitcoin in {currency} over {range}",
        contextCoverage: "The line shows price action from {start} to {end}.",
        lowInWindow: "Window low",
        highInWindow: "Window high",
        latest: "Latest",
        direction:
          "Reading direction: older on the left, newer on the right. The marker shows the latest visible price in the selected range.",
        timeWindow: "Time window: {start} to {end}",
        ariaLabel: "Bitcoin price chart for {days} days in {currency}",
        axisContext:
          "Axis context: time at the bottom, price level on the left. The scale adjusts automatically to the selected range.",
        lastVisiblePoint: "Last visible point: {value}",
        rangeLabel24h: "the last 24 hours",
        rangeLabel7d: "the last 7 days",
        rangeLabel30d: "the last 30 days",
        option1Helper: "Intraday",
        option7Helper: "Week",
        option30Helper: "Month",
      },
      marketContext: {
        eyebrow: "Market context",
        title: "Market size at a glance",
        description: "A calm read on market size, supply progress, and valuation.",
        marketCapLabel: "Market cap ({currency})",
        marketCapMeta: "Value of all circulating BTC.",
        marketCapFootnote: "Shows the size of the Bitcoin market.",
        volumeLabel: "24h volume ({currency})",
        volumeMeta: "Estimated trading volume over the last 24 hours.",
        volumeFootnote: "More volume usually means more real market activity.",
        supplyLabel: "Circulating supply",
        supplyMeta: "BTC already mined and currently in circulation.",
        supplyCap: "Cap: {value} BTC",
        supplyProgress: "{value} of Bitcoin's maximum supply is already circulating.",
        fdvLabel: "Fully diluted valuation",
        fdvMeta: "Valuation based on Bitcoin's maximum supply.",
        fdvFootnote: "Adds supply context to the current market value.",
        atlLabel: "ATL",
        atlMeta: "Low on {value}",
        atlFootnote: "Marks the lowest historically recorded BTC price in the active currency.",
        atlDistanceLabel: "Distance to ATL",
        atlDistanceMeta: "Percentage distance from the current price to the all-time low.",
        atlDistanceFootnote:
          "Useful for framing how far Bitcoin has moved away from its deepest low.",
        volumeMarketCapRatioLabel: "Volume / market cap",
        volumeMarketCapRatioMeta: "24h volume relative to the current market capitalization.",
        volumeMarketCapRatioFootnote:
          "Gives quick context for trading activity relative to market size.",
      },
      onChainActivity: {
        eyebrow: "On-chain activity",
        title: "Usage on the blockchain",
        description:
          "Active addresses and transaction count complement fees and mempool pressure with real usage.",
        groups: {
          usage: "Usage",
          transfers: "Transfer activity",
          holders: "Holder structure",
          fees: "Fees",
        },
        activeAddressesLabel: "Active addresses",
        activeAddressesMeta: "Latest daily value from the Coin Metrics Community API.",
        activeAddressesFootnote: "Shows how many addresses were recently active on the network.",
        activeAddressesChangeLabel: "Active addresses 7d",
        activeAddressesChangeMeta: "Change from the latest daily value versus 7 days ago.",
        activeAddressesChangeFootnote: "Helps compare current usage against the recent week.",
        transactionCountLabel: "Transaction count",
        transactionCountMeta: "Latest daily value from the Coin Metrics Community API.",
        transactionCountFootnote: "Shows how many transactions were recently confirmed on-chain.",
        transactionCountChangeLabel: "Transactions 7d",
        transferCountLabel: "Transfer count",
        transferCountMeta: "Latest daily value from the Coin Metrics Community API.",
        transferCountFootnote: "Shows how many transfers recently moved between entities on-chain.",
        transfersPerTransactionLabel: "Transfers per transaction",
        transfersPerTransactionMeta:
          "Ratio of the latest transfer count to the latest transaction count.",
        transfersPerTransactionFootnote:
          "Helps estimate how much underlying transfer activity each transaction currently carries.",
        nonZeroAddressesLabel: "Addresses with balance",
        nonZeroAddressesMeta: "Number of addresses currently holding a positive BTC balance.",
        nonZeroAddressesFootnote: "A simple read on distribution and longer-term usage breadth.",
        nonZeroAddressesChangeLabel: "Non-zero addresses 7d",
        nonZeroAddressesChangeMeta: "Change in funded addresses compared with 7 days ago.",
        nonZeroAddressesChangeFootnote:
          "Shows whether the count of funded addresses has recently been expanding or shrinking.",
        dailyFeesLabel: "Daily fees",
        dailyFeesMeta: "Total confirmed on-chain fees from the latest day in BTC.",
        dailyFeesFootnote:
          "Complements fee recommendations with the total fees users actually paid.",
        dailyFeesAverage7dLabel: "Fees avg 7d",
        dailyFeesAverage7dMeta: "7-day average of confirmed daily fees in BTC.",
        dailyFeesAverage7dFootnote:
          "Smooths out spikes and shows the recent fee baseline of the network.",
        transactionCountChangeMeta: "Change from the latest daily value versus 7 days ago.",
        transactionCountChangeFootnote:
          "Helpful for spotting whether on-chain activity is picking up or cooling off.",
      },
      network: {
        eyebrow: "Network",
        title: "Bitcoin on the network",
        description:
          "Hashrate, difficulty, and fees show how calm or crowded the network feels right now.",
        statsCardTitle: "Network Status",
        hashrateCardTitle: "Hashrate",
        difficultyCardTitle: "Difficulty",
        halvingCardTitle: "Next halving",
        feesCardTitle: "Mempool Fees",
        latestBlock: "Latest block",
        latestBlockMeta: "Most recently seen block height.",
        latestBlockFootnote: "Keeps rising when the network continues to move cleanly.",
        fastestFee: "Priority fee",
        fastestFeeMeta: "Fee for fast confirmation.",
        fastestFeeFootnote: "Useful when it should confirm as soon as possible.",
        halfHourFee: "Fee in about 30 minutes",
        halfHourFeeMeta: "Fee with a little time buffer.",
        halfHourFeeFootnote: "Good for payments that should arrive soon.",
        hourFee: "Fee in about 60 minutes",
        hourFeeMeta: "Lower fee with more patience.",
        hourFeeFootnote: "Useful when cost matters more than speed.",
        hashrateCurrentLabel: "Hashrate",
        difficultyCurrentLabel: "Difficulty",
        pendingTransactionsLabel: "Mempool",
        priorityFeeLabel: "Median fee",
        unconfirmedSizeLabel: "Unconfirmed MB",
        hashrateLowLabel: "30d low",
        hashrateHighLabel: "30d high",
        hashrateAverageLabel: "30d avg",
        epochCompleteLabel: "of epoch complete",
        halvingDaysRemainingLabel: "Days to halving",
        halvingCycleCompleteLabel: "of the current cycle complete",
        blocksLeftLabel: "Blocks left",
        estimatedDateLabel: "Est. date",
        retargetLabel: "Retarget",
        nextHalvingLabel: "Next halving",
        highPriorityLabel: "High",
        mediumPriorityLabel: "Med",
        hourPriorityLabel: "60m",
        economyPriorityLabel: "Economy",
        minimumPriorityLabel: "Minimum",
        latestBlocksTitle: "Latest blocks",
        latestBlocksEmpty: "No recent blocks available.",
        blockAgeLabel: "Found",
        blockSizeLabel: "Size",
        projectedBlocksTitle: "Next blocks",
        activityCardTitle: "Block flow",
        averageBlockTimeLabel: "Avg block time",
        averageBlockTimeMeta: "Average spacing between the latest visible blocks.",
        averageTransactionsPerBlockLabel: "Avg tx / block",
        averageTransactionsPerBlockMeta:
          "Shows how densely the latest blocks were filled on average.",
        averageBlockSizeLabel: "Avg block size",
        averageBlockSizeMeta: "Helps frame the current level of block utilization.",
        backlogBlocksLabel: "Backlog",
        backlogBlocksMeta: "Unconfirmed queue expressed as an approximate number of full blocks.",
        backlogBlocksSuffix: "blocks",
        feeSpreadTitle: "Fee spreads",
        feeSpreadDescription: "Absolute spacing between the visible fee lanes.",
        feeSpreadDetail:
          "Wider spreads usually mean the market is pricing urgency more aggressively.",
        fastestToHourSpreadLabel: "Priority → 60m",
        hourToMinimumSpreadLabel: "60m → minimum",
        fastestToMinimumSpreadLabel: "Priority → minimum",
        activityCardTitleSafe: "Block flow",
        averageBlockTimeLabelSafe: "Avg block time",
        averageBlockTimeMetaSafe: "Average spacing between the latest visible blocks.",
        averageTransactionsPerBlockLabelSafe: "Avg tx / block",
        averageTransactionsPerBlockMetaSafe:
          "Shows how densely the latest blocks were filled on average.",
        averageBlockSizeLabelSafe: "Avg block size",
        averageBlockSizeMetaSafe: "Helps frame the current level of block utilization.",
        backlogBlocksLabelSafe: "Backlog",
        backlogBlocksMetaSafe:
          "Unconfirmed queue expressed as an approximate number of full blocks.",
        backlogBlocksSuffixSafe: "blocks",
        feeSpreadTitleSafe: "Fee spreads",
        feeSpreadDescriptionSafe: "Absolute spacing between the visible fee lanes.",
        feeSpreadDetailSafe:
          "Wider spreads usually mean the market is pricing urgency more aggressively.",
        fastestToHourSpreadLabelSafe: "Priority to 60m",
        hourToMinimumSpreadLabelSafe: "60m to minimum",
        fastestToMinimumSpreadLabelSafe: "Priority to minimum",
        transactionsSuffix: "tx",
      },
      sentiment: {
        eyebrow: "Sentiment",
        title: "Market mood",
        description: "Fear & Greed shows whether the market is currently more nervous or greedy.",
        scaleLabel: "Sentiment scale",
        scaleHint:
          "The left side reflects caution, while the right side points to stronger risk appetite.",
        indexLabel: "Fear & Greed Index",
        indexMeta: "Sentiment indicator for the current market backdrop",
        currentZoneLabel: "Current zone",
        average7dLabel: "Fear & Greed 7d",
        average7dMeta: "Average across the last 7 reported index values.",
        average7dFootnote: "Smooths out day-to-day noise and shows the recent baseline mood.",
        change7dLabel: "Fear & Greed 7d delta",
        change7dMeta: "Change from the current value versus 7 days ago.",
        change7dFootnote: "Positive means the market turned greedier over the last week.",
        weekContextLabel: "Weekly context",
        weekAboveAverage: "Currently above the 7-day average of {value}.",
        weekBelowAverage: "Currently below the 7-day average of {value}.",
        weekNearAverage: "Currently close to the 7-day average of {value}.",
        nextUpdate: "Next update",
        nextUpdateHint: "That is when the next sentiment check arrives.",
        sourceLabel: "Data source",
        sourceHint: "Source of the displayed index.",
        zones: {
          extremeFear: {
            label: "Extreme fear",
            description:
              "The market is deeply defensive right now. Risk appetite is low and uncertainty is in control.",
          },
          fear: {
            label: "Fear",
            description:
              "The backdrop stays cautious. Market participants react more carefully to fresh upside.",
          },
          neutral: {
            label: "Neutral",
            description:
              "There is no clear emotional bias at the moment. The market looks comparatively balanced.",
          },
          greed: {
            label: "Greed",
            description:
              "Optimism is building and traders are leaning into risk, without necessarily looking overheated yet.",
          },
          extremeGreed: {
            label: "Extreme greed",
            description:
              "Sentiment is running hot. Euphoria leads and pullback risk is easier to underestimate.",
          },
          unknown: {
            label: "Unclassified",
            description:
              "There is not enough reliable context right now to place the current reading.",
          },
        },
      },
      metadata: {
        eyebrow: "Sources and timestamps",
        title: "Sources and refresh",
        description:
          "Active currency: {currency}. Compact, so the source and the latest state stay visible at a glance.",
        sourcesTitle: "Data sources",
        refreshTitle: "Latest state",
        activeCurrencyLabel: "Active currency",
        dashboardUpdated: "Latest dashboard refresh",
        marketSource: "Market source",
        networkSource: "Network source",
        sentimentSource: "Sentiment source",
        chartSource: "Chart source",
        marketUpdated: "Latest provider update for market",
        networkUpdated: "Latest network update",
        sentimentUpdated: "Latest sentiment update",
        chartUpdated: "Latest chart update",
      },
      stateCopy: {
        overview: {
          loading: {
            title: "Loading market data",
            description: "Price, 24h move, and range are being prepared.",
          },
          empty: {
            title: "No market data available",
            description: "The fetch succeeded, but there is no usable market data right now.",
          },
          error: {
            title: "Market data is currently unavailable",
            fallbackDescription: "No reliable market data could be loaded yet.",
          },
          partial: {
            title: "Market data is partially available",
            description:
              "Some metrics are missing in the current fetch. Available values stay visible.",
          },
          stale: {
            title: "Latest market data stays visible",
            description: "The latest refresh failed. The visible values may now be outdated.",
          },
        },
        ath: {
          loading: {
            title: "Loading ATH context",
            description: "Record price, distance, and time context are being prepared.",
          },
          empty: {
            title: "No ATH context available",
            description: "The fetch succeeded, but there is no usable ATH data right now.",
          },
          error: {
            title: "ATH context is currently unavailable",
            fallbackDescription: "No reliable ATH data could be loaded yet.",
          },
          partial: {
            title: "ATH context is partially available",
            description:
              "Some ATH values are missing in the current fetch. Available hints stay visible.",
          },
          stale: {
            title: "Latest ATH context stays visible",
            description: "The refresh failed. The displayed ATH hints may now be outdated.",
          },
        },
        halving: {
          loading: {
            title: "Loading halving countdown",
            description: "Remaining blocks, progress, and the reward change are being prepared.",
          },
          empty: {
            title: "No halving context available",
            description: "The fetch succeeded, but there is no usable halving data right now.",
          },
          error: {
            title: "Halving context is currently unavailable",
            fallbackDescription: "No reliable halving data could be loaded yet.",
          },
          partial: {
            title: "Halving context is partially available",
            description:
              "Some halving values are missing in the current fetch. Available hints stay visible.",
          },
          stale: {
            title: "Latest halving context stays visible",
            description: "The refresh failed. The displayed halving countdown may now be outdated.",
          },
        },
        performance: {
          loading: {
            title: "Loading performance",
            description: "BTC performance across multiple comparison windows is being prepared.",
          },
          empty: {
            title: "No performance available",
            description:
              "The fetch succeeded, but there are currently no usable comparison values.",
          },
          error: {
            title: "Performance is currently unavailable",
            fallbackDescription: "No reliable performance data could be loaded yet.",
          },
          partial: {
            title: "Performance is partially available",
            description:
              "Some timeframes are missing in the current fetch. Available values stay visible.",
          },
          stale: {
            title: "Latest performance stays visible",
            description: "The refresh failed. The displayed comparison values may now be outdated.",
          },
        },
        chart: {
          loading: {
            title: "Preparing chart",
            description: "Price action for the selected range is loading and being processed.",
          },
          empty: {
            title: "No chart data available",
            description:
              "There is currently no usable price data for the selected range. Please try again later or switch the range briefly.",
          },
          error: {
            title: "Chart is currently unavailable",
            fallbackDescription:
              "No reliable chart data could be loaded right now. A retry will request the same range again.",
          },
          partial: {
            title: "Chart is partially available",
            description:
              "Some price points are missing in the current fetch. The line remains visible but may contain gaps.",
          },
          stale: {
            title: "Latest chart stays visible",
            description:
              "The chart could not be refreshed. The last usable line stays visible until new market data arrives.",
          },
        },
        marketContext: {
          loading: {
            title: "Loading market context",
            description: "Market cap and trading volume are being prepared.",
          },
          empty: {
            title: "No market context available",
            description: "The fetch succeeded, but there are no usable market metrics right now.",
          },
          error: {
            title: "Market context is currently unavailable",
            fallbackDescription: "No reliable market metrics could be loaded yet.",
          },
          partial: {
            title: "Market context is partially available",
            description:
              "Some metrics are missing in the current fetch. Available values stay visible.",
          },
          stale: {
            title: "Latest market context stays visible",
            description: "The refresh failed. The displayed metrics may now be outdated.",
          },
        },
        onChainActivity: {
          loading: {
            title: "Loading on-chain activity",
            description: "Active addresses and transaction counts are being prepared.",
          },
          empty: {
            title: "No on-chain activity available",
            description: "The fetch succeeded, but there are no usable activity metrics right now.",
          },
          error: {
            title: "On-chain activity is currently unavailable",
            fallbackDescription: "No reliable on-chain activity data could be loaded yet.",
          },
          partial: {
            title: "On-chain activity is partially available",
            description:
              "Some activity metrics are missing in the current fetch. Available values stay visible.",
          },
          stale: {
            title: "Latest on-chain activity stays visible",
            description: "The refresh failed. The displayed activity metrics may now be outdated.",
          },
        },
        network: {
          loading: {
            title: "Loading network data",
            description: "Block height and fee estimates are being prepared.",
          },
          empty: {
            title: "No network data available",
            description: "The fetch succeeded, but there are no usable on-chain values right now.",
          },
          error: {
            title: "Network data is currently unavailable",
            fallbackDescription: "No reliable network data could be loaded yet.",
          },
          partial: {
            title: "Network data is partially available",
            description:
              "Some on-chain values are missing in the current fetch. Available metrics stay visible.",
          },
          stale: {
            title: "Latest network data stays visible",
            description:
              "The refresh did not update all values. The displayed data may now be outdated.",
          },
        },
        sentiment: {
          loading: {
            title: "Loading sentiment",
            description: "The Fear and Greed Index is being prepared.",
          },
          empty: {
            title: "No sentiment available",
            description: "The provider currently returns no usable values for this index.",
          },
          error: {
            title: "Sentiment is currently unavailable",
            fallbackDescription: "No reliable sentiment data could be loaded yet.",
          },
          partial: {
            title: "Sentiment is partially available",
            description: "The current fetch is incomplete. Existing hints stay visible.",
          },
          stale: {
            title: "Latest sentiment stays visible",
            description: "No new index value could be loaded. The display may now be outdated.",
          },
        },
        metadata: {
          loading: {
            title: "Loading source details",
            description: "Timestamps and provider details are being prepared.",
          },
          empty: {
            title: "No source details available",
            description:
              "As soon as the first data arrives, sources and refresh times will appear here.",
          },
          error: {
            title: "Source details are currently unavailable",
            fallbackDescription: "No reliable source and timestamp details could be loaded yet.",
          },
          partial: {
            title: "Source details are partially available",
            description: "Some details are still missing. Existing source details stay visible.",
          },
          stale: {
            title: "Latest source details stay visible",
            description: "The displayed timestamps and sources may now be outdated.",
          },
        },
        sanitizedErrors: {
          network:
            "The connection to the data service is unstable right now. Please try again in a moment.",
          timeout:
            "The data service is responding too slowly right now. Please try again in a moment.",
          emptyResponse: "The data service is currently not returning usable details.",
        },
        persistentNotices: {
          networkCriticalLoss:
            "Important network data has only been partially available for the last few minutes. Available metrics stay visible.",
          networkUnavailable:
            "Network data has not been reliably available for the last few minutes. Please try again later.",
        },
        fallbacks: {
          overviewUnavailable: "Market data is currently unavailable. Please try again later.",
          performanceUnavailable:
            "Performance data is currently unavailable. Please try again later.",
          networkUnavailable: "Network data is currently unavailable. Please try again later.",
          onChainActivityUnavailable:
            "On-chain activity is currently unavailable. Please try again later.",
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
      currentValueDescription:
        "This is what your holdings would be worth at the current reference price.",
      pnlLabel: "Difference vs. invested capital",
      marketState: {
        loadingTitle: "Loading reference price",
        loadingDescription: "The current BTC price for the calculator is being prepared.",
        emptyTitle: "No reference price available",
        emptyDescription:
          "The fetch succeeded, but there is no usable price for the active currency.",
        errorTitle: "Reference price is currently unavailable",
        errorFallback: "No reliable market price for the calculator could be loaded yet.",
        partialTitle: "Reference price is partially available",
        partialDescription:
          "The current market fetch is incomplete. Available values stay visible for the calculator.",
        staleTitle: "Latest reference price stays visible",
        staleDescription: "The refresh failed. The displayed price may now be outdated.",
        loadError: "The reference price could not be loaded.",
      },
      formEyebrow: "New buy",
      formTitle: "Add buy",
      formDescription:
        "Entries are stored automatically only in this browser. Each currency stays separate so your series remains cleanly comparable.",
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
    legal: {
      imprint: {
        eyebrow: "Legal",
        title: "Imprint",
        description:
          "This page is prepared as a placeholder. Final provider details and contact information will be added here.",
        bodyTitle: "In progress",
        body: "The full imprint for Bitcoin Dashboard will live here. Until the final version is published, this page serves as a structured placeholder.",
      },
      privacy: {
        eyebrow: "Legal",
        title: "Privacy",
        description:
          "This page is prepared as a placeholder. Final privacy details and information about data processing will be added here.",
        bodyTitle: "In progress",
        body: "The privacy notice for Bitcoin Dashboard will live here. Until the final version is published, this page serves as a structured placeholder.",
      },
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[AppLocale];

export function getDictionary(locale: AppLocale) {
  return dictionaries[locale];
}
