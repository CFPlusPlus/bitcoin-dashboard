import { useEffect, useState } from "react";

type Validator<T> = (value: unknown) => value is T;

function readStoredValue<T>(
  key: string,
  initialValue: T,
  validator?: Validator<T>
): T {
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
      window.localStorage.removeItem(key);
      return initialValue;
    }

    return (parsedValue as T) ?? initialValue;
  } catch {
    window.localStorage.removeItem(key);
    return initialValue;
  }
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  validator?: Validator<T>
) {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue, validator));

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
