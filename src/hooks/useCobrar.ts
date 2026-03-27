"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { ItemCarrito } from "@/types/producto";
import type { Mesa } from "@/types/mesa";

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
  pagos: MedioPagoSeleccionado[];
};

export function useCobrar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PayloadCobro) => {
      const supabase = createClient();

      // 1. Intentar buscar sesión activa
      let { data: sesion } = await supabase
        .from("sesiones_caja")
        .select("id")
        .eq("estado", "abierta")
        .maybeSingle();

      // BYPASS TEST: Si no hay sesión, creamos una automática para permitir el testeo
      if (!sesion) {
        const { data: nuevaSesion, error: errorSesion } = await supabase
          .from("sesiones_caja")
          .insert({
            fondo_inicial: 0,
            estado: "abierta",
            apertura_automatica: true,
            observaciones: "Sesión de prueba automática"
          })
          .select("id")
          .single();
        
        if (errorSesion) throw new Error("No se pudo crear la sesión de prueba.");
        sesion = nuevaSesion;
      }

      const sesionId = sesion.id;

      // 2. Crear la venta
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert({
          sesion_id: sesionId,
          mesa_id: payload.mesa?.id ?? null,
          total: payload.total,
          subtotal: payload.subtotal,
          estado: "cobrada",
          descuento_tipo: payload.descuento_tipo,
          descuento_valor: payload.descuento_valor,
          descuento_monto: payload.descuento_monto,
          descuento_motivo: payload.descuento_motivo || null,
        })
        .select("id")
        .single();

      if (ventaError) throw ventaError;
      const ventaId = venta.id;

      // 3. Insertar detalles
      const detalles = payload.items.map((item) => ({
        venta_id: ventaId,
        producto_id: item.producto.id,
        variante_id: item.variante?.id ?? null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }));

      const { error: dError } = await supabase.from("detalle_ventas").insert(detalles);
      if (dError) throw dError;

      // 4. Insertar pagos
      const pagos = payload.pagos.map((p) => ({
        venta_id: ventaId,
        medio_pago_id: p.medio_pago_id,
        submedio_pago_id: p.submedio_pago_id ?? null,
        monto: p.monto,
      }));

      const { error: pError } = await supabase.from("pagos_venta").insert(pagos);
      if (pError) throw pError;

      // 5. Limpiar mesa y stock
      if (payload.mesa) {
        await supabase.from("mesas").update({ estado: "sucia" }).eq("id", payload.mesa.id);
      }

      for (const item of payload.items) {
        const nuevoStock = Math.max(0, (item.producto.stock_actual ?? 0) - item.cantidad);
        await supabase.from("productos").update({ stock_actual: nuevoStock }).eq("id", item.producto.id);
      }

      return ventaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesas"] });
      queryClient.invalidateQueries({ queryKey: ["facturado_hoy"] });
      queryClient.invalidateQueries({ queryKey: ["resumen_sesion"] });
    },
  });
}