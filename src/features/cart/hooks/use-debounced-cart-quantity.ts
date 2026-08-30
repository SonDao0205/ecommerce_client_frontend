"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CartLine } from "../types/cart";

interface PendingQuantity {
  item: CartLine;
  quantity: number;
}

/** Optimistic cart quantities with one serialized API write per click burst. */
export function useDebouncedCartQuantity(
  updateItem: (item: CartLine, quantity: number) => Promise<void>,
  onError: (error: unknown) => void,
  delay = 400,
) {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const pending = useRef(new Map<string, PendingQuantity>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const errorHandler = useRef(onError);

  useEffect(() => {
    errorHandler.current = onError;
  }, [onError]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );

  const persist = useCallback(
    (id: string): Promise<void> => {
      const timer = timers.current.get(id);
      if (timer) clearTimeout(timer);
      timers.current.delete(id);
      const task = pending.current.get(id);
      if (!task) return queue.current;
      pending.current.delete(id);

      const request = queue.current
        .catch(() => undefined)
        .then(async () => {
          try {
            await updateItem(task.item, task.quantity);
            if (!pending.current.has(id)) {
              setOverrides((current) => {
                if (current[id] !== task.quantity) return current;
                const next = { ...current };
                delete next[id];
                return next;
              });
            }
          } catch (error) {
            if (!pending.current.has(id)) {
              setOverrides((current) => {
                const next = { ...current };
                delete next[id];
                return next;
              });
            }
            errorHandler.current(error);
            throw error;
          }
        });
      queue.current = request.catch(() => undefined);
      return request;
    },
    [updateItem],
  );

  const changeQuantity = useCallback(
    (item: CartLine, quantity: number) => {
      const normalized = Math.max(1, Math.min(99, quantity));
      setOverrides((current) => ({ ...current, [item.id]: normalized }));
      pending.current.set(item.id, { item, quantity: normalized });
      const currentTimer = timers.current.get(item.id);
      if (currentTimer) clearTimeout(currentTimer);
      timers.current.set(
        item.id,
        setTimeout(() => {
          void persist(item.id).catch(() => undefined);
        }, delay),
      );
    },
    [delay, persist],
  );

  const flush = useCallback(async () => {
    const ids = [...pending.current.keys()];
    const requests = ids.map((id) => persist(id));
    if (requests.length) await Promise.all(requests);
    await queue.current;
  }, [persist]);

  const quantityFor = useCallback(
    (item: CartLine) => overrides[item.id] ?? item.quantity,
    [overrides],
  );
  return {
    changeQuantity,
    flush,
    quantityFor,
    hasPending: Object.keys(overrides).length > 0,
  };
}
