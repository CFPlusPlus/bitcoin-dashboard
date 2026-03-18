"use client";

import { useI18n } from "../i18n/context";
import SectionHeader from "./ui/layout/SectionHeader";

export default function PageHeader() {
  const { messages } = useI18n();

  return (
    <header>
      <SectionHeader
        eyebrow={messages.home.headerEyebrow}
        title={
          <>
            {messages.home.headerTitlePrefix}{" "}
            <span className="text-accent">{messages.home.headerTitleAccent}</span>.
          </>
        }
        titleAs="h1"
        titleSize="lg"
        description={messages.home.headerDescription}
        className="max-w-3xl border-b-0 pb-0"
      />
    </header>
  );
}
