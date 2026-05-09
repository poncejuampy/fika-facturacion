"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { VentaReporte } from "@/hooks/useReportes";

export type SesionCaja = {
  id: string;
  fondo_inicial: number;
  estado: "abierta" | "cerrada";
  abierta_en: string;
  cerrada_en: string | null;
};

// 1. Hook para detectar sesión abierta
export function useSesionActiva(enabled = true) {
  return useQuery<SesionCaja | null>({
    queryKey: ["sesion_activa"],
    enabled,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sesiones_caja")
        .select("*")
        .eq("estado", "abierta")
        .maybeSingle();
      if (error) return null;
      return data as SesionCaja | null;
    },
    staleTime: 1000 * 5, // Chequea cada 5 seg
  });
}

// 2. Facturado Hoy (Arreglado para resetear a 0)
export function useFacturadoHoy(sesionId?: string) {
  return useQuery({
    queryKey: ["facturado_hoy", sesionId],
    enabled: !!sesionId,
    queryFn: async () => {
      if (!sesionId) return { total: 0, cantidad: 0 };
      const supabase = createClient();
      const { data } = await supabase
        .from("ventas")
        .select("total")
        .eq("sesion_id", sesionId)
        .eq("estado", "cobrada");
      
      const total = (data || []).reduce((acc, v) => acc + v.total, 0);
      return { total, cantidad: data?.length || 0 };
    },
    initialData: { total: 0, cantidad: 0 }
  });
}

// 3. Resumen para el Ticket de Cierre
export function useResumenSesion(sesionId: string | null) {
  return useQuery({
    queryKey: ["resumen_sesion", sesionId],
    enabled: !!sesionId,
    queryFn: async () => {
      const supabase = createClient();
      const { data: ventas, error } = await supabase
        .from("ventas")
        .select(`
          id, total, subtotal, descuento_monto, estado, fecha_hora,
          mesa:mesas(nombre),
          pagos:pagos_venta(monto, medio:medios_pago(nombre))
        `)
        .eq("sesion_id", sesionId!)
        .eq("estado", "cobrada");

      if (error) throw error;

      type VentaRaw = {
        id: string; total: number; subtotal: number;
        descuento_monto: number; estado: string; fecha_hora: string;
        mesa: { nombre: string } | null;
        pagos: { monto: number; medio: { nombre: string } | null }[];
      };

      const ventasRaw = (ventas || []) as unknown as VentaRaw[];

      const porMedio: Record<string, number> = {};
      ventasRaw.forEach(v => {
        v.pagos.forEach(p => {
          const nombreMedio = p.medio?.nombre || "Otro";
          porMedio[nombreMedio] = (porMedio[nombreMedio] || 0) + p.monto;
        });
      });

      return {
        totalVendido: ventasRaw.reduce((s, v) => s + v.total, 0),
        cantidadVentas: ventasRaw.length,
        porMedio,
        ventasRaw: ventasRaw as unknown as VentaReporte[],
      };
    },
  });
}

export function useAbrirCaja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fondo: number) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sesiones_caja")
        .insert({ fondo_inicial: fondo, estado: "abierta" })
        .select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sesion_activa"] }),
  });
}

export function useCerrarCaja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { sesionId: string; montoContado: number; cambioSiguiente: number; diferencia: number }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("sesiones_caja")
        .update({
          estado: "cerrada",
          cerrada_en: new Date().toISOString(),
          monto_cierre_efectivo: p.montoContado,
          cambio_siguiente_turno: p.cambioSiguiente,
          diferencia: p.diferencia
        })
        .eq("id", p.sesionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sesion_activa"] });
      qc.invalidateQueries({ queryKey: ["facturado_hoy"] });
    }
  });
}