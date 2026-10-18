import { useMemo } from "react";
import { useLocation, useSearch } from "wouter";

export function useRouter() {
  const [, navigate] = useLocation();
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => window.history.back(),
      refresh: () => {
        window.dispatchEvent(new CustomEvent("si-cehat-auth-refresh"));
      },
    }),
    [navigate]
  );
}

export function usePathname(): string {
  const [location] = useLocation();
  return location;
}

export function useSearchParams(): URLSearchParams {
  const search = useSearch();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function redirect(url: string): never {
  window.location.replace(url);
  throw new Error(`Redirecting to ${url}`);
}
