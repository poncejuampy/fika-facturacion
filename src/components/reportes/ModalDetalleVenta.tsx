"use client";

import { useState } from "react";
import { X, Printer } from "lucide-react";
import { useAnularVenta } from "@/hooks/useAnularVenta";
// CORRECCIÓN: Si están en la misma carpeta, se importa así con un solo punto.
import { ModalTicket } from "./ModalTicket"; 
import type { VentaReporte } from "@/hooks/useReportes";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function ModalDetalleVenta({ venta: ventaInicial, onCerrar }: { venta: VentaReporte; onCerrar: () => void }) {
  const [venta, setVenta] = useState<VentaReporte>(ventaInicial);
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [errorAnulacion, setErrorAnulacion] = useState("");
  const anular = useAnularVenta();

  const fecha = new Date(venta.fecha_hora);
  const mesaNombre = venta.mesa?.nombre;

  const handleAnular = async () => {
    setErrorAnulacion("");
    if (!motivoAnulacion.trim()) { setErrorAnulacion("El motivo es obligatorio"); return; }
    try {
      await anular.mutateAsync({ ventaId: venta.id, motivo: motivoAnulacion.trim() });
      setVenta(prev => ({ ...prev, estado: "anulada", motivo_anulacion: motivoAnulacion.trim() }));
      setMostrarAnulacion(false);
    } catch (e: unknown) {
      setErrorAnulacion(e instanceof Error ? e.message : "Error al anular");
    }
  };

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}
        onClick={onCerrar}>
        <div style={{ background:"var(--parchment)", borderRadius:18, width:"min(96vw,500px)", maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 70px rgba(42,34,24,0.35)", animation:"scaleIn 0.2s cubic-bezier(0.34,1.3,0.64,1)" }}
          onClick={e => e.stopPropagation()}>

          <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--ink)" }}>
                  {mesaNombre ? `Mesa ${mesaNombre}` : "Para llevar"}
                </p>
                <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700, textTransform:"uppercase",
                  background: venta.estado === "cobrada" ? "var(--sage-bg)" : "var(--rose-bg)",
                  color: venta.estado === "cobrada" ? "var(--sage)" : "var(--rose)",
                  border: `1px solid ${venta.estado === "cobrada" ? "var(--sage-light)" : "var(--rose)"}` }}>
                  {venta.estado}
                </span>
              </div>
              <p style={{ fontSize:12, color:"var(--ink-light)" }}>
                {fecha.toLocaleDateString("es-AR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
                {" · "}
                {fecha.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" })}
              </p>
            </div>
            <button onClick={onCerrar}
              style={{ width:32, height:32, borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)", flexShrink:0 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", fontWeight:600, marginBottom:10 }}>Productos</p>
            <div style={{ marginBottom:20 }}>
              {venta.items.map((item, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", borderBottom:"1px solid var(--cream-mid)", background: i%2===0 ? "transparent" : "var(--cream)" }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>{item.producto?.nombre}</span>
                    {item.variante && <span style={{ fontSize:11, color:"var(--ink-light)", marginLeft:6 }}>· {item.variante.nombre}</span>}
                    <div style={{ fontSize:11, color:"var(--ink-light)", marginTop:2 }}>
                      {item.producto?.tipo_venta === "peso"
                        ? `${Number(item.cantidad).toFixed(3)} kg × ${fmt(item.precio_unitario)}/kg`
                        : `${Math.round(item.cantidad)} × ${fmt(item.precio_unitario)}`}
                    </div>
                  </div>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:500, color:"var(--ink)" }}>{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", fontWeight:600, marginBottom:10 }}>Medios de pago</p>
            <div style={{ marginBottom:20 }}>
              {venta.pagos.map((pago, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:"var(--sage-bg)", borderRadius:8, marginBottom:6, border:"1px solid var(--sage-light)" }}>
                  <span style={{ fontSize:13, color:"var(--ink)" }}>
                    {pago.medio?.nombre}{pago.submedio && <span style={{ color:"var(--ink-light)", fontWeight:400 }}> · {pago.submedio.nombre}</span>}
                  </span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:500, color:"var(--ink)" }}>{fmt(pago.monto)}</span>
                </div>
              ))}
            </div>

            <div style={{ background:"var(--cream)", borderRadius:10, padding:"14px 16px", border:"1px solid var(--cream-deep)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:"var(--ink-light)" }}>Subtotal</span>
                <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>{fmt(venta.subtotal)}</span>
              </div>
              {venta.descuento_monto > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:12, color:"var(--sage)" }}>Descuento</span>
                  <span style={{ fontSize:13, color:"var(--sage)", fontWeight:500 }}>- {fmt(venta.descuento_monto)}</span>
                </div>
              )}
              <div style={{ height:1, background:"var(--cream-deep)", margin:"10px 0" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:"var(--ink)" }}>Total</span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:500, color:"var(--ink)" }}>{fmt(venta.total)}</span>
              </div>
            </div>

            {mostrarAnulacion && (
              <div style={{ marginTop:16, background:"var(--rose-bg)", borderRadius:12, padding:"16px 18px", border:"1px solid var(--rose)" }}>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--rose)", marginBottom:8 }}>Confirmar anulación</p>
                <input
                  value={motivoAnulacion}
                  onChange={e => setMotivoAnulacion(e.target.value)}
                  placeholder="Escribí el motivo aquí..."
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid var(--rose)", background:"white", fontSize:13, marginBottom:10, outline:"none" }}
                />
                {errorAnulacion && <p style={{ fontSize:12, color:"var(--rose)", marginBottom:8 }}>{errorAnulacion}</p>}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setMostrarAnulacion(false)} style={{ flex:1, padding:10, borderRadius:8, border:"1px solid var(--rose)", color:"var(--rose)", background:"none", cursor:"pointer" }}>Cancelar</button>
                  <button onClick={handleAnular} disabled={anular.isPending} style={{ flex:2, padding:10, borderRadius:8, border:"none", background:"var(--rose)", color:"white", cursor:"pointer" }}>{anular.isPending ? "Anulando..." : "Confirmar"}</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding:"14px 24px", borderTop:"1px solid var(--cream-deep)", display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={() => setMostrarTicket(true)} style={{ flex:1, padding:"12px", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <Printer size={16} /> Ver ticket
            </button>
            {venta.estado === "cobrada" && !mostrarAnulacion && (
              <button onClick={() => setMostrarAnulacion(true)} style={{ flex:1, padding:"12px", borderRadius:10, border:"1.5px solid var(--rose)", background:"var(--rose-bg)", color:"var(--rose)", fontWeight:600, cursor:"pointer" }}>Anular venta</button>
            )}
          </div>
        </div>
      </div>

      {/* AQUÍ SE RENDERIZA EL TICKET SI SE PIDE */}
      {mostrarTicket && <ModalTicket venta={venta} onCerrar={() => setMostrarTicket(false)} />}
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </>
  );
}