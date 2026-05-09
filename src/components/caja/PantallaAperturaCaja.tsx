"use client";

import { useState } from "react";
import { useAbrirCaja } from "@/hooks/useSesionCaja";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function PantallaAperturaCaja() {
  const [fondo, setFondo] = useState("");
  const { empleado, signOut } = useAuth();
  const abrirCaja = useAbrirCaja();

  const handleAbrir = async () => {
    if (!fondo) return;
    try {
      await abrirCaja.mutateAsync(Number(fondo));
    } catch {
      alert("Error al abrir la caja");
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"var(--ink)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
      <div style={{ width:"min(94vw, 400px)", textAlign:"center" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:42, color:"var(--cream)", marginBottom:10 }}>Fika</p>
        <p style={{ fontSize:14, color:"var(--ink-light)", marginBottom:40 }}>Hola, {empleado?.nombre}. Iniciá el turno para empezar.</p>
        
        <div style={{ background:"rgba(242,235,224,0.05)", padding:30, borderRadius:20, border:"1px solid rgba(242,235,224,0.1)" }}>
          <label style={{ display:"block", color:"var(--ink-light)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Fondo inicial de caja ($)</label>
          <input 
            type="number" 
            value={fondo} 
            onChange={(e) => setFondo(e.target.value)}
            style={{ width:"100%", padding:15, borderRadius:12, background:"rgba(242,235,224,0.1)", border:"1px solid rgba(242,235,224,0.2)", color:"white", fontSize:24, textAlign:"center", marginBottom:20 }}
            placeholder="0.00"
          />
          <button 
            onClick={handleAbrir}
            disabled={!fondo || abrirCaja.isPending}
            style={{ width:"100%", padding:16, borderRadius:12, background:"var(--sage)", color:"white", fontWeight:700, cursor:"pointer", border:"none" }}
          >
            {abrirCaja.isPending ? "ABRIENDO..." : "ABRIR TURNO"}
          </button>
        </div>

        <button onClick={signOut} style={{ marginTop:30, background:"none", border:"none", color:"var(--rose)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, margin:"30px auto 0" }}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}