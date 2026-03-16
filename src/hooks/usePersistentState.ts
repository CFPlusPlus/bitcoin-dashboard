import { useCallback, useSyncExternalStore } from "react";

type Validator<T> = (value: unknown) => value is T;
type SetValue<T> = T | ((currentValue: T) => T);

function readStoredValue<T>(key: string, initialValue: T, validator?: Validator<T>): T {
  if (typeof window === "undefined") {
    return initialValue;
  }

  const storedValue = window.localStorage.getItem(key);

  if (storedValue === null) {
    return initialValue;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    if (validator && !validator(parsedValue)) {
      return initialValue;
    }

    return (parsedValue as T) ?? initialValue;
  } catch {
    return initialValue;
  }
}

function createStorageEventName(key: string) {
  return `local-storage:${key}`;
}

export function usePersistentState<T>(key: string, initialValue: T, validator?: Validator<T>) {
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
    () => readStoredValue(key, initialValue, validator),
    [initialValue, key, validator]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initialValue);

  const setValue = useCallback(
    (nextValue: SetValue<T>) => {
      if (typeof window === "undefined") {
        return;
      }

      const currentValue = readStoredValue(key, initialValue, validator);
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (currentValue: T) => T)(currentValue)
          : nextValue;

      window.localStorage.setItem(key, JSON.stringify(resolvedValue));
      window.dispatchEvent(new Event(createStorageEventName(key)));
    },
    [initialValue, key, validator]
  );

  return [value, setValue] as const;
}
