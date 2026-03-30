import type { ReactNode } from "react";
import type { AsyncDataState } from "../../../lib/data-state";
import Stack from "../layout/Stack";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";
import PartialState from "./PartialState";
import RetryButton from "./RetryButton";
import StaleState from "./StaleState";

type StateMessage = {
  description: ReactNode;
  title: ReactNode;
};

type DataStateMessages = {
  empty?: StateMessage;
  error?: StateMessage;
  loading: StateMessage;
  partial?: StateMessage;
  stale?: StateMessage;
};

type DataStateProps = {
  children: ReactNode;
  className?: string;
  messages: DataStateMessages;
  onRetry?: () => void;
  retryBusy?: boolean;
  retryLabel?: string;
  state: AsyncDataState<unknown>;
};

export default function DataState({
  children,
  className,
  messages,
  onRetry,
  retryBusy = false,
  retryLabel,
  state,
}: DataStateProps) {
  const retryAction = onRetry ? (
    <RetryButton busy={retryBusy} label={retryLabel} onClick={onRetry} />
  ) : undefined;

  if (!state.hasUsableData) {
    if (state.status === "loading") {
      return (
        <LoadingState
          className={className}
          title={messages.loading.title}
          description={messages.loading.description}
        />
      );
    }

    if (state.status === "error" && messages.error) {
      return (
        <ErrorState
          action={retryAction}
          className={className}
          title={messages.error.title}
          description={messages.error.description}
        />
      );
    }

    if (state.status === "empty" && messages.empty) {
      return (
        <EmptyState
          action={retryAction}
          className={className}
          title={messages.empty.title}
          description={messages.empty.description}
        />
      );
    }

    return null;
  }

  return (
    <Stack gap="sm" className={className}>
      {state.status === "partial" && messages.partial ? (
        <PartialState
          action={retryAction}
          compact
          title={messages.partial.title}
          description={messages.partial.description}
        />
      ) : null}
      {state.status !== "partial" && state.isStale && messages.stale ? (
        <StaleState
          action={retryAction}
          compact
          title={messages.stale.title}
          description={messages.stale.description}
        />
      ) : null}
      {children}
    </Stack>
  );
}
