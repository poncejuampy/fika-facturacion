"use client";

import { useState } from "react";
import { useSesionActiva } from "@/hooks/useSesionCaja";
import { ModalCierreCaja } from "../caja/ModalCierreCaja";
import { useMesas, useFacturadoHoy } from "@/hooks/useMesas";
import { MesaCard } from "./MesaCard";
import { PanelPedido } from "../pedido/PanelPedido";
import type { Mesa } from "@/types/mesa";

export function MapaMesas() {
  const { data: mesas = [], isLoading, error } = useMesas();
  const { data: sesion } = useSesionActiva();
  const { data: facturadoHoy } = useFacturadoHoy();
  const [mostraCierre, setMostraCierre] = useState(false);
  const [panelMesa, setPanelMesa] = useState<Mesa | null | "takeaway">(null);

  const libres   = mesas.filter((m) => m.estado === "libre").length;
  const ocupadas = mesas.filter((m) => m.estado === "ocupada").length;

  if (isLoading) return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      <main style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>
        <div style={{ height:32, width:120, borderRadius:8, background:"var(--cream-mid)", marginBottom:20, animation:"shimmer 1.5s ease-in-out infinite" }} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:14 }}>
          {Array.from({length:8}).map((_,i) => (
            <div key={i} style={{ height:140, borderRadius:18, background:"var(--cream-mid)", animation:"shimmer 1.5s ease-in-out infinite", animationDelay:`${i*0.08}s` }} />
          ))}
        </div>
      </main>
      <aside style={{ width:230, background:"var(--parchment)", borderLeft:"1px solid var(--cream-deep)", padding:"20px 16px" }}>
        {Array.from({length:4}).map((_,i) => (
          <div key={i} style={{ height:70, borderRadius:8, background:"var(--cream-mid)", marginBottom:10, animation:"shimmer 1.5s ease-in-out infinite", animationDelay:`${i*0.1}s` }} />
        ))}
      </aside>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"var(--rose)", fontFamily:"'DM Sans',sans-serif" }}>Error al cargar las mesas</p>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

      {/* ── ÁREA DE MESAS ── */}
      <main style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>

        <div style={{ display:"flex", alignItems:"baseline", gap:20, marginBottom:20 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:500, color:"var(--ink)" }}>
            Mesas
          </h1>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <Chip tipo="total">{mesas.length} total</Chip>
            <span style={{ color:"var(--cream-deep)", fontSize:14 }}>·</span>
            <Chip tipo="libre">{libres} libres</Chip>
            <span style={{ color:"var(--cream-deep)", fontSize:14 }}>·</span>
            <Chip tipo="ocupada">{ocupadas} ocupadas</Chip>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:14 }}>
          {mesas.map((mesa) => (
            <MesaCard key={mesa.id} mesa={mesa}
              onClickMesa={(m) => setPanelMesa(m)} />
          ))}
        </div>
      </main>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:230, background:"var(--parchment)", borderLeft:"1px solid var(--cream-deep)", display:"flex", flexDirection:"column", padding:"20px 16px", gap:8, flexShrink:0, overflowY:"auto" }}>

        <p style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-light)", fontWeight:500, marginTop:8, marginBottom:4, paddingLeft:4 }}>
          Acciones rápidas
        </p>

        {/* PARA LLEVAR */}
        <button onClick={() => setPanelMesa("takeaway")}
          style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid var(--ink)", background:"var(--ink)", color:"var(--cream)", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, transition:"all 0.18s", letterSpacing:"0.01em" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15,opacity:0.8}}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          Para llevar
        </button>

        <button onClick={() => setPanelMesa("takeaway")}
          style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", color:"var(--ink-mid)", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, transition:"all 0.18s", letterSpacing:"0.01em" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15,opacity:0.6,flexShrink:0}}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.43H6"/></svg>
          Cobro rápido
        </button>

        <Divider />
        <p style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-light)", fontWeight:500, marginTop:8, marginBottom:4, paddingLeft:4 }}>
          Turno actual
        </p>

        <MetricCard label="Libres" value={libres} sub={`de ${mesas.length} mesas`} />
        <MetricCard label="Ocupadas" value={ocupadas} sub="sin órdenes abiertas" />
        <MetricCard label="Facturado hoy" value={facturadoHoy ? "$" + Math.round(facturadoHoy.total).toLocaleString("es-AR") : "$0"} sub={`${facturadoHoy?.cantidad ?? 0} venta${(facturadoHoy?.cantidad ?? 0) !== 1 ? "s" : ""} cobrada${(facturadoHoy?.cantidad ?? 0) !== 1 ? "s" : ""}`} />

        <Divider />
        <TurnoBox />
        <button onClick={() => setMostraCierre(true)}
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid rgba(181,98,90,0.4)", background:"var(--rose-bg)", color:"var(--rose)", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer", marginTop:8, transition:"all 0.18s" }}>
          Cerrar turno
        </button>
      </aside>

      {/* ── MODAL CIERRE CAJA ── */}
      {mostraCierre && sesion && (
        <ModalCierreCaja sesion={sesion} onCerrar={() => setMostraCierre(false)} />
      )}

      {/* ── PANEL DE PEDIDO ── */}
      {panelMesa !== null && (
        <PanelPedido
          mesa={panelMesa === "takeaway" ? null : panelMesa}
          onCerrar={() => setPanelMesa(null)}
        />
      )}
    </div>
  );
}

function Chip({ tipo, children }: { tipo:"total"|"libre"|"ocupada"; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    total:   { background:"var(--cream-mid)",  color:"var(--ink-mid)" },
    libre:   { background:"var(--sage-bg)",    color:"var(--sage)" },
    ocupada: { background:"var(--amber-bg)",   color:"var(--amber)" },
  };
  return (
    <span style={{ fontSize:12, padding:"3px 10px", borderRadius:20, fontWeight:500, letterSpacing:"0.03em", ...styles[tipo] }}>
      {children}
    </span>
  );
}


function MetricCard({ label, value, sub }: { label: string; value: string|number; sub: string }) {
  return (
    <div style={{ background:"var(--cream-mid)", borderRadius:8, padding:"12px 14px" }}>
      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:500, color:"var(--ink)" }}>{value}</div>
      <div style={{ fontSize:11, color:"var(--ink-light)", marginTop:2 }}>{sub}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:"var(--cream-deep)", margin:"6px 0" }} />;
}

function TurnoBox() {
  const n = new Date();
  const h = n.getHours() % 12 || 12;
  const m = String(n.getMinutes()).padStart(2, "0");
  const hora = `${h}:${m} ${n.getHours() >= 12 ? "p. m." : "a. m."}`;
  return (
    <div style={{ background:"var(--ink)", borderRadius:12, padding:14, marginTop:"auto" }}>
      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(242,235,224,0.5)", marginBottom:4 }}>Turno abierto</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--cream)" }}>{hora}</div>
      <div style={{ fontSize:11, color:"var(--sage-light)", display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--sage-light)", animation:"pulse 2s infinite" }} />
        En línea
      </div>
    </div>
  );
}