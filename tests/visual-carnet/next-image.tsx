import type { ImgHTMLAttributes } from "react";

export default function Image(props: ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
}) {
  const attributes = { ...props };
  delete attributes.fill;
  delete attributes.priority;
  delete attributes.unoptimized;
  return <img {...attributes} />;
}
