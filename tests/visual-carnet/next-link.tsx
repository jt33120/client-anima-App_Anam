import type { AnchorHTMLAttributes, ReactNode } from "react";

export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}) {
  const attributes = { ...props };
  delete attributes.prefetch;
  delete attributes.replace;
  delete attributes.scroll;
  return <a {...attributes} />;
}

export function useLinkStatus() {
  return { pending: new URLSearchParams(window.location.search).get("state") === "loading" };
}
