const router = {
  push: (url: string) => { window.location.href = url; },
  replace: (url: string) => { window.location.replace(url); },
  refresh: () => {},
  back: () => window.history.back(),
  prefetch: () => {},
};
export const useRouter = () => router;
export const usePathname = () => window.location.pathname;
export const useSearchParams = () => new URLSearchParams(window.location.search);
