# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comportamiento

- Responde SOLO con lo que se pide: código, diff, o respuesta directa
- Sin frases de cortesía ni explicaciones antes de actuar
- Si el cambio es menor de 20 líneas: muestra solo el bloque a reemplazar
- Si es mayor: muestra el archivo completo o diff unificado
- No repetir código que no cambia
- No pedir confirmación para acciones obvias
- Preguntar solo si hay ambigüedad real

## Reglas de Código

- **Supabase**: SIEMPRE incluir políticas RLS en migraciones nuevas
- **Next.js**: Server Components por defecto, Client solo si hay interactividad
- **TypeScript**: tipado estricto, sin `any`
- Nunca hardcodear credenciales

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS (solo en layout global — los componentes usan inline styles)
- Supabase (PostgreSQL + RLS + Auth)
- TanStack Query v5 para server state
- Deploy: Vercel

## Commands

```bash
npm run dev        # Dev server en puerto 3004
npm run build      # Build de producción
npm run lint       # ESLint
```

No hay test suite configurado.

## Environment

`.env.local` requerido:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

Single-page app. `src/app/page.tsx` → `<POSShell>` es el shell completo de la aplicación.

### Navigation (POSShell)

`POSShell` maneja un estado `vista` (`"mesas" | "pos" | "reportes" | "config"`) y renderiza el panel correspondiente. El auth gate está aquí: muestra `PantallaLogin` si no hay sesión. El flag `isAdmin` (de `useAuth`) controla acceso al panel de config y funciones admin.

### Main Views

- **MapaMesas** — grilla de mesas + sidebar con métricas del turno. Click en mesa o "Para llevar" abre `PanelPedido` como overlay slide-in.
- **PanelPedido** — catálogo de productos (izq) + carrito (der). Maneja los tres modos `tipo_venta`:
  - `unidad` — tap para agregar, controles +/-
  - `peso` — abre `ModalPeso` para ingresar monto $; los kg se back-calculan
  - `tamanio` — abre `ModalVariante` para elegir variante de tamaño
- **PanelReportes** — reportes de ventas con filtros. Solo admin puede anular ventas (`useAnularVenta`).
- **PanelConfig** — CRUD de productos y categorías, solo admin.

### Data Flow

El carrito es estado local (`useCarrito` — puro `useState`/`useMemo`, sin server state).

Para persistir en DB:
- **Guardar pedido abierto** (mesa): `useGuardarPedido` — upsert de `ventas` con `estado: "abierta"` y reemplazo de `detalle_ventas`.
- **Cobrar venta**: `ModalCobro` → `useCobrar` — inserta `ventas` (`estado: "cobrada"`), `detalle_ventas` y `pagos_venta`; actualiza estado de mesa a `"sucia"`.

Todo el server state usa TanStack Query. Tras mutations se invalidan: `["mesas"]`, `["facturado_hoy"]`, `["ventas_reporte"]`.

### Auth

`AuthProvider` (en `Providers`) envuelve la app. Usa Supabase Auth y cruza `auth.users` con la tabla `empleados` (`auth_user_id` FK). El campo `es_administrador` en `empleados` determina `isAdmin`.

El cliente Supabase se crea con `createBrowserClient` en `src/lib/supabaseClient.ts` — importar siempre desde ahí.

### Database Tables

| Table | Purpose |
|---|---|
| `mesas` | Mesas con estado: `libre \| ocupada \| lista_cobro \| sucia` |
| `ventas` | Ventas/órdenes con estado: `abierta \| cobrada \| anulada` |
| `detalle_ventas` | Líneas de ítems por venta |
| `pagos_venta` | Pagos por venta (soporta pago dividido) |
| `sesiones_caja` | Turnos de caja (apertura/cierre) |
| `empleados` | Personal vinculado a usuarios de Supabase Auth |
| `productos` | Productos con `tipo_venta: unidad \| peso \| tamanio` |
| `categorias` | Categorías con `color_hex` y `orden_display` |
| `variantes_producto` | Variantes de tamaño (Chico/Mediano/Grande) para productos `tamanio` |
| `medios_pago` / `submedios_pago` | Jerarquía de medios de pago |

### Styling

Sin Tailwind en componentes — todo usa **inline styles** con CSS custom properties. Los tokens de diseño (`--cream`, `--ink`, `--sage`, `--amber`, `--rose`, etc.) están definidos en un bloque `<style>` dentro de `POSShell`. El dinero se formatea como `"$" + Math.round(n).toLocaleString("es-AR")`.
