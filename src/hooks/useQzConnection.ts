import { useSyncExternalStore } from "react";
import { getQzConnectionSnapshot, subscribeQzConnection } from "@/lib/qzConnection";

export function useQzConnection() {
  return useSyncExternalStore(subscribeQzConnection, getQzConnectionSnapshot, getQzConnectionSnapshot);
}
