import {
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
export function useStableCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  const ref = useRef(callback);
  useLayoutEffect(() => {
    ref.current = callback;
  });

  return useCallback((...args: Args) => ref.current(...args), []);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const media = window.matchMedia(query);
        media.addEventListener("change", notify);
        return () => media.removeEventListener("change", notify);
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false,
  );
}
