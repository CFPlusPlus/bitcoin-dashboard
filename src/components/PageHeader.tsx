"use client";

import { useI18n } from "../i18n/context";
import Eyebrow from "./ui/content/Eyebrow";
import MetaText from "./ui/content/MetaText";
import SectionTitle from "./ui/content/SectionTitle";
import Stack from "./ui/layout/Stack";

export default function PageHeader() {
  const { messages } = useI18n();

  return (
    <header className="max-w-[46rem]">
      <Stack gap="lg">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-px w-10 bg-accent/65" />
          <Eyebrow>{messages.home.headerEyebrow}</Eyebrow>
        </div>

        <Stack gap="md" className="max-w-[40rem]">
          <SectionTitle
            as="h1"
            size="xl"
            className="max-w-[11ch] text-[2.85rem] leading-[0.94] tracking-[-0.045em] sm:text-[4.2rem] xl:text-[4.9rem]"
          >
            <>
              {messages.home.headerTitlePrefix}{" "}
              <span className="text-accent">{messages.home.headerTitleAccent}</span>.
            </>
          </SectionTitle>
          <MetaText
            size="base"
            tone="strong"
            className="max-w-[33rem] text-base leading-7 text-fg-secondary/95 sm:text-[1.05rem]"
          >
            {messages.home.headerDescription}
          </MetaText>
        </Stack>
      </Stack>
    </header>
  );
}
