import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";
import type { Mesa } from "@/types/mesa";

export type EstadoMesa = Mesa["estado"];

export function useActualizarMesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoMesa }) => {
      const { error } = await createClient()
        .from("mesas")
        .update({ estado })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mesas"] }),
  });
}