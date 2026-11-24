"use client";

import { PricingTable } from "@clerk/nextjs";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Clerk's <PricingTable> renders nothing on the server (Clerk isn't loaded yet), but on the client
// it can already be loaded during hydration and render its host <div>. That mismatch throws a
// hydration error, so render it only after hydration: false on the server and during hydration,
// true afterwards.
export default function ClientPricingTable({ for: subject }: { for: "user" | "organization" }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  if (!isClient) return null;
  return <PricingTable for={subject} />;
}
