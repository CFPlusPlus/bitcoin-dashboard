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
      className="flex flex-col gap-4 border-accent/25"
      aria-label="Hinweise"
    >
      <div className="flex items-center gap-3">
        <TriangleAlert className="size-4 text-accent" aria-hidden="true" />
        <p className="text-sm font-semibold text-fg-secondary">Hinweise</p>
      </div>
      <ul className="notice-list">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </Surface>
  );
}
