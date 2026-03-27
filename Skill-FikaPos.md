# Fika POS — Skill de Contexto Completo

## El negocio
Fika es una cafetería en Catamarca Capital, Argentina. Vende cafés especiales, panadería (pan y facturas por peso y por unidad), omelettes/tostadas y helados artesanales (por tamaño: chico/mediano/grande). Tiene 8 mesas en el salón y hace ventas para llevar. Trabajan 3 empleados fijos que rotan entre barista, mozo y cajero. El jefe quiere ver reportes pero no quiere tocar el sistema — llama al empleado y le pregunta.

## Stack confirmado (NO cambiar)
- **Framework:** Next.js 16 con Turbopack
- **Estilos:** CSS variables inline con `style={{}}`. **NUNCA** usar clases Tailwind en componentes. Las variables están definidas en `POSShell.tsx`.
- **Backend:** Supabase (PostgreSQL 15) con RLS activo
- **Estado server:** TanStack Query (`@tanstack/react-query`)
- **Íconos:** lucide-react
- **Cliente Supabase:** SIEMPRE `import { createClient } from "@/lib/supabaseClient"` y llamar `const supabase = createClient()` dentro de cada queryFn/mutationFn. NUNCA usar el singleton.

## Paleta de colores
```
--cream: #F2EBE0        fondo principal
--cream-mid: #EAE0D3    fondo secundario / hover
--cream-deep: #DDD1C2   bordes
--parchment: #F8F4EE    cards y panels
--ink: #2A2218          texto principal
--ink-mid: #5C4F3E      texto secundario
--ink-light: #9C8E7D    texto tenue / labels
--sage: #6B8C6E         verde — libre / éxito / cobrado
--sage-light: #A8C4AA
--sage-bg: #EAF2EA
--amber: #C4824A        naranja — ocupado / warning
--amber-light: #E8C89A
--amber-bg: #FBF0E6
--blue: #2e5fa3         azul — lista para cobrar
--blue-bg: #eef4fc
--rose: #B5625A         rojo — error / anulado
--rose-bg: #FBECEA
```

## Tipografía
- `'Playfair Display', serif` → títulos, números grandes, logo
- `'DM Sans', sans-serif` → todo lo demás (labels, botones, texto)

## Estructura de archivos
```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── POSShell.tsx          ← layout raíz con CSS variables y nav
│   ├── mesas/
│   │   ├── MapaMesas.tsx     ← pantalla principal con grilla de mesas
│   │   └── MesaCard.tsx      ← tarjeta individual de mesa
│   ├── pedido/
│   │   ├── PanelPedido.tsx   ← panel de productos + carrito
│   │   ├── ModalPeso.tsx     ← ingreso de peso/monto para panadería
│   │   ├── ModalVariante.tsx ← selector chico/mediano/grande para helados
│   │   └── ModalCobro.tsx    ← selección de medio de pago y confirmación
│   ├── reportes/
│   │   ├── PanelReportes.tsx ← panel con 4 tabs de reportes
│   │   └── ModalDetalleVenta.tsx ← detalle completo de una venta
│   └── config/
│       ├── PanelConfig.tsx   ← gestión de productos
│       └── ModalProducto.tsx ← crear/editar producto
├── hooks/
│   ├── useMesas.ts
│   ├── useActualizarMesa.ts
│   ├── useProductos.ts       ← useCategorias, useProductos, useVariantes, useTodosProductos
│   ├── useCarrito.ts
│   ├── useMediosPago.ts
│   ├── useCobrar.ts
│   ├── useGestionProductos.ts ← useCrearProducto, useEditarProducto, useToggleProducto
│   └── useReportes.ts        ← useVentasReporte, useResumenMediosPago, useProductosRanking
├── types/
│   ├── mesa.ts
│   └── producto.ts
└── lib/
    └── supabaseClient.ts
```

## Schema de base de datos (3FN)
```sql
-- Catálogo
categorias(id, nombre, orden_display, color_hex)
productos(id, categoria_id, nombre, tipo_venta[unidad|peso|tamanio], precio_unitario, imagen_url, stock_actual, activo)
variantes_producto(id, producto_id, nombre[Chico|Mediano|Grande], precio, activo)

-- Medios de pago
medios_pago(id, nombre, activo)
submedios_pago(id, medio_pago_id, nombre, activo)

-- Operación
mesas(id, nombre[M1-M8], estado[libre|ocupada|lista_cobro|sucia], capacidad)
sesiones_caja(id, abierta_por, cerrada_por, fondo_inicial, monto_cierre_efectivo, cambio_siguiente_turno, diferencia, estado[abierta|cerrada], apertura_automatica, abierta_en, cerrada_en)
empleados(id, auth_user_id, nombre, apellido, pin_acceso, es_administrador, activo)

-- Ventas
ventas(id, sesion_id, empleado_id, mesa_id[NULL=takeaway], fecha_hora, total, subtotal, estado[abierta|cobrada|anulada], estado_preparacion, descuento_tipo[fijo|porcentaje], descuento_valor, descuento_monto, descuento_motivo, anulada_por, motivo_anulacion, anulada_en, tipo_comprobante, nro_comprobante, cae, vencimiento_cae)
detalle_ventas(id, venta_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
pagos_venta(id, venta_id, medio_pago_id, submedio_pago_id, monto)

-- Auditoría
movimientos_stock(id, producto_id, tipo[venta|ingreso|ajuste|merma], cantidad, venta_id, observaciones, registrado_por)
```

## Lógica de negocio clave

### Tipos de venta
- **unidad:** precio fijo por ítem. Click → suma 1.
- **peso:** precio por kg. Click → abre `ModalPeso`. Empleado ingresa $ o kg, el sistema calcula el otro. `cantidad = monto / precio_kg`.
- **tamanio:** helados. Click → abre `ModalVariante`. Precio según variante (Chico/Mediano/Grande).

### Estados de mesa
- **libre** (verde) → tap abre nuevo pedido
- **ocupada** (naranja) → tap abre pedido existente
- **lista_cobro** (azul) → tap va directo a cobro
- **sucia** (gris) → tap la limpia directo (pasa a libre)

### Flujo de cobro
1. Items en carrito → botón "Cobrar" → `ModalCobro`
2. Seleccioná medio de pago (puede ser múltiple/dividido)
3. Si submed io tiene variantes (Visa, Mastercard, etc.) → seleccionar submedio
4. Si pagan de más → mostrar vuelto
5. Confirmar → INSERT en ventas + detalle_ventas + pagos_venta → mesa pasa a `sucia`

### Descuentos
Dos tipos: `fijo` (monto en $) o `porcentaje` (%). Motivo obligatorio. Se guarda en `ventas.descuento_*`.

### Sesión de caja
Una sesión por turno. Si no hay sesión abierta → pantalla bloqueante de apertura. El empleado abre con fondo inicial. Al cerrar → arqueo (efectivo contado, cambio para mañana, diferencia calculada).

## Formateo de moneda
```typescript
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
// Resultado: "$1.500", "$23.400"
```

## Permisos Supabase (anon)
```sql
-- Ya ejecutados
GRANT SELECT ON categorias, productos, variantes_producto, medios_pago, submedios_pago, mesas TO anon;
GRANT SELECT, INSERT ON ventas, sesiones_caja TO anon;
GRANT INSERT ON detalle_ventas, pagos_venta TO anon;
GRANT UPDATE ON mesas, productos TO anon;
GRANT INSERT, UPDATE, DELETE ON variantes_producto TO anon;
```

## Patrones de código establecidos

### Query básico
```typescript
export function useMesas() {
  return useQuery<Mesa[]>({
    queryKey: ["mesas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("mesas").select("*").order("nombre");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}
```

### Mutation básica
```typescript
export function useActualizarMesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("mesas").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mesas"] }),
  });
}
```

### Estilos inline (siempre así, nunca Tailwind)
```tsx
<button
  style={{
    padding: "12px 20px",
    borderRadius: 10,
    background: "var(--ink)",
    color: "var(--cream)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition: "all 0.18s",
  }}
>
  Cobrar
</button>
```

### Modal estándar (con animación)
```tsx
<div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}>
  <div style={{ background:"var(--parchment)", borderRadius:18, width:"min(96vw, 480px)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 70px rgba(42,34,24,0.35)", animation:"scaleIn 0.2s cubic-bezier(0.34,1.3,0.64,1)" }}>
    {/* contenido */}
  </div>
  <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
</div>
```

## Pendiente de construir (prioridad)
1. **useSesionCaja.ts** + pantalla de apertura de caja + modal de cierre con arqueo
2. **Realtime** en useMesas.ts (Supabase Realtime para sincronizar entre dispositivos)
3. **Facturado hoy** real en sidebar (query a ventas del día actual)
4. **Vuelto** en ModalCobro cuando pagan de más
5. **Anulación** de ventas en ModalDetalleVenta (con motivo obligatorio)
6. **Vista previa de ticket** (formato térmico, fuente mono)
7. **Gestión de categorías** en PanelConfig
8. **Búsqueda** de productos en PanelPedido
9. **Skeleton loaders** reemplazando los "Cargando…"

## Reglas para no romper nada
- No modificar el schema de Supabase sin avisar — ya está en producción con datos reales
- No cambiar el patrón de imports de createClient
- No agregar Tailwind — solo style={{}} con variables CSS
- Siempre invalidar las queryKeys correctas en onSuccess de las mutations
- Los archivos nuevos van en la carpeta correspondiente según la estructura de arriba