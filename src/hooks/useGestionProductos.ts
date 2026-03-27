import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { Producto } from "@/types/producto";

type ProductoInput = {
  nombre: string;
  categoria_id: string;
  tipo_venta: "unidad" | "peso" | "tamanio";
  precio_unitario: number | null;
  activo: boolean;
};

export function useCrearProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductoInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("productos")
        .insert(input)
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["productos"] }); qc.invalidateQueries({ queryKey: ["todos_productos"] }); },
  });
}

export function useEditarProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ProductoInput & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("productos")
        .update(input)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["productos"] }); qc.invalidateQueries({ queryKey: ["todos_productos"] }); },
  });
}

export function useToggleProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("productos")
        .update({ activo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["productos"] }); qc.invalidateQueries({ queryKey: ["todos_productos"] }); },
  });
}

export function useGestionVariantes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productoId,
      variantes,
    }: {
      productoId: string;
      variantes: { nombre: string; precio: number }[];
    }) => {
      const supabase = createClient();
      // Borrar las existentes y reinsertar
      await supabase.from("variantes_producto").delete().eq("producto_id", productoId);
      if (variantes.length > 0) {
        const { error } = await supabase.from("variantes_producto").insert(
          variantes.map((v) => ({ ...v, producto_id: productoId, activo: true }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variantes"] });
      qc.invalidateQueries({ queryKey: ["productos"] });
    },
  });
}