type AutoRefreshToggleProps = {
  autoRefresh: boolean;
  onChange: (value: boolean) => void;
};

export default function AutoRefreshToggle({
  autoRefresh,
  onChange,
}: AutoRefreshToggleProps) {
  return (
    <button
      type="button"
      className={autoRefresh ? "range-btn active" : "range-btn"}
      onClick={() => onChange(!autoRefresh)}
    >
      {autoRefresh ? "Live an" : "Live aus"}
    </button>
  );
}
