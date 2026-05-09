"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

export type FiltrosVentas = {
  desde: string;
  hasta: string;
  estado: "todas" | "cobrada" | "anulada";
  medio_pago_id: string;
  categoria_id: string;
};

export type VentaReporte = {
  id: string;
  fecha_hora: string;
  total: number;
  subtotal: number;
  descuento_monto: number;
  estado: string;
  motivo_anulacion?: string;
  anulada_en?: string;
  mesa: { nombre: string } | null;
  pagos: {
    id: string;
    monto: number;
    medio: { nombre: string };
    submedio: { nombre: string } | null;
  }[];
  items: {
    id: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    producto: { nombre: string; tipo_venta: string };
    variante: { nombre: string } | null;
  }[];
};

export function useVentasReporte(filtros: FiltrosVentas) {
  return useQuery<VentaReporte[]>({
    queryKey: ["ventas_reporte", filtros],
    queryFn: async () => {
      let q = supabase
        .from("ventas")
        .select(`
          id, fecha_hora, total, subtotal, descuento_monto, estado, motivo_anulacion, anulada_en,
          mesa:mesas(nombre),
          pagos:pagos_venta(id, monto, medio:medios_pago(nombre), submedio:submedios_pago(nombre)),
          items:detalle_ventas(id, cantidad, precio_unitario, subtotal,
            producto:productos(nombre, tipo_venta),
            variante:variantes_producto(nombre)
          )
        `)
        .gte("fecha_hora", `${filtros.desde}T00:00:00`)
        .lte("fecha_hora", `${filtros.hasta}T23:59:59`)
        .order("fecha_hora", { ascending: false });

      if (filtros.estado !== "todas") q = q.eq("estado", filtros.estado);

      const { data, error } = await q;
      if (error) throw error;
      
      return data as unknown as VentaReporte[];
    },
    enabled: !!filtros.desde && !!filtros.hasta,
    staleTime: 1000 * 30,
  });
}

export type ResumenMediosPago = {
  medio: string;
  submedio: string | null;
  cantidad: number;
  total: number;
};

export function useResumenMediosPago(filtros: FiltrosVentas) {
  return useQuery<ResumenMediosPago[]>({
    queryKey: ["resumen_medios", filtros],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagos_venta")
        .select(`
          monto,
          medio:medios_pago(nombre),
          submedio:submedios_pago(nombre),
          venta:ventas!inner(fecha_hora, estado)
        `)
        .eq("venta.estado", "cobrada")
        .gte("venta.fecha_hora", `${filtros.desde}T00:00:00`)
        .lte("venta.fecha_hora", `${filtros.hasta}T23:59:59`);

      if (error) throw error;

      type PagoRow = {
        monto: number;
        medio: { nombre: string } | null;
        submedio: { nombre: string } | null;
      };
      const mapa: Record<string, ResumenMediosPago> = {};
      for (const row of data ?? []) {
        const r = row as unknown as PagoRow;
        const key = `${r.medio?.nombre}|${r.submedio?.nombre ?? ""}`;
        if (!mapa[key]) mapa[key] = { medio: r.medio?.nombre ?? "", submedio: r.submedio?.nombre ?? null, cantidad: 0, total: 0 };
        mapa[key].cantidad++;
        mapa[key].total += r.monto;
      }
      return Object.values(mapa).sort((a, b) => b.total - a.total);
    },
    enabled: !!filtros.desde && !!filtros.hasta,
    staleTime: 1000 * 30,
  });
}

export type ProductoRanking = {
  nombre: string;
  categoria: string;
  tipo_venta: string;
  total_cantidad: number;
  total_facturado: number;
};

export function useProductosRanking(filtros: FiltrosVentas) {
  return useQuery<ProductoRanking[]>({
    queryKey: ["productos_ranking", filtros],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detalle_ventas")
        .select(`
          cantidad, subtotal,
          producto:productos(nombre, tipo_venta, categoria:categorias(nombre)),
          venta:ventas!inner(fecha_hora, estado)
        `)
        .eq("venta.estado", "cobrada")
        .gte("venta.fecha_hora", `${filtros.desde}T00:00:00`)
        .lte("venta.fecha_hora", `${filtros.hasta}T23:59:59`);

      if (error) throw error;

      type DetalleRow = {
        cantidad: number;
        subtotal: number;
        producto: { nombre: string; tipo_venta: string; categoria: { nombre: string } | null } | null;
      };
      const mapa: Record<string, ProductoRanking> = {};
      for (const row of data ?? []) {
        const r = row as unknown as DetalleRow;
        const key = r.producto?.nombre;
        if (!key) continue;
        if (!mapa[key]) mapa[key] = { nombre: key, categoria: r.producto?.categoria?.nombre ?? "", tipo_venta: r.producto?.tipo_venta ?? "", total_cantidad: 0, total_facturado: 0 };
        mapa[key].total_cantidad += r.cantidad;
        mapa[key].total_facturado += r.subtotal;
      }
      return Object.values(mapa).sort((a, b) => b.total_facturado - a.total_facturado);
    },
    enabled: !!filtros.desde && !!filtros.hasta,
    staleTime: 1000 * 30,
  });
}