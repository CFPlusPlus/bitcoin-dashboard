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
      <Stack gap="md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span aria-hidden className="h-px w-8 bg-accent sm:w-10" />
          <Eyebrow>{messages.home.headerEyebrow}</Eyebrow>
        </div>

        <Stack gap="sm" className="max-w-[40rem] sm:gap-md">
          <SectionTitle
            as="h1"
            size="xl"
            className="max-w-[10.5ch] text-[2.4rem] leading-[0.94] tracking-[-0.045em] sm:max-w-[11ch] sm:text-[4.05rem] xl:text-[4.85rem]"
          >
            <>
              {messages.home.headerTitlePrefix}{" "}
              <span className="text-accent">{messages.home.headerTitleAccent}</span>.
            </>
          </SectionTitle>
          <MetaText
            size="base"
            tone="strong"
            className="max-w-[31rem] text-[0.96rem] leading-6 text-fg-secondary sm:text-[1.02rem] sm:leading-7"
          >
            {messages.home.headerDescription}
          </MetaText>
        </Stack>
      </Stack>
    </header>
  );
}
