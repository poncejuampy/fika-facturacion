"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { ItemCarrito } from "@/types/producto";

export function useGuardarPedido() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (p: { mesaId: string; items: ItemCarrito[]; sesionId: string; empleadoId?: string }) => {
      const supabase = createClient();
      
      // 1. Ver si ya hay un pedido abierto en esta mesa
      const { data: existente } = await supabase
        .from("ventas")
        .select("id")
        .eq("mesa_id", p.mesaId)
        .eq("estado", "abierta")
        .maybeSingle();

      const total = p.items.reduce((acc, item) => acc + item.subtotal, 0);
      let ventaId: string;

      if (existente) {
        ventaId = existente.id;
        // Borramos el detalle anterior para pisarlo con el nuevo (más simple que mergear)
        await supabase.from("detalle_ventas").delete().eq("venta_id", ventaId);
        await supabase.from("ventas").update({ total, subtotal: total }).eq("id", ventaId);
      } else {
        // Crear nueva venta 'abierta'
        const { data, error } = await supabase.from("ventas").insert({
          sesion_id: p.sesionId,
          mesa_id: p.mesaId,
          empleado_id: p.empleadoId,
          estado: "abierta",
          total,
          subtotal: total
        }).select("id").single();
        if (error) throw error;
        ventaId = data.id;
      }

      // 2. Insertar los nuevos ítems
      const detalles = p.items.map(item => ({
        venta_id: ventaId,
        producto_id: item.producto.id,
        variante_id: item.variante?.id ?? null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }));

      await supabase.from("detalle_ventas").insert(detalles);

      // 3. Marcar mesa como ocupada
      await supabase.from("mesas").update({ estado: "ocupada" }).eq("id", p.mesaId);

      return ventaId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesas"] });
      qc.invalidateQueries({ queryKey: ["facturado_hoy"] });
    }
  });
}