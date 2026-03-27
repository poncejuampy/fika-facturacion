import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";

export function useAnularVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ventaId, motivo }: { ventaId: string; motivo: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("ventas")
        .update({
          estado: "anulada",
          motivo_anulacion: motivo,
          anulada_en: new Date().toISOString(),
        })
        .eq("id", ventaId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventas_reporte"] });
      qc.invalidateQueries({ queryKey: ["facturado_hoy"] });
      qc.invalidateQueries({ queryKey: ["resumen_medios"] });
      qc.invalidateQueries({ queryKey: ["productos_ranking"] });
    },
  });
}