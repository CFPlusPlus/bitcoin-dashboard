import { TriangleAlert } from "lucide-react";
import Surface from "./ui/Surface";

type NoticeBarProps = {
  warnings: string[];
};

export default function NoticeBar({ warnings }: NoticeBarProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Surface
      as="section"
      tone="accent"
      className="flex flex-col gap-3 border-accent/30 bg-accent-soft"
      aria-label="Hinweise"
    >
      <div className="flex items-center gap-3">
        <TriangleAlert className="size-4 text-accent" aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-fg-secondary">Hinweise</p>
      </div>
      <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm text-fg-secondary">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </Surface>
  );
}
