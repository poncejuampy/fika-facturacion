import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { Categoria, Producto, VarianteProducto } from "@/types/producto";

export function useCategorias() {
  return useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("categorias")
        .select("*")
        .order("orden_display", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useProductos() {
  return useQuery<Producto[]>({
    queryKey: ["productos"],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("nombre", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useVariantes() {
  return useQuery<VarianteProducto[]>({
    queryKey: ["variantes"],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("variantes_producto")
        .select("*")
        .eq("activo", true)
        .order("precio", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// Trae TODOS los productos incluyendo inactivos (para configuración)
export function useTodosProductos() {
  return useQuery<Producto[]>({
    queryKey: ["todos_productos"],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}