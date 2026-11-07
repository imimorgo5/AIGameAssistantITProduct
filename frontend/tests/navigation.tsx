import { useSyncExternalStore } from "react";

let current = "/";
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => current;
export function setNavigation(path: string) {
  current = path;
  listeners.forEach((notify) => notify());
}
export const router = {
  push: jest.fn(setNavigation),
  replace: jest.fn(setNavigation),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};
export function useRouter() {
  return router;
}
export function usePathname() {
  return new URL(useSyncExternalStore(subscribe, snapshot), "http://localhost")
    .pathname;
}
export function useSearchParams() {
  return new URL(useSyncExternalStore(subscribe, snapshot), "http://localhost")
    .searchParams;
}
export function useParams() {
  const pathname = usePathname();
  return {
    segments: pathname.startsWith("/games/ai/")
      ? pathname.slice(10).split("/")
      : [],
  };
}
