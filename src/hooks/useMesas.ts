import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { Mesa } from "@/types/mesa";

export function useMesas() {
  const queryClient = useQueryClient();

  const query = useQuery<Mesa[]>({
    queryKey: ["mesas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("mesas")
        .select("*")
        .order("nombre", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });

  // ── Realtime: cualquier cambio en mesas refetch automático ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("mesas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mesas" },
        () => queryClient.invalidateQueries({ queryKey: ["mesas"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// ── Facturado hoy (para el sidebar) ──────────────────────────
export function useFacturadoHoy() {
  return useQuery<{ total: number; cantidad: number }>({
    queryKey: ["facturado_hoy"],
    queryFn: async () => {
      const supabase = createClient();
      const hoy = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("ventas")
        .select("total")
        .eq("estado", "cobrada")
        .gte("fecha_hora", hoy + "T00:00:00")
        .lte("fecha_hora", hoy + "T23:59:59");

      if (error) throw error;
      const ventas = data ?? [];
      return {
        total: ventas.reduce((s, v) => s + v.total, 0),
        cantidad: ventas.length,
      };
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60, // actualiza cada 60 segundos
  });
}