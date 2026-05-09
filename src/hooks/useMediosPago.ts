import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabaseClient";

export type MedioPago = {
  id: string;
  nombre: string;
  activo: boolean;
  submedios?: { id: string; nombre: string }[];
};

export type SubmedioPago = {
  id: string;
  medio_pago_id: string;
  nombre: string;
  activo: boolean;
};

export function useMediosPago() {
  return useQuery<MedioPago[]>({
    queryKey: ["medios_pago"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("medios_pago")
        .select("*, submedios:submedios_pago(id, nombre)")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useSubmediosPago() {
  return useQuery<SubmedioPago[]>({
    queryKey: ["submedios_pago"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("submedios_pago")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });
}