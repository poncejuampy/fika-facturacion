"use client";

import { useState, useMemo } from "react";
import { ModalDetalleVenta } from "./ModalDetalleVenta";
import type { VentaReporte } from "@/hooks/useReportes";
import { 
  useVentasReporte, 
  useResumenMediosPago, 
  useProductosRanking, 
  type FiltrosVentas 
} from "@/hooks/useReportes";
import { useMediosPago } from "@/hooks/useMediosPago";
import { useCategorias } from "@/hooks/useProductos";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Filter,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Tag,
  XCircle,
  Calendar,
  ArrowUpRight
} from "lucide-react";

// --- Helpers ---
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

const hoy = () => new Date().toISOString().split("T")[0];
const hace = (dias: number) => {
  const d = new Date(); d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
};
const inicioMes = () => { 
  const d = new Date(); 
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; 
};
const inicioAno = () => `${new Date().getFullYear()}-01-01`;

type Rango = "hoy" | "semana" | "mes" | "ano" | "custom";
type Tab = "resumen" | "ventas" | "medios" | "productos" | "anulaciones";

interface PanelReportesProps {
  isAdmin: boolean;
}

export function PanelReportes({ isAdmin }: PanelReportesProps) {
  const isMobile = useIsMobile();
  
  // Estados de Filtros
  const [rango, setRango] = useState<Rango>("hoy");
  const [customDesde, setCustomDesde] = useState(hace(7));
  const [customHasta, setCustomHasta] = useState(hoy());
  const [tab, setTab] = useState<Tab>("resumen");
  const [estado, setEstado] = useState<FiltrosVentas["estado"]>("todas");
  const [categoriaId, setCategoriaId] = useState("");
  const [medioPagoId, setMedioPagoId] = useState("");
  
  // Estados de UI
  const [ventaDetalle, setVentaDetalle] = useState<VentaReporte | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Data Fetching
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
    categoria_id: categoriaId,
    medio_pago_id: medioPagoId, 
  };

  const { data: ventas = [], isLoading: loadV } = useVentasReporte(filtros);
  const { data: mediosResumen = [] } = useResumenMediosPago(filtros);
  const { data: productosRanking = [] } = useProductosRanking(filtros);

  // Procesamiento de datos para Resumen
  const ventasCobradas = useMemo(() => ventas.filter(v => v.estado === "cobrada"), [ventas]);
  const ventasAnuladas = useMemo(() => ventas.filter(v => v.estado === "anulada"), [ventas]);
  
  const totalVendido = useMemo(() => ventasCobradas.reduce((s, v) => s + v.total, 0), [ventasCobradas]);
  const totalDescuentos = useMemo(() => ventasCobradas.reduce((s, v) => s + (v.descuento_monto || 0), 0), [ventasCobradas]);
  const ticketPromedio = ventasCobradas.length > 0 ? totalVendido / ventasCobradas.length : 0;

  // Estilos
  const S = {
    root:   { flex:1, display:"flex", flexDirection:"column" as const, overflow:"hidden", background:"var(--cream)" },
    top:    { padding: isMobile ? "16px 16px 0" : "20px 28px 0", background:"var(--parchment)", borderBottom:"1px solid var(--cream-deep)", flexShrink:0 },
    body:   { flex:1, overflowY:"auto" as const, padding: isMobile ? "16px" : "24px 28px" },
    th:     { fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"var(--ink-light)", padding:"12px", textAlign:"left" as const, borderBottom:"1px solid var(--cream-deep)", fontWeight:600 },
    td:     { fontSize:13, padding:"12px", borderBottom:"1px solid var(--cream-mid)", color:"var(--ink)" },
    btnRango: (active: boolean) => ({
      padding: "6px 14px", borderRadius: 20, border: active ? "1px solid var(--ink)" : "1px solid var(--cream-deep)",
      background: active ? "var(--ink)" : "white",
      color: active ? "white" : "var(--ink-mid)",
      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "0.2s", fontFamily: "'DM Sans', sans-serif"
    })
  };

  return (
    <div style={S.root}>
      
      {/* ── SECCIÓN DE FILTROS & TABS ── */}
      <div style={S.top}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 22 : 28, color:"var(--ink)", margin:0 }}>Reportes</h1>
            <div style={{ display:"flex", alignItems:"center", gap:6, color:"var(--ink-light)", marginTop:4 }}>
              <Calendar size={12} />
              <span style={{ fontSize:12 }}>{rangoFechas.desde} / {rangoFechas.hasta}</span>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setShowFilters(!showFilters)} style={{ width:40, height:40, borderRadius:12, background: showFilters ? "var(--ink)" : "white", color: showFilters ? "white" : "var(--ink)", border:"1px solid var(--cream-deep)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Filter size={18} />
            </button>
          )}
        </div>

        {(!isMobile || showFilters) && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20, animation: "slideDown 0.2s ease-out" }}>
            
            {/* Botones de Rango Rápido */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {(["hoy", "semana", "mes", "ano", "custom"] as Rango[]).map(r => (
                <button key={r} onClick={() => setRango(r)} style={S.btnRango(rango === r)}>
                  {r === "semana" ? "7 días" : r === "ano" ? "Año" : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            {rango === "custom" && (
              <div style={{ display:"flex", gap:8, alignItems:"center", background:"white", padding:"8px 12px", borderRadius:12, border:"1px solid var(--cream-deep)" }}>
                <input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)} style={{ border:"none", fontSize:13, outline:"none", color:"var(--ink)" }} />
                <span style={{ color: "var(--cream-deep)" }}>→</span>
                <input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)} style={{ border:"none", fontSize:13, outline:"none", color:"var(--ink)" }} />
              </div>
            )}

            {/* Selectores de Estado y Categoría */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <select value={estado} onChange={e => setEstado(e.target.value as FiltrosVentas["estado"])} style={{ padding:"8px 12px", borderRadius:10, border:"1px solid var(--cream-deep)", fontSize:13, background:"white", color:"var(--ink)", outline:"none" }}>
                <option value="todas">Todos los estados</option>
                <option value="cobrada">Solo Cobradas</option>
                <option value="anulada">Solo Anuladas</option>
              </select>
              
              <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={{ padding:"8px 12px", borderRadius:10, border:"1px solid var(--cream-deep)", fontSize:13, background:"white", color:"var(--ink)", outline:"none" }}>
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>

              <select value={medioPagoId} onChange={e => setMedioPagoId(e.target.value)} style={{ padding:"8px 12px", borderRadius:10, border:"1px solid var(--cream-deep)", fontSize:13, background:"white", color:"var(--ink)", outline:"none" }}>
                <option value="">Todos los medios</option>
                {medios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Tabs de Navegación Estilo Fika */}
        <div style={{ display:"flex", gap:4, overflowX:"auto", scrollbarWidth:"none", borderBottom:"1px solid var(--cream-deep)" }}>
          {(["resumen", "ventas", "medios", "productos", "anulaciones"] as Tab[]).map(t => {
            if (t === "anulaciones" && !isAdmin) return null;
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "12px 20px", border: "none", background: "none",
                color: active ? "var(--ink)" : "var(--ink-light)",
                fontWeight: active ? 600 : 400, fontSize: 13,
                borderBottom: active ? "2px solid var(--ink)" : "2px solid transparent",
                cursor: "pointer", whiteSpace: "nowrap", transition: "0.2s",
                fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize"
              }}>
                {t === "medios" ? "Medios de Pago" : t}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CUERPO DE CONTENIDO ── */}
      <div style={S.body}>
        
        {/* TAB: RESUMEN (Métricas principales) */}
        {tab === "resumen" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap:16 }}>
              <MetricCard icon={<TrendingUp size={18}/>} label="Venta Neta" value={fmt(totalVendido)} sub={`${ventasCobradas.length} cobros realizados`} color="var(--ink)" />
              <MetricCard icon={<ArrowUpRight size={18}/>} label="Promedio" value={fmt(ticketPromedio)} sub="Venta promedio por ticket" color="var(--sage)" />
              <MetricCard icon={<Tag size={18}/>} label="Descuentos" value={fmt(totalDescuentos)} sub="Total bonificado en el período" color="var(--amber)" />
              <MetricCard icon={<XCircle size={18}/>} label="Anuladas" value={ventasAnuladas.length.toString()} sub="Ventas canceladas con motivo" color="var(--rose)" />
            </div>

            <div style={{ background:"white", padding:24, borderRadius:24, border:"1px solid var(--cream-deep)", boxShadow: "0 10px 30px rgba(42,34,24,0.04)" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:20, color:"var(--ink)" }}>Recaudación por Medio de Pago</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mediosResumen.map((m, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems: "center", paddingBottom:14, borderBottom: i === mediosResumen.length -1 ? "none" : "1px solid var(--parchment)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--sage-light)" }} />
                      <span style={{ fontSize:14, fontWeight:500, color:"var(--ink-mid)" }}>{m.medio} {m.submedio && <small style={{color:"var(--ink-light)"}}>({m.submedio})</small>}</span>
                    </div>
                    <span style={{ fontWeight:700, fontSize:16, color:"var(--ink)" }}>{fmt(m.total)}</span>
                  </div>
                ))}
                {mediosResumen.length === 0 && <p style={{ color:"var(--ink-light)", fontSize:14, textAlign:"center", padding:20 }}>Sin movimientos en este rango.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB: VENTAS (Listado cronológico) */}
        {tab === "ventas" && (
          <div style={{ background:"white", borderRadius:20, border:"1px solid var(--cream-deep)", overflow:"hidden", boxShadow: "0 10px 30px rgba(42,34,24,0.04)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"var(--parchment)" }}>
                    <th style={S.th}>Horario</th>
                    <th style={S.th}>Ubicación / Mesa</th>
                    <th style={S.th}>Monto Total</th>
                    <th style={S.th}>Estado</th>
                    <th style={{ ...S.th, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v: VentaReporte) => (
                    <tr key={v.id} onClick={() => setVentaDetalle(v)} style={{ cursor:"pointer", transition: "background 0.2s" }} className="row-hover">
                      <td style={S.td}>
                        <div style={{fontWeight:600}}>{new Date(v.fecha_hora).toLocaleTimeString("es-AR", {hour:'2-digit', minute:'2-digit'})}</div>
                        <div style={{fontSize:11, color:"var(--ink-light)"}}>{new Date(v.fecha_hora).toLocaleDateString()}</div>
                      </td>
                      <td style={S.td}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:14 }}>{v.mesa?.nombre || "🏷️ Mostrador"}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, fontWeight:700, fontSize:15 }}>{fmt(v.total)}</td>
                      <td style={S.td}>
                        <span style={{ padding:"4px 10px", borderRadius:10, fontSize:10, fontWeight:700, textTransform:"uppercase", background: v.estado==="cobrada" ? "var(--sage-bg)" : v.estado==="anulada" ? "var(--rose-bg)" : "var(--amber-bg)", color: v.estado==="cobrada" ? "var(--sage)" : v.estado==="anulada" ? "var(--rose)" : "var(--amber)" }}>
                          {v.estado}
                        </span>
                      </td>
                      <td style={S.td}><ChevronRight size={16} color="var(--ink-light)" /></td>
                    </tr>
                  ))}
                  {ventas.length === 0 && !loadV && (
                    <tr><td colSpan={5} style={{ padding:40, textAlign:"center", color:"var(--ink-light)" }}>No se encontraron ventas con estos filtros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PRODUCTOS (Ranking) */}
        {tab === "productos" && (
          <div style={{ background:"white", borderRadius:20, border:"1px solid var(--cream-deep)", overflow:"hidden", boxShadow: "0 10px 30px rgba(42,34,24,0.04)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"var(--parchment)" }}>
                  <th style={{ ...S.th, width: 40 }}>Pos.</th>
                  <th style={S.th}>Producto</th>
                  <th style={{ ...S.th, textAlign:"right" }}>Vendidos</th>
                  <th style={{ ...S.th, textAlign:"right" }}>Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {productosRanking.map((p, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, color:"var(--ink-light)", fontWeight:600 }}>{i + 1}</td>
                    <td style={S.td}>
                      <div style={{fontWeight:600, fontSize:14}}>{p.nombre}</div>
                      <div style={{fontSize:11, color:"var(--ink-light)"}}>{p.categoria}</div>
                    </td>
                    <td style={{ ...S.td, textAlign:"right", fontWeight:500 }}>{p.total_cantidad}</td>
                    <td style={{ ...S.td, textAlign:"right", fontWeight:700, fontSize:15, color:"var(--ink)" }}>{fmt(p.total_facturado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: ANULACIONES (Historial con motivo) */}
        {tab === "anulaciones" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {ventasAnuladas.map((v: VentaReporte) => (
              <div key={v.id} onClick={() => setVentaDetalle(v)} style={{ background:"white", padding:20, borderRadius:20, border:"1px solid var(--rose-bg)", cursor:"pointer", transition: "transform 0.2s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"var(--rose-bg)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--rose)" }}>
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <strong style={{fontSize:18, color:"var(--ink)"}}>{fmt(v.total)}</strong>
                      <p style={{ fontSize:12, color:"var(--ink-light)" }}>{new Date(v.fecha_hora).toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize:10, fontWeight:800, color:"var(--rose)", background:"var(--rose-bg)", padding: "4px 8px", borderRadius:6, textTransform: "uppercase" }}>ANULADA</span>
                  </div>
                </div>
                <div style={{ marginTop:16, padding:12, background:"var(--parchment)", borderRadius:12, border:"1px solid var(--cream-deep)" }}>
                  <p style={{ fontSize:11, textTransform:"uppercase", color:"var(--ink-light)", fontWeight:700, marginBottom:4 }}>Motivo de la anulación:</p>
                  <p style={{ fontSize:13, color:"var(--ink-mid)", fontStyle:"italic" }}>&ldquo;{v.motivo_anulacion || "Sin motivo especificado"}&rdquo;</p>
                </div>
              </div>
            ))}
            {ventasAnuladas.length === 0 && <p style={{textAlign:"center", padding:60, color:"var(--ink-light)", fontFamily:"'Playfair Display', serif", fontSize:18, opacity: 0.6}}>No hay registros de anulaciones.</p>}
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE VENTA */}
      {ventaDetalle && (
        <ModalDetalleVenta 
          venta={ventaDetalle} 
          onCerrar={() => setVentaDetalle(null)} 
        />
      )}

      {/* Estilos Globales para Componente */}
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .row-hover:hover { background: var(--cream-bg) !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--cream-deep); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ── SUB-COMPONENTE: Tarjeta de Métrica ──
function MetricCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ 
      background: "white", padding: "24px", borderRadius: "24px", 
      border: "1px solid var(--cream-deep)", boxShadow: "0 10px 30px rgba(42,34,24,0.03)",
      display: "flex", flexDirection: "column", justifyContent: "center"
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, color:"var(--ink-light)" }}>
        <div style={{ color }}>{icon}</div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin:0 }}>{label}</p>
      </div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 600, color: color, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontSize: 12, color: "var(--ink-mid)", marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
        {sub}
      </p>
    </div>
  );
}