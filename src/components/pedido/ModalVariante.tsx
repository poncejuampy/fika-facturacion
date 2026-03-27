"use client";

import type { Producto, VarianteProducto } from "@/types/producto";

interface ModalVarianteProps {
  producto: Producto;
  variantes: VarianteProducto[];
  onConfirm: (variante: VarianteProducto) => void;
  onCancel: () => void;
}

export function ModalVariante({ producto, variantes, onConfirm, onCancel }: ModalVarianteProps) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"var(--parchment)", borderRadius:18, padding:28, width:300, boxShadow:"0 20px 60px rgba(42,34,24,0.35)" }}>

        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:500, color:"var(--ink)", marginBottom:6 }}>
          {producto.nombre}
        </p>
        <p style={{ fontSize:12, color:"var(--ink-light)", marginBottom:20, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          Elegí el tamaño
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {variantes.map((v) => (
            <button key={v.id} onClick={() => onConfirm(v)}
              style={{ padding:"16px 20px", borderRadius:12, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500, color:"var(--ink)" }}>
                {v.nombre}
              </span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:500, color:"var(--ink)" }}>
                ${v.precio.toLocaleString("es-AR")}
              </span>
            </button>
          ))}
        </div>

        <button onClick={onCancel}
          style={{ marginTop:16, width:"100%", padding:"11px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-mid)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}