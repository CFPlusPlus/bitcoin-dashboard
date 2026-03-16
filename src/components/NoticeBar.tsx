type NoticeBarProps = {
  warnings: string[];
};

export default function NoticeBar({ warnings }: NoticeBarProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="card notice-card">
      <p className="label">Hinweise</p>
      <ul className="notice-list">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
