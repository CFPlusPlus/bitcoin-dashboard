import type { KvNamespaceBinding } from "./env";

export type ProviderCacheSource = "api" | "kv" | "stale";

export type ProviderCacheMeta = {
  source: ProviderCacheSource;
  ageSeconds: number;
  fetchedAt: string;
};

export type CachedProviderResult<T> = {
  data: T;
  cache: ProviderCacheMeta;
};

type KvCacheRecord<T> = {
  storedAtEpochSeconds: number;
  payload: T;
};

type KvCacheOptions<T> = {
  kv: KvNamespaceBinding | null | undefined;
  key: string;
  freshTtlSeconds: number;
  staleTtlSeconds: number;
  fetchFresh: () => Promise<T>;
  deserialize: (value: unknown) => T | null;
};

function toFetchedAt(storedAtEpochSeconds: number) {
  return new Date(storedAtEpochSeconds * 1000).toISOString();
}

function toAgeSeconds(storedAtEpochSeconds: number, nowEpochSeconds: number) {
  return Math.max(0, nowEpochSeconds - storedAtEpochSeconds);
}

function parseKvCacheRecord<T>(
  value: unknown,
  deserialize: (value: unknown) => T | null
): KvCacheRecord<T> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const storedAtEpochSeconds =
    "storedAtEpochSeconds" in value ? (value.storedAtEpochSeconds as number) : null;
  const rawPayload = "payload" in value ? value.payload : null;

  if (
    typeof storedAtEpochSeconds !== "number" ||
    !Number.isFinite(storedAtEpochSeconds) ||
    storedAtEpochSeconds <= 0
  ) {
    return null;
  }

  const payload = deserialize(rawPayload);

  if (payload === null) {
    return null;
  }

  return {
    storedAtEpochSeconds,
    payload,
  };
}

async function readKvCacheRecord<T>(
  kv: KvNamespaceBinding,
  key: string,
  deserialize: (value: unknown) => T | null
) {
  try {
    const cachedValue = await kv.get(key, { type: "json" });
    return parseKvCacheRecord(cachedValue, deserialize);
  } catch {
    return null;
  }
}

async function writeKvCacheRecord<T>(
  kv: KvNamespaceBinding,
  key: string,
  record: KvCacheRecord<T>,
  expirationTtlSeconds: number
) {
  try {
    await kv.put(key, JSON.stringify(record), {
      expirationTtl: Math.max(1, Math.floor(expirationTtlSeconds)),
    });
  } catch {
    // KV write failures should never block returning fresh upstream data.
  }
}

export async function resolveKvCachedProviderData<T>({
  kv,
  key,
  freshTtlSeconds,
  staleTtlSeconds,
  fetchFresh,
  deserialize,
}: KvCacheOptions<T>): Promise<CachedProviderResult<T>> {
  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  const normalizedFreshTtlSeconds = Math.max(1, Math.floor(freshTtlSeconds));
  const normalizedStaleTtlSeconds = Math.max(
    normalizedFreshTtlSeconds,
    Math.floor(staleTtlSeconds)
  );
  const cachedRecord =
    kv !== undefined && kv !== null ? await readKvCacheRecord(kv, key, deserialize) : null;

  if (cachedRecord) {
    const ageSeconds = toAgeSeconds(cachedRecord.storedAtEpochSeconds, nowEpochSeconds);

    if (ageSeconds <= normalizedFreshTtlSeconds) {
      return {
        data: cachedRecord.payload,
        cache: {
          source: "kv",
          ageSeconds,
          fetchedAt: toFetchedAt(cachedRecord.storedAtEpochSeconds),
        },
      };
    }
  }

  try {
    const freshPayload = await fetchFresh();
    const record: KvCacheRecord<T> = {
      storedAtEpochSeconds: nowEpochSeconds,
      payload: freshPayload,
    };

    if (kv !== undefined && kv !== null) {
      await writeKvCacheRecord(kv, key, record, normalizedStaleTtlSeconds);
    }

    return {
      data: freshPayload,
      cache: {
        source: "api",
        ageSeconds: 0,
        fetchedAt: toFetchedAt(nowEpochSeconds),
      },
    };
  } catch (error) {
    if (cachedRecord) {
      const ageSeconds = toAgeSeconds(cachedRecord.storedAtEpochSeconds, nowEpochSeconds);

      if (ageSeconds <= normalizedStaleTtlSeconds) {
        return {
          data: cachedRecord.payload,
          cache: {
            source: "stale",
            ageSeconds,
            fetchedAt: toFetchedAt(cachedRecord.storedAtEpochSeconds),
          },
        };
      }
    }

    throw error;
  }
}
