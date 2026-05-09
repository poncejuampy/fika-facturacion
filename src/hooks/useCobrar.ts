"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { ItemCarrito } from "@/types/producto";
import type { Mesa } from "@/types/mesa";

// Exportamos esto para que ModalCobro lo pueda usar sin error
export type MedioPagoSeleccionado = {
  medio_pago_id: string;
  submedio_pago_id?: string;
  monto: number;
};

export type PayloadCobro = {
  mesa: Mesa | null;
  items: ItemCarrito[];
  subtotal: number;
  descuento_monto: number;
  descuento_tipo: "fijo" | "porcentaje" | null;
  descuento_valor: number;
  descuento_motivo: string;
  total: number;
  estado: "abierta" | "cobrada"; // 'abierta' para mozos, 'cobrada' para caja
  pagos: MedioPagoSeleccionado[];
};

export function useCobrar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PayloadCobro) => {
      const supabase = createClient();
      
      // 1. Buscamos la sesión de caja activa
      const { data: sesion } = await supabase
        .from("sesiones_caja")
        .select("id")
        .eq("estado", "abierta")
        .maybeSingle();
      
      if (!sesion) throw new Error("No hay una sesión de caja abierta. Por favor, abrí la caja primero.");

      // 2. Insertamos la venta (o comanda)
      const { data: venta, error: vError } = await supabase
        .from("ventas")
        .insert({
          sesion_id: sesion.id,
          mesa_id: payload.mesa?.id ?? null,
          total: payload.total,
          subtotal: payload.subtotal,
          estado: payload.estado,
          descuento_tipo: payload.descuento_tipo,
          descuento_valor: payload.descuento_valor,
          descuento_monto: payload.descuento_monto,
          descuento_motivo: payload.descuento_motivo || null,
        })
        .select("id")
        .single();

      if (vError) throw vError;

      // 3. Insertamos el detalle de los productos
      const detalles = payload.items.map(item => ({
        venta_id: venta.id,
        producto_id: item.producto.id,
        variante_id: item.variante?.id ?? null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }));
      
      const { error: dError } = await supabase.from("detalle_ventas").insert(detalles);
      if (dError) throw dError;

      // 4. Si es COBRADA, insertamos los pagos
      if (payload.estado === "cobrada" && payload.pagos.length > 0) {
        const pagos = payload.pagos.map(p => ({
          venta_id: venta.id,
          medio_pago_id: p.medio_pago_id,
          submedio_pago_id: p.submedio_pago_id || null,
          monto: p.monto
        }));
        await supabase.from("pagos_venta").insert(pagos);
      }

      // 5. Actualizamos la mesa: 'sucia' si ya se cobró, 'ocupada' si es una comanda abierta
      const nuevoEstadoMesa = payload.estado === "cobrada" ? "sucia" : "ocupada";
      if (payload.mesa) {
        await supabase.from("mesas").update({ estado: nuevoEstadoMesa }).eq("id", payload.mesa.id);
      }

      return venta.id;
    },
    onSuccess: () => {
      // Invalidamos las queries para que todo se actualice solo
      queryClient.invalidateQueries({ queryKey: ["mesas"] });
      queryClient.invalidateQueries({ queryKey: ["facturado_hoy"] });
      queryClient.invalidateQueries({ queryKey: ["ventas_reporte"] });
    }
  });
}