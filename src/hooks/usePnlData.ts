"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePnlData() {
  const { data, error, isLoading, mutate } = useSWR("/api/pnl", fetcher, {
    refreshInterval: 5000, // 🔄 refresca cada 5 segundos
  });

  return {
    pnl: data,
    isLoading,
    isError: error,
    refresh: mutate, // permite actualizar manualmente
  };
}
