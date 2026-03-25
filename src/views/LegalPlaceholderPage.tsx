import Section from "../components/ui/layout/Section";
import Stack from "../components/ui/layout/Stack";

type LegalPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  bodyTitle: string;
  body: string;
};

export default function LegalPlaceholderPage({
  eyebrow,
  title,
  description,
  bodyTitle,
  body,
}: LegalPlaceholderPageProps) {
  return (
    <Section space="lg" className="pt-4 sm:pt-8">
      <Stack gap="md" className="max-w-3xl">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>
        <h1 className="max-w-4xl font-serif text-fg">{title}</h1>
        <p className="max-w-2xl text-base text-fg-secondary sm:text-lg">{description}</p>
      </Stack>

      <section className="max-w-3xl rounded-md border border-border-default bg-surface px-5 py-5 shadow-surface sm:px-6 sm:py-6">
        <Stack gap="sm">
          <h2 className="font-serif text-2xl tracking-[-0.03em] text-fg">{bodyTitle}</h2>
          <p className="text-sm leading-7 text-fg-secondary sm:text-base">{body}</p>
        </Stack>
      </section>
    </Section>
  );
}
