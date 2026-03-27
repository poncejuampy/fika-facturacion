export type TipoVenta = "unidad" | "peso" | "tamanio";

export interface Categoria {
  id: string;
  nombre: string;
  orden_display: number;
  color_hex: string;
}

export interface Producto {
  id: string;
  categoria_id: string;
  nombre: string;
  tipo_venta: TipoVenta;
  precio_unitario: number | null;
  imagen_url: string | null;
  stock_actual: number;
  activo: boolean;
}

export interface VarianteProducto {
  id: string;
  producto_id: string;
  nombre: string; // Chico / Mediano / Grande
  precio: number;
  activo: boolean;
}

// Item en el carrito
export interface ItemCarrito {
  key: string;            // id único: producto_id + variante_id
  producto: Producto;
  variante?: VarianteProducto;
  cantidad: number;       // unidades o kg calculados
  montoIngresado?: number;// solo para tipo 'peso'
  precio_unitario: number;// precio al momento de agregar
  subtotal: number;
}