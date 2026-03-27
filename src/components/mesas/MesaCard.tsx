"use client";

import { useState } from "react";
import { useActualizarMesa } from "@/hooks/useActualizarMesa";
import type { Mesa } from "@/types/mesa";

const cfg: Record<string, { color: string; bg: string; label: string; borderTop: string }> = {
  libre:       { color:"var(--sage)",  bg:"var(--parchment)", label:"Libre",   borderTop:"var(--sage)" },
  ocupada:     { color:"var(--amber)", bg:"var(--amber-bg)",  label:"Ocupada", borderTop:"var(--amber)" },
  lista_cobro: { color:"var(--blue)",  bg:"var(--blue-bg)",   label:"Cobrar",  borderTop:"var(--blue)" },
  sucia:       { color:"#7a7670",      bg:"#f0eeec",          label:"Sucia",   borderTop:"#7a7670" },
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}

export function MesaCard({ mesa, onClickMesa }: { mesa: Mesa; onClickMesa: (m: Mesa) => void }) {
  const [hover, setHover] = useState(false);
  const actualizar = useActualizarMesa();
  const c = cfg[mesa.estado] ?? cfg.libre;

  const handleClick = () => {
    // Mesa sucia → limpiar directo sin abrir pedido
    if (mesa.estado === "sucia") {
      actualizar.mutate({ id: mesa.id, estado: "libre" });
      return;
    }
    onClickMesa(mesa);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: c.bg,
        border: `1.5px solid ${hover ? "var(--sage-light)" : "var(--cream-deep)"}`,
        borderRadius: 18,
        padding: "18px 16px 14px",
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        position: "relative",
        overflow: "hidden",
        minHeight: 130,
        display: "flex",
        flexDirection: "column",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover ? "0 8px 28px rgba(42,34,24,0.14)" : "0 2px 12px rgba(42,34,24,0.08)",
        userSelect: "none",
        opacity: actualizar.isPending ? 0.6 : 1,
      }}>

      {/* Barra de color superior */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:3,
        background: hover ? c.borderTop : "var(--cream-deep)",
        transition: "background 0.2s",
        borderRadius: "18px 18px 0 0",
      }} />

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:500, color:"var(--ink)", letterSpacing:"0.02em" }}>
          {mesa.nombre}
        </span>
        <span style={{
          fontSize:10, fontWeight:500, padding:"3px 8px", borderRadius:20,
          letterSpacing:"0.06em", textTransform:"uppercase",
          background: c.bg, color: c.color,
          border: `1px solid ${c.color}`,
        }}>
          {c.label}
        </span>
      </div>

      <div style={{ height:1, background:"var(--cream-deep)", marginBottom:10 }} />

      {/* Cuerpo */}
      {mesa.estado === "ocupada" && mesa.ocupada_desde ? (
        <div style={{ fontSize:12, color:"var(--ink-mid)", flex:1 }}>
          <div>Desde hace {timeAgo(mesa.ocupada_desde)}</div>
        </div>
      ) : (
        <div style={{
          fontSize:11, color: hover ? c.color : "var(--ink-light)",
          letterSpacing:"0.07em", textTransform:"uppercase", fontWeight:400,
          flex:1, display:"flex", alignItems:"flex-end",
          transition:"color 0.18s",
        }}>
          {mesa.estado === "libre"       && "Tap para nueva orden"}
          {mesa.estado === "lista_cobro" && "Listo para cobrar"}
          {mesa.estado === "sucia"       && (hover ? "Tap para limpiar ✓" : "Pendiente limpieza")}
        </div>
      )}
    </div>
  );
}