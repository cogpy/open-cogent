export interface RefEntry<T> {
  value: T;
  refCount: number;
}

export function createRefCounter<K, V>() {
  const map = new Map<K, RefEntry<V>>();

  function acquire(key: K, factory: () => V): V {
    const entry = map.get(key);
    if (entry) {
      entry.refCount += 1;
      return entry.value;
    }
    const value = factory();
    map.set(key, { value, refCount: 1 });
    return value;
  }

  function release(key: K, onZero?: (value: V) => void) {
    const entry = map.get(key);
    if (!entry) return;
    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      map.delete(key);
      onZero?.(entry.value);
    }
  }

  function get(key: K): V | undefined {
    return map.get(key)?.value;
  }

  function list(): K[] {
    return Array.from(map.keys());
  }

  return { acquire, release, get, list } as const;
}
