type RefreshButtonProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export default function RefreshButton({
  refreshing,
  onRefresh,
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      className="refresh-btn"
      onClick={onRefresh}
      disabled={refreshing}
    >
      {refreshing ? "Aktualisiere..." : "Jetzt aktualisieren"}
    </button>
  );
}
