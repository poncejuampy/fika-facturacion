"use client";

import { useState, useMemo } from "react";
import { ModalDetalleVenta } from "./ModalDetalleVenta";
import type { VentaReporte } from "@/hooks/useReportes";
import { useVentasReporte, useResumenMediosPago, useProductosRanking, type FiltrosVentas } from "@/hooks/useReportes";
import { useMediosPago } from "@/hooks/useMediosPago";
import { useCategorias } from "@/hooks/useProductos";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

const hoy = () => new Date().toISOString().split("T")[0];
const hace = (dias: number) => {
  const d = new Date(); d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
};
const inicioMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
const inicioAno = () => `${new Date().getFullYear()}-01-01`;

type Rango = "hoy" | "semana" | "mes" | "ano" | "custom";
type Tab = "resumen" | "ventas" | "medios" | "productos";

export function PanelReportes() {
  const [rango, setRango] = useState<Rango>("hoy");
  const [customDesde, setCustomDesde] = useState(hace(7));
  const [customHasta, setCustomHasta] = useState(hoy());
  const [tab, setTab] = useState<Tab>("resumen");
  const [estado, setEstado] = useState<FiltrosVentas["estado"]>("todas");
  const [medioPagoId, setMedioPagoId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [mediosSeleccionados, setMediosSeleccionados] = useState<string[]>([]);
  const [ventaDetalle, setVentaDetalle] = useState<VentaReporte | null>(null);

  const { data: medios = [] } = useMediosPago();
  const { data: categorias = [] } = useCategorias();

  const rangoFechas = useMemo(() => {
    if (rango === "hoy")    return { desde: hoy(),        hasta: hoy() };
    if (rango === "semana") return { desde: hace(6),      hasta: hoy() };
    if (rango === "mes")    return { desde: inicioMes(),  hasta: hoy() };
    if (rango === "ano")    return { desde: inicioAno(),  hasta: hoy() };
    return { desde: customDesde, hasta: customHasta };
  }, [rango, customDesde, customHasta]);

  const filtros: FiltrosVentas = {
    ...rangoFechas,
    estado,
    medio_pago_id: medioPagoId,
    categoria_id: categoriaId,
  };

  const { data: ventas = [], isLoading: loadV } = useVentasReporte(filtros);
  const { data: mediosPago = [], isLoading: loadM } = useResumenMediosPago(filtros);
  const { data: productos = [], isLoading: loadP } = useProductosRanking(filtros);

  // Calcular totales del resumen
  const ventasCobradas = ventas.filter(v => v.estado === "cobrada");
  const totalVendido = ventasCobradas.reduce((s, v) => s + v.total, 0);
  const totalDescuentos = ventasCobradas.reduce((s, v) => s + (v.descuento_monto || 0), 0);
  const ticketPromedio = ventasCobradas.length > 0 ? totalVendido / ventasCobradas.length : 0;

  // Filtrar medios por selección múltiple
  const mediosFiltrados = mediosSeleccionados.length > 0
    ? mediosPago.filter(m => mediosSeleccionados.includes(m.medio))
    : mediosPago;
  const totalMediosFiltrados = mediosFiltrados.reduce((s, m) => s + m.total, 0);

  const S = {
    root:   { flex:1, display:"flex", flexDirection:"column" as const, overflow:"hidden", background:"var(--cream)" },
    top:    { padding:"20px 28px 0", background:"var(--parchment)", borderBottom:"1px solid var(--cream-deep)", flexShrink:0 as const },
    body:   { flex:1, overflowY:"auto" as const, padding:"24px 28px" },
    card:   { background:"var(--parchment)", borderRadius:12, padding:"16px 20px", border:"1px solid var(--cream-deep)" },
    label:  { fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"var(--ink-light)", fontWeight:500, marginBottom:6 },
    value:  { fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:500, color:"var(--ink)" },
    sub:    { fontSize:11, color:"var(--ink-light)", marginTop:4 },
    th:     { fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"var(--ink-light)", padding:"8px 12px", textAlign:"left" as const, borderBottom:"1px solid var(--cream-deep)", fontWeight:500 },
    td:     { fontSize:13, padding:"10px 12px", borderBottom:"1px solid var(--cream-mid)", color:"var(--ink)" },
  };

  const rangosBtns: { id: Rango; label: string }[] = [
    { id:"hoy",    label:"Hoy" },
    { id:"semana", label:"7 días" },
    { id:"mes",    label:"Este mes" },
    { id:"ano",    label:"Este año" },
    { id:"custom", label:"Personalizado" },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id:"resumen",   label:"Resumen" },
    { id:"ventas",    label:"Ventas" },
    { id:"medios",    label:"Por medio de pago" },
    { id:"productos", label:"Productos" },
  ];

  return (
    <div style={S.root}>

      {/* ── HEADER FILTROS ── */}
      <div style={S.top}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:16 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"var(--ink)" }}>Reportes</h1>
          <span style={{ fontSize:12, color:"var(--ink-light)" }}>{rangoFechas.desde} → {rangoFechas.hasta}</span>
        </div>

        {/* Rangos de fecha */}
        <div style={{ display:"flex", gap:6, marginBottom:14 }}>
          {rangosBtns.map(r => (
            <button key={r.id} onClick={() => setRango(r.id)}
              style={{ padding:"5px 14px", borderRadius:20, border: rango===r.id ? "1.5px solid var(--ink)" : "1.5px solid var(--cream-deep)", background: rango===r.id ? "var(--ink)" : "transparent", color: rango===r.id ? "var(--cream)" : "var(--ink-mid)", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.15s" }}>
              {r.label}
            </button>
          ))}
          {rango === "custom" && (
            <div style={{ display:"flex", gap:8, alignItems:"center", marginLeft:8 }}>
              <input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)}
                style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--cream-deep)", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:"var(--parchment)", color:"var(--ink)" }} />
              <span style={{ fontSize:12, color:"var(--ink-light)" }}>→</span>
              <input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)}
                style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--cream-deep)", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:"var(--parchment)", color:"var(--ink)" }} />
            </div>
          )}
        </div>

        {/* Filtros adicionales */}
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" as const }}>
          <select value={estado} onChange={e => setEstado(e.target.value as FiltrosVentas["estado"])}
            style={{ padding:"5px 10px", borderRadius:8, border:"1px solid var(--cream-deep)", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:"var(--parchment)", color:"var(--ink)", cursor:"pointer" }}>
            <option value="todas">Todas las ventas</option>
            <option value="cobrada">Solo cobradas</option>
            <option value="anulada">Solo anuladas</option>
          </select>

          <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
            style={{ padding:"5px 10px", borderRadius:8, border:"1px solid var(--cream-deep)", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:"var(--parchment)", color:"var(--ink)", cursor:"pointer" }}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:0, borderBottom:"none" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:"8px 16px", borderRadius:"8px 8px 0 0", border:"1px solid var(--cream-deep)", borderBottom: tab===t.id ? "1px solid var(--parchment)" : "1px solid var(--cream-deep)", background: tab===t.id ? "var(--parchment)" : "var(--cream-mid)", color: tab===t.id ? "var(--ink)" : "var(--ink-light)", fontSize:12, fontWeight: tab===t.id ? 500 : 400, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", marginRight:4, transition:"all 0.15s", position:"relative" as const, bottom:-1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={S.body}>

        {/* TAB: RESUMEN */}
        {tab === "resumen" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:28 }}>
              <MetricCard label="Total vendido" value={fmt(totalVendido)} sub={`${ventasCobradas.length} ventas cobradas`} color="var(--ink)" />
              <MetricCard label="Ticket promedio" value={fmt(ticketPromedio)} sub="por venta" color="var(--sage)" />
              <MetricCard label="Descuentos" value={fmt(totalDescuentos)} sub="total descontado" color="var(--amber)" />
              <MetricCard label="Ventas anuladas" value={String(ventas.filter(v=>v.estado==="anulada").length)} sub="en el período" color="var(--rose)" />
            </div>

            {/* Mini resumen por medio de pago */}
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"var(--ink)", marginBottom:14 }}>
              Recaudado por medio de pago
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {mediosPago.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background:"var(--parchment)", borderRadius:10, border:"1px solid var(--cream-deep)" }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:500, color:"var(--ink)" }}>{m.medio}</span>
                    {m.submedio && <span style={{ fontSize:11, color:"var(--ink-light)", marginLeft:6 }}>· {m.submedio}</span>}
                  </div>
                  <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                    <span style={{ fontSize:11, color:"var(--ink-light)" }}>{m.cantidad} transacciones</span>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:500, color:"var(--ink)" }}>{fmt(m.total)}</span>
                  </div>
                </div>
              ))}
              {mediosPago.length === 0 && !loadM && <p style={{ color:"var(--ink-light)", fontSize:13, fontStyle:"italic" }}>Sin datos en el período</p>}
            </div>
          </div>
        )}

        {/* TAB: VENTAS */}
        {tab === "ventas" && (
          <div>
            <div style={{ marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontSize:13, color:"var(--ink-light)" }}>
                {ventas.length} venta{ventas.length !== 1 ? "s" : ""} · Total: {fmt(totalVendido)}
              </p>
            </div>
            {loadV ? <p style={{ color:"var(--ink-light)", fontStyle:"italic" }}>Cargando…</p> : (
              <div style={{ background:"var(--parchment)", borderRadius:12, border:"1px solid var(--cream-deep)", overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"var(--cream-mid)" }}>
                      <th style={S.th}>Fecha y hora</th>
                      <th style={S.th}>Mesa</th>
                      <th style={S.th}>Ítems</th>
                      <th style={S.th}>Medio de pago</th>
                      <th style={S.th}>Descuento</th>
                      <th style={S.th}>Estado</th>
                      <th style={{ ...S.th, textAlign:"right" as const }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map(v => {
                      const fecha = new Date(v.fecha_hora);
                      const handleRowClick = () => setVentaDetalle(v);
                      const mediosPagoStr = v.pagos?.map(p => p.medio?.nombre + (p.submedio ? ` (${p.submedio.nombre})` : "")).join(", ") ?? "—";
                      return (
                        <tr key={v.id} onClick={handleRowClick} style={{ cursor:"pointer" }} onMouseEnter={e=>(e.currentTarget.style.background="var(--cream)")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
                          <td style={S.td}>
                            <div style={{ fontSize:13 }}>{fecha.toLocaleDateString("es-AR")}</div>
                            <div style={{ fontSize:11, color:"var(--ink-light)" }}>{fecha.toLocaleTimeString("es-AR", {hour:"2-digit",minute:"2-digit"})}</div>
                          </td>
                          <td style={S.td}>{(v.mesa as unknown as {nombre:string}|null)?.nombre ?? "Para llevar"}</td>
                          <td style={S.td}>{v.items?.length ?? 0} ítem{v.items?.length !== 1 ? "s" : ""}</td>
                          <td style={{ ...S.td, fontSize:12 }}>{mediosPagoStr}</td>
                          <td style={S.td}>{v.descuento_monto > 0 ? fmt(v.descuento_monto) : "—"}</td>
                          <td style={S.td}>
                            <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:500,
                              background: v.estado === "cobrada" ? "var(--sage-bg)" : "var(--rose-bg)",
                              color: v.estado === "cobrada" ? "var(--sage)" : "var(--rose)" }}>
                              {v.estado}
                            </span>
                          </td>
                          <td style={{ ...S.td, textAlign:"right" as const, fontFamily:"'Playfair Display',serif", fontWeight:500 }}>
                            {fmt(v.total)}
                          </td>
                        </tr>
                      );
                    })}
                    {ventas.length === 0 && (
                      <tr><td colSpan={7} style={{ padding:"24px", textAlign:"center", color:"var(--ink-light)", fontStyle:"italic" }}>Sin ventas en el período seleccionado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: MEDIOS DE PAGO */}
        {tab === "medios" && (
          <div>
            {/* Selector múltiple de medios */}
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", marginBottom:10 }}>
                Filtrar por medios (selección múltiple)
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {medios.map(m => {
                  const sel = mediosSeleccionados.includes(m.nombre);
                  return (
                    <button key={m.id} onClick={() => setMediosSeleccionados(prev => sel ? prev.filter(x=>x!==m.nombre) : [...prev, m.nombre])}
                      style={{ padding:"6px 14px", borderRadius:20, border: sel ? "1.5px solid var(--ink)" : "1.5px solid var(--cream-deep)", background: sel ? "var(--ink)" : "transparent", color: sel ? "var(--cream)" : "var(--ink-mid)", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.15s" }}>
                      {m.nombre}
                    </button>
                  );
                })}
                {mediosSeleccionados.length > 0 && (
                  <button onClick={() => setMediosSeleccionados([])}
                    style={{ padding:"6px 14px", borderRadius:20, border:"1.5px solid var(--rose)", background:"var(--rose-bg)", color:"var(--rose)", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>

            {/* Total combinado si hay selección */}
            {mediosSeleccionados.length > 0 && (
              <div style={{ background:"var(--sage-bg)", border:"1px solid var(--sage-light)", borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"var(--sage)" }}>
                  Total combinado: {mediosSeleccionados.join(" + ")}
                </span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:500, color:"var(--sage)" }}>
                  {fmt(totalMediosFiltrados)}
                </span>
              </div>
            )}

            {loadM ? <p style={{ color:"var(--ink-light)", fontStyle:"italic" }}>Cargando…</p> : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {mediosFiltrados.map((m, i) => (
                  <div key={i} style={{ background:"var(--parchment)", borderRadius:12, padding:"16px 20px", border:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <p style={{ fontSize:15, fontWeight:500, color:"var(--ink)" }}>{m.medio}</p>
                      {m.submedio && <p style={{ fontSize:12, color:"var(--ink-light)", marginTop:2 }}>{m.submedio}</p>}
                      <p style={{ fontSize:11, color:"var(--ink-light)", marginTop:4 }}>{m.cantidad} transacciones</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:500, color:"var(--ink)" }}>{fmt(m.total)}</p>
                      <p style={{ fontSize:11, color:"var(--ink-light)", marginTop:2 }}>
                        {totalMediosFiltrados > 0 ? Math.round((m.total / totalMediosFiltrados) * 100) : 0}% del total
                      </p>
                    </div>
                  </div>
                ))}
                {mediosFiltrados.length === 0 && <p style={{ color:"var(--ink-light)", fontSize:13, fontStyle:"italic" }}>Sin datos en el período</p>}
              </div>
            )}
          </div>
        )}

        {/* TAB: PRODUCTOS */}
        {tab === "productos" && (
          <div>
            <p style={{ fontSize:13, color:"var(--ink-light)", marginBottom:16 }}>
              Ranking por monto facturado
            </p>
            {loadP ? <p style={{ color:"var(--ink-light)", fontStyle:"italic" }}>Cargando…</p> : (
              <div style={{ background:"var(--parchment)", borderRadius:12, border:"1px solid var(--cream-deep)", overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"var(--cream-mid)" }}>
                      <th style={{ ...S.th, width:30 }}>#</th>
                      <th style={S.th}>Producto</th>
                      <th style={S.th}>Categoría</th>
                      <th style={S.th}>Tipo</th>
                      <th style={{ ...S.th, textAlign:"right" as const }}>Cantidad</th>
                      <th style={{ ...S.th, textAlign:"right" as const }}>Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p, i) => (
                      <tr key={p.nombre}>
                        <td style={{ ...S.td, color:"var(--ink-light)", fontWeight:500 }}>{i+1}</td>
                        <td style={{ ...S.td, fontWeight:500 }}>{p.nombre}</td>
                        <td style={S.td}>{p.categoria}</td>
                        <td style={S.td}>
                          <span style={{ fontSize:10, padding:"2px 6px", borderRadius:8, background: p.tipo_venta==="peso" ? "var(--sage-bg)" : p.tipo_venta==="tamanio" ? "var(--amber-bg)" : "var(--cream-mid)", color: p.tipo_venta==="peso" ? "var(--sage)" : p.tipo_venta==="tamanio" ? "var(--amber)" : "var(--ink-mid)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                            {p.tipo_venta}
                          </span>
                        </td>
                        <td style={{ ...S.td, textAlign:"right" as const }}>
                          {p.tipo_venta === "peso" ? `${p.total_cantidad.toFixed(3)} kg` : Math.round(p.total_cantidad)}
                        </td>
                        <td style={{ ...S.td, textAlign:"right" as const, fontFamily:"'Playfair Display',serif", fontWeight:500 }}>
                          {fmt(p.total_facturado)}
                        </td>
                      </tr>
                    ))}
                    {productos.length === 0 && (
                      <tr><td colSpan={6} style={{ padding:"24px", textAlign:"center", color:"var(--ink-light)", fontStyle:"italic" }}>Sin datos en el período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalle de venta */}
      {ventaDetalle && (
        <ModalDetalleVenta
          venta={ventaDetalle}
          onCerrar={() => setVentaDetalle(null)}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background:"var(--parchment)", borderRadius:12, padding:"16px 20px", border:"1px solid var(--cream-deep)" }}>
      <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", fontWeight:500, marginBottom:8 }}>{label}</p>
      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:500, color }}>{value}</p>
      <p style={{ fontSize:11, color:"var(--ink-light)", marginTop:4 }}>{sub}</p>
    </div>
  );
}