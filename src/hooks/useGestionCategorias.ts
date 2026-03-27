import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";

export function useCrearCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nombre, color_hex, orden_display }: { nombre: string; color_hex: string; orden_display: number }) => {
      const supabase = createClient();
      const { error } = await supabase.from("categorias").insert({ nombre, color_hex, orden_display });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}

export function useEditarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nombre, color_hex }: { id: string; nombre: string; color_hex: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("categorias").update({ nombre, color_hex }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}