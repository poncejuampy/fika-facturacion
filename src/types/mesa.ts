export type EstadoMesa = "libre" | "ocupada" | "lista_cobro" | "sucia";

export interface Mesa {
  id: string;
  nombre: string; // M1, M2, etc
  estado: EstadoMesa;
  capacidad: number;
  ocupada_desde?: string; // ISO timestamp
  pedido_id?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface PedidoMesa {
  id: string;
  mesa_id: string;
  estado: "abierto" | "cerrado" | "pagado";
  created_at: string;
}

export interface RealtimePostgresChangesPayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
  schema: string;
  table: string;
  commit_timestamp: string;
}

