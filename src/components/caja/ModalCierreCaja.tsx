"use client";

import { useState } from "react";
import { X, Printer, CheckCircle, AlertTriangle, Coins } from "lucide-react";
import { useCerrarCaja, useResumenSesion } from "@/hooks/useSesionCaja";
import { TicketCierreCaja } from "../reportes/TicketCierreCaja";
import type { SesionCaja } from "@/hooks/useSesionCaja";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function ModalCierreCaja({ sesion, onCerrar }: { sesion: SesionCaja; onCerrar: () => void }) {
  const [montoContado, setMontoContado] = useState<string>("");
  const [cambioSiguiente, setCambioSiguiente] = useState<string>("");
  const [verTicket, setVerTicket] = useState(false);
  const [paso, setPaso] = useState<"arqueo" | "exito">("arqueo");

  const { data: resumen } = useResumenSesion(sesion.id);
  const cerrar = useCerrarCaja();

  // Lógica de cálculos
  const montoNum = parseFloat(montoContado) || 0;
  const cambioNum = parseFloat(cambioSiguiente) || 0;
  const efectivoEsperado = (resumen?.porMedio?.["Efectivo"] ?? 0) + sesion.fondo_inicial;
  const diferencia = montoNum - efectivoEsperado;

  const handleConfirmarCierre = async () => {
    if (!montoContado) {
      alert("Debes ingresar el efectivo contado antes de cerrar.");
      return;
    }
    try {
      await cerrar.mutateAsync({
        sesionId: sesion.id,
        montoContado: montoNum,
        cambioSiguiente: cambioNum,
        diferencia
      });
      setPaso("exito");
    } catch {
      alert("Error al guardar el cierre en la base de datos.");
    }
  };

  if (paso === "exito") {
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
        <div style={{ background:"var(--parchment)", borderRadius:24, padding:40, textAlign:"center", width:420, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <CheckCircle size={64} color="var(--sage)" style={{ margin:"0 auto 20px" }} />
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, marginBottom:10 }}>Turno Finalizado</h2>
          <p style={{ color:"var(--ink-light)", marginBottom:30 }}>Los datos se enviaron correctamente.</p>
          <button onClick={() => window.location.reload()} style={{ width:"100%", padding:16, borderRadius:14, background:"var(--ink)", color:"white", border:"none", cursor:"pointer", fontWeight:600, fontSize:16 }}>
            ACEPTAR Y RECARGAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"var(--parchment)", borderRadius:24, width:"min(94vw, 520px)", maxHeight:"94vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 30px 80px rgba(0,0,0,0.4)" }}>
        
        <div style={{ padding:"20px 28px", borderBottom:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"var(--ink)" }}>Cierre de Turno</h2>
            <p style={{ fontSize:11, color:"var(--ink-light)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Resumen Operativo</p>
          </div>
          <button onClick={onCerrar} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--ink-light)" }}><X size={24}/></button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {/* 1. VENTAS POR MEDIO (INFO) */}
          <div style={{ background:"var(--cream-mid)", padding:16, borderRadius:16, marginBottom:24, border:"1px solid var(--cream-deep)" }}>
            <p style={{ fontSize:10, color:"var(--ink-light)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12, fontWeight:600 }}>Ventas registradas</p>
            {Object.entries(resumen?.porMedio || {}).map(([medio, total]) => (
              <div key={medio} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:14, color:"var(--ink-mid)" }}>{medio}</span>
                <strong style={{ fontSize:14, color:"var(--ink)" }}>{fmt(total as number)}</strong>
              </div>
            ))}
          </div>

          {/* 2. INPUTS DE ARQUEO */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
            <div>
              <label style={{ fontSize:11, color:"var(--ink-mid)", display:"block", marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Efectivo en Caja ($)</label>
              <input 
                type="number" 
                value={montoContado} 
                onChange={e => setMontoContado(e.target.value)} 
                placeholder="0"
                style={{ width:"100%", padding:14, borderRadius:12, border:"2px solid var(--cream-deep)", fontSize:18, fontWeight:700, textAlign:"center", outline:"none", background:"white" }} 
              />
            </div>
            <div>
              <label style={{ fontSize:11, color:"var(--ink-mid)", display:"block", marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Cambio Mañana ($)</label>
              <input 
                type="number" 
                value={cambioSiguiente} 
                onChange={e => setCambioSiguiente(e.target.value)} 
                placeholder="0"
                style={{ width:"100%", padding:14, borderRadius:12, border:"2px solid var(--cream-deep)", fontSize:18, fontWeight:700, textAlign:"center", outline:"none", background:"white" }} 
              />
            </div>
          </div>

          {/* 3. DIFERENCIA (SÓLO SI HAY INPUT) */}
          {montoContado !== "" && (
            <div style={{ padding:14, borderRadius:14, background: diferencia >= 0 ? "var(--sage-bg)" : "var(--rose-bg)", marginBottom:24, border:`1px solid ${diferencia >= 0 ? "var(--sage-light)" : "var(--rose)"}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {diferencia < 0 ? <AlertTriangle size={18} color="var(--rose)" /> : <Coins size={18} color="var(--sage)" />}
                <span style={{ fontSize:14, fontWeight:600, color: diferencia >= 0 ? "var(--sage)" : "var(--rose)" }}>
                  {diferencia === 0 ? "Caja Exacta" : diferencia > 0 ? "Sobrante" : "Faltante"}
                </span>
              </div>
              <strong style={{ fontSize:16, color: diferencia >= 0 ? "var(--sage)" : "var(--rose)" }}>
                {fmt(Math.abs(diferencia))}
              </strong>
            </div>
          )}

          {/* 4. VISTA PREVIA TICKET */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
             <button 
              onClick={() => setVerTicket(!verTicket)} 
              style={{ padding:14, borderRadius:14, border:"1.5px solid var(--ink)", background: verTicket ? "var(--ink)" : "white", color: verTicket ? "white" : "var(--ink)", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}
             >
                <Printer size={18} /> {verTicket ? "Ocultar Ticket" : "Ver e Imprimir Ticket de Cierre"}
             </button>

             {verTicket && (
               <div style={{ border:"1px solid var(--cream-deep)", borderRadius:16, padding:15, background:"white", animation: "slideDown 0.3s ease-out" }}>
                  <button onClick={() => window.print()} style={{ width:"100%", padding:12, background:"var(--sage)", color:"white", border:"none", borderRadius:10, marginBottom:15, cursor:"pointer", fontWeight:700, fontSize:14 }}>
                    IMPRIMIR AHORA
                  </button>
                  <div id="cierre-preview" style={{ display:"flex", justifyContent:"center" }}>
                    <TicketCierreCaja 
                      sesionCaja={sesion} 
                      ventas={resumen?.ventasRaw || []} 
                      arqueo={{ 
                        efectivoContado: montoNum, 
                        diferencia: diferencia, 
                        cambioSiguiente: cambioNum 
                      }} 
                    />
                  </div>
               </div>
             )}

             <button 
                onClick={handleConfirmarCierre} 
                disabled={montoContado === "" || cerrar.isPending}
                style={{ padding:20, borderRadius:16, background:"var(--ink)", color:"white", border:"none", cursor: (montoContado === "" || cerrar.isPending) ? "not-allowed" : "pointer", fontWeight:700, fontSize:15, marginTop: 10, opacity: montoContado === "" ? 0.5 : 1 }}
             >
                {cerrar.isPending ? "GUARDANDO..." : "CONFIRMAR Y FINALIZAR TURNO"}
             </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          body * { visibility: hidden; }
          #cierre-preview, #cierre-preview * { visibility: visible; }
          #cierre-preview { position: fixed; left: 0; top: 0; width: 80mm; padding: 0; margin: 0; }
        }
      `}</style>
    </div>
  );
}