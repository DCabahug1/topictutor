"use client";

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { AlmanacError } from "./types";

type State<T> = { data: T | null; error: AlmanacError | null; loading: boolean };

/**
 * Loads something from the data layer after mount.
 *
 *   const { data, error, loading, reload, setData } = useAlmanac(() => almanac.getSeries(id), [id]);
 *
 * `error.kind` says what went wrong ("notFound", "loadFailed", ...).
 */
export function useAlmanac<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);
  const loader = useRef(load);
  loader.current = load;

  useEffect(() => {
    let current = true;
    setState((previous) => ({ ...previous, error: null, loading: true }));
    loader
      .current()
      .then((data) => {
        if (current) setState({ data, error: null, loading: false });
      })
      .catch((cause: unknown) => {
        if (!current) return;
        const error = cause instanceof AlmanacError ? cause : new AlmanacError("loadFailed");
        setState({ data: null, error, loading: false });
      });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const setData = useCallback((data: T) => setState({ data, error: null, loading: false }), []);

  return { ...state, reload, setData };
}
