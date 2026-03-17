import type { ReactNode } from "react";
import AsyncState from "./AsyncState";

type AsyncContentProps = {
  actionLabel?: string;
  children: ReactNode;
  emptyMessage?: string;
  emptyTitle?: string;
  error: string;
  hasContent: boolean;
  isEmpty?: boolean;
  loading: boolean;
  loadingMessage: string;
  loadingTitle: string;
  onAction?: () => void;
  preserveContentOnError?: boolean;
  stateClassName?: string;
  unavailableMessage?: string;
  unavailableTitle?: string;
};

export default function AsyncContent({
  actionLabel = "Erneut versuchen",
  children,
  emptyMessage = "Zurzeit sind keine Daten vorhanden.",
  emptyTitle = "Keine Daten",
  error,
  hasContent,
  isEmpty = false,
  loading,
  loadingMessage,
  loadingTitle,
  onAction,
  preserveContentOnError = false,
  stateClassName,
  unavailableMessage,
  unavailableTitle = "Vorubergehend nicht verfugbar",
}: AsyncContentProps) {
  if (!hasContent) {
    if (loading) {
      return (
        <AsyncState
          className={stateClassName}
          message={loadingMessage}
          title={loadingTitle}
          variant="loading"
        />
      );
    }

    if (error) {
      return (
        <AsyncState
          actionLabel={actionLabel}
          className={stateClassName}
          message={unavailableMessage ?? error}
          onAction={onAction}
          title={unavailableTitle}
          variant="error"
        />
      );
    }

    if (isEmpty) {
      return (
        <AsyncState
          className={stateClassName}
          message={emptyMessage}
          title={emptyTitle}
          variant="empty"
        />
      );
    }

    return null;
  }

  return (
    <>
      {error && preserveContentOnError ? (
        <AsyncState
          actionLabel={actionLabel}
          className={stateClassName}
          compact
          message={unavailableMessage ?? error}
          onAction={onAction}
          title={unavailableTitle}
          variant="error"
        />
      ) : null}
      {children}
    </>
  );
}
