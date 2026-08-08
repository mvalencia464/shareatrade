import { ConvexProvider as Provider, ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";

export function ConvexProvider({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  return <Provider client={client}>{children}</Provider>;
}
