"use client";

import { useState } from "react";
import type { Producto } from "@/types/producto";

interface ModalPesoProps {
  producto: Producto;
  onConfirm: (monto: number) => void;
  onCancel: () => void;
}

export function ModalPeso({ producto, onConfirm, onCancel }: ModalPesoProps) {
  const [monto, setMonto] = useState("");
  const [modo, setModo] = useState<"pesos" | "kg">("pesos");

  const precioPorKg = producto.precio_unitario!;
  const montoNum = parseFloat(monto) || 0;

  const kgCalculados = modo === "pesos"
    ? montoNum / precioPorKg
    : montoNum;
  const montoCalculado = modo === "kg"
    ? montoNum * precioPorKg
    : montoNum;

  const handleTeclado = (val: string) => {
    if (val === "⌫") {
      setMonto((p) => p.slice(0, -1));
    } else if (val === "." && monto.includes(".")) {
      return;
    } else {
      setMonto((p) => p + val);
    }
  };

  const handleConfirm = () => {
    const m = modo === "pesos" ? montoNum : montoCalculado;
    if (m > 0) onConfirm(m);
  };

  const teclas = ["7","8","9","4","5","6","1","2","3",".",  "0","⌫"];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"var(--parchment)", borderRadius:18, padding:28, width:320, boxShadow:"0 20px 60px rgba(42,34,24,0.35)" }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:500, color:"var(--ink)" }}>
            {producto.nombre}
          </p>
          <p style={{ fontSize:12, color:"var(--ink-light)", marginTop:4 }}>
            ${precioPorKg.toLocaleString("es-AR")} / kg
          </p>
        </div>

        {/* Toggle modo */}
        <div style={{ display:"flex", gap:4, background:"var(--cream-mid)", padding:4, borderRadius:8, marginBottom:16 }}>
          {(["pesos","kg"] as const).map((m) => (
            <button key={m} onClick={() => { setModo(m); setMonto(""); }}
              style={{ flex:1, padding:"6px 0", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", background: modo===m ? "var(--parchment)" : "transparent", color: modo===m ? "var(--ink)" : "var(--ink-mid)", boxShadow: modo===m ? "0 1px 3px rgba(42,34,24,0.1)" : "none", transition:"all 0.15s" }}>
              {m === "pesos" ? "Ingresar $" : "Ingresar kg"}
            </button>
          ))}
        </div>

        {/* Display */}
        <div style={{ background:"var(--cream)", borderRadius:10, padding:"12px 16px", marginBottom:16, minHeight:72 }}>
          <p style={{ fontSize:11, color:"var(--ink-light)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>
            {modo === "pesos" ? "Monto en pesos" : "Cantidad en kg"}
          </p>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color: monto ? "var(--ink)" : "var(--ink-light)", fontWeight:500 }}>
            {monto || "0"}
            {modo === "pesos" ? " $" : " kg"}
          </p>
          {montoNum > 0 && (
            <p style={{ fontSize:11, color:"var(--sage)", marginTop:4 }}>
              {modo === "pesos"
                ? `≈ ${kgCalculados.toFixed(3)} kg`
                : `= $${montoCalculado.toLocaleString("es-AR")}`}
            </p>
          )}
        </div>

        {/* Teclado numérico */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8, marginBottom:16 }}>
          {teclas.map((t) => (
            <button key={t} onClick={() => handleTeclado(t)}
              style={{ padding:"14px 0", borderRadius:8, border:"1.5px solid var(--cream-deep)", background: t==="⌫" ? "var(--cream-mid)" : "var(--cream)", color:"var(--ink)", fontSize:18, fontFamily:"'Playfair Display',serif", fontWeight:500, cursor:"pointer", transition:"all 0.12s" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"12px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-mid)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={montoNum <= 0}
            style={{ flex:2, padding:"12px 0", borderRadius:10, border:"none", background: montoNum > 0 ? "var(--ink)" : "var(--cream-deep)", color: montoNum > 0 ? "var(--cream)" : "var(--ink-light)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor: montoNum > 0 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  );
}