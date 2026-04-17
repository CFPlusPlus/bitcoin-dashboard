"use client";

import { useI18n } from "../i18n/context";
import DisplayTitle from "./ui/content/DisplayTitle";
import Eyebrow from "./ui/content/Eyebrow";
import MetaText from "./ui/content/MetaText";
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
          <DisplayTitle as="h1" className="max-w-[10.75ch] text-balance">
            <>
              {messages.home.headerTitlePrefix}{" "}
              <span className="text-accent">{messages.home.headerTitleAccent}</span>.
            </>
          </DisplayTitle>
          <MetaText tone="strong" className="max-w-[31rem] text-pretty">
            {messages.home.headerDescription}
          </MetaText>
        </Stack>
      </Stack>
    </header>
  );
}
