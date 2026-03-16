"use client";

import Link from "next/link";
import { toolCards } from "../data/tools";

export default function ToolsPage() {
  return (
    <section className="tools-page">
      <header className="section-hero">
        <p className="eyebrow">Tools</p>
        <h2>Interaktive Bitcoin-Werkzeuge</h2>
        <p className="subtitle">
          Das Dashboard bleibt dein Überblick. Auf den Tool-Seiten bekommen Rechner und
          Experimente ihren eigenen Platz mit mehr Raum für Eingaben, Erklärungen und Ergebnisse.
        </p>
      </header>

      <div className="tools-grid">
        {toolCards.map((tool) => (
          <article key={tool.slug} className="card tool-card">
            <p className="label">{tool.category}</p>
            <h3>{tool.title}</h3>
            <p className="muted tool-copy">{tool.description}</p>
            <div className="tool-tags">
              {tool.tags.map((tag) => (
                <span key={tag} className="tool-tag">
                  {tag}
                </span>
              ))}
            </div>
            <Link className="refresh-btn tool-link" href={tool.href}>
              Tool öffnen
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
