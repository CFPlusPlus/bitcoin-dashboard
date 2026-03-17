import { useCallback, useRef, useSyncExternalStore } from "react";

type Validator<T> = (value: unknown) => value is T;
type SetValue<T> = T | ((currentValue: T) => T);
type Normalizer<T> = (value: unknown, initialValue: T) => T;

type PersistentStateOptions<T> = {
  normalize?: Normalizer<T>;
  validator?: Validator<T>;
};

function resolveStoredValue<T>(
  storedValue: string | null,
  initialValue: T,
  options?: PersistentStateOptions<T>
) {
  if (storedValue === null) {
    return initialValue;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    if (options?.normalize) {
      return options.normalize(parsedValue, initialValue);
    }

    if (options?.validator && !options.validator(parsedValue)) {
      return initialValue;
    }

    return (parsedValue as T) ?? initialValue;
  } catch {
    return initialValue;
  }
}

function readStoredValue<T>(key: string, initialValue: T, options?: PersistentStateOptions<T>): T {
  if (typeof window === "undefined") {
    return initialValue;
  }

  const storedValue = window.localStorage.getItem(key);
  return resolveStoredValue(storedValue, initialValue, options);
}

function createStorageEventName(key: string) {
  return `local-storage:${key}`;
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options?: PersistentStateOptions<T>
) {
  const cacheRef = useRef<{
    hasValue: boolean;
    snapshot: T;
    storedValue: string | null;
  }>({
    hasValue: false,
    snapshot: initialValue,
    storedValue: null,
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const storageEventName = createStorageEventName(key);
      const handleStorageChange = (event: Event) => {
        if (event instanceof StorageEvent && event.key && event.key !== key) {
          return;
        }

        onStoreChange();
      };

      window.addEventListener("storage", handleStorageChange);
      window.addEventListener(storageEventName, handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(storageEventName, handleStorageChange);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(
    () => {
      if (typeof window === "undefined") {
        return initialValue;
      }

      const storedValue = window.localStorage.getItem(key);
      const cached = cacheRef.current;

      if (cached.hasValue && cached.storedValue === storedValue) {
        return cached.snapshot;
      }

      const snapshot = resolveStoredValue(storedValue, initialValue, options);

      cacheRef.current = {
        hasValue: true,
        snapshot,
        storedValue,
      };

      return snapshot;
    },
    [initialValue, key, options]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initialValue);

  const setValue = useCallback(
    (nextValue: SetValue<T>) => {
      if (typeof window === "undefined") {
        return;
      }

      const currentValue = readStoredValue(key, initialValue, options);
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (currentValue: T) => T)(currentValue)
          : nextValue;

      window.localStorage.setItem(key, JSON.stringify(resolvedValue));
      window.dispatchEvent(new Event(createStorageEventName(key)));
    },
    [initialValue, key, options]
  );

  return [value, setValue] as const;
}
