import { useState, useCallback, useMemo } from "react";
import type { Producto, VarianteProducto, ItemCarrito } from "@/types/producto";

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [descuento, setDescuento] = useState<{
    tipo: "fijo" | "porcentaje";
    valor: number;
    motivo: string;
  } | null>(null);

  // ── Agregar producto unidad ──────────────────────────────
  const agregarUnidad = useCallback((producto: Producto) => {
    const key = producto.id;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        const item = copy[idx];
        copy[idx] = {
          ...item,
          cantidad: item.cantidad + 1,
          subtotal: (item.cantidad + 1) * item.precio_unitario,
        };
        return copy;
      }
      return [...prev, {
        key,
        producto,
        cantidad: 1,
        precio_unitario: producto.precio_unitario!,
        subtotal: producto.precio_unitario!,
      }];
    });
  }, []);

  // ── Agregar producto por peso ────────────────────────────
  // El empleado ingresa el monto en $ ó los kg — el sistema calcula el otro
  const agregarPeso = useCallback((
    producto: Producto,
    montoIngresado: number,   // $ que el cliente va a pagar
  ) => {
    const kgCalculados = montoIngresado / producto.precio_unitario!;
    const key = `${producto.id}-${Date.now()}`;
    setItems((prev) => [...prev, {
      key,
      producto,
      cantidad: Math.round(kgCalculados * 1000) / 1000,
      montoIngresado,
      precio_unitario: producto.precio_unitario!,
      subtotal: montoIngresado,
    }]);
  }, []);

  // ── Agregar producto con tamaño ──────────────────────────
  const agregarVariante = useCallback((
    producto: Producto,
    variante: VarianteProducto,
  ) => {
    const key = `${producto.id}-${variante.id}`;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        const item = copy[idx];
        copy[idx] = {
          ...item,
          cantidad: item.cantidad + 1,
          subtotal: (item.cantidad + 1) * variante.precio,
        };
        return copy;
      }
      return [...prev, {
        key,
        producto,
        variante,
        cantidad: 1,
        precio_unitario: variante.precio,
        subtotal: variante.precio,
      }];
    });
  }, []);

  // ── Cambiar cantidad ─────────────────────────────────────
  const cambiarCantidad = useCallback((key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.key !== key) return i;
          const nueva = i.cantidad + delta;
          if (nueva <= 0) return null as unknown as ItemCarrito;
          return { ...i, cantidad: nueva, subtotal: nueva * i.precio_unitario };
        })
        .filter(Boolean)
    );
  }, []);

  // ── Eliminar ítem ────────────────────────────────────────
  const eliminar = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  // ── Limpiar carrito ──────────────────────────────────────
  const limpiar = useCallback(() => {
    setItems([]);
    setDescuento(null);
  }, []);

  // ── Totales ──────────────────────────────────────────────
  const totales = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    let montoDescuento = 0;
    if (descuento) {
      montoDescuento = descuento.tipo === "porcentaje"
        ? subtotal * (descuento.valor / 100)
        : descuento.valor;
    }
    const total = Math.max(0, subtotal - montoDescuento);
    return { subtotal, montoDescuento, total };
  }, [items, descuento]);

  return {
    items,
    descuento,
    totales,
    agregarUnidad,
    agregarPeso,
    agregarVariante,
    cambiarCantidad,
    eliminar,
    limpiar,
    setDescuento,
  };
}