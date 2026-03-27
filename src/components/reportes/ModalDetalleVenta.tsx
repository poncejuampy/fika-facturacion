"use client";

import { useState } from "react";
import { X, Printer, AlertTriangle } from "lucide-react";
import { useAnularVenta } from "@/hooks/useAnularVenta";
import { ModalTicket } from "./ModalTicket";
import type { VentaReporte } from "@/hooks/useReportes";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function ModalDetalleVenta({ venta: ventaInicial, onCerrar }: { venta: VentaReporte; onCerrar: () => void }) {
  const [venta, setVenta] = useState(ventaInicial);
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [errorAnulacion, setErrorAnulacion] = useState("");
  const anular = useAnularVenta();

  const fecha = new Date(venta.fecha_hora);
  const mesa = (venta.mesa as unknown as { nombre: string } | null)?.nombre;

  const handleAnular = async () => {
    setErrorAnulacion("");
    if (!motivoAnulacion.trim()) { setErrorAnulacion("El motivo es obligatorio"); return; }
    try {
      await anular.mutateAsync({ ventaId: venta.id, motivo: motivoAnulacion.trim() });
      setVenta(prev => ({ ...prev, estado: "anulada" }));
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

          {/* Header */}
          <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--ink)" }}>
                  {mesa ? `Mesa ${mesa}` : "Para llevar"}
                </p>
                <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:500,
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

          {/* Cuerpo */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>

            {/* Ítems */}
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", fontWeight:500, marginBottom:10 }}>Productos</p>
            <div style={{ marginBottom:20 }}>
              {(venta.items ?? []).map((item, i) => {
                const prod = item.producto as unknown as { nombre: string; tipo_venta: string };
                const variant = item.variante as unknown as { nombre: string } | null;
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", borderBottom:"1px solid var(--cream-mid)", background: i%2===0 ? "transparent" : "var(--cream)" }}>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>{prod?.nombre}</span>
                      {variant && <span style={{ fontSize:11, color:"var(--ink-light)", marginLeft:6 }}>· {variant.nombre}</span>}
                      <div style={{ fontSize:11, color:"var(--ink-light)", marginTop:2 }}>
                        {prod?.tipo_venta === "peso"
                          ? `${Number(item.cantidad).toFixed(3)} kg × ${fmt(item.precio_unitario)}/kg`
                          : `${Math.round(item.cantidad)} × ${fmt(item.precio_unitario)}`}
                      </div>
                    </div>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:500, color:"var(--ink)" }}>{fmt(item.subtotal)}</span>
                  </div>
                );
              })}
            </div>

            {/* Medios de pago */}
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", fontWeight:500, marginBottom:10 }}>Medios de pago</p>
            <div style={{ marginBottom:20 }}>
              {(venta.pagos ?? []).map((pago, i) => {
                const medio = pago.medio as unknown as { nombre: string };
                const sub = pago.submedio as unknown as { nombre: string } | null;
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:"var(--sage-bg)", borderRadius:8, marginBottom:6, border:"1px solid var(--sage-light)" }}>
                    <span style={{ fontSize:13, color:"var(--ink)" }}>
                      {medio?.nombre}{sub && <span style={{ color:"var(--ink-light)", fontWeight:400 }}> · {sub.nombre}</span>}
                    </span>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:500, color:"var(--ink)" }}>{fmt(pago.monto)}</span>
                  </div>
                );
              })}
            </div>

            {/* Totales */}
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

            {/* Panel de anulación */}
            {mostrarAnulacion && (
              <div style={{ marginTop:16, background:"var(--rose-bg)", borderRadius:12, padding:"16px 18px", border:"1px solid var(--rose)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <AlertTriangle size={15} color="var(--rose)" />
                  <p style={{ fontSize:13, fontWeight:500, color:"var(--rose)" }}>Confirmar anulación</p>
                </div>
                <p style={{ fontSize:12, color:"var(--rose)", marginBottom:12, opacity:0.8 }}>
                  Esta acción no se puede deshacer. La venta quedará marcada como anulada.
                </p>
                <input
                  value={motivoAnulacion}
                  onChange={e => setMotivoAnulacion(e.target.value)}
                  placeholder="Motivo de anulación (obligatorio)"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid var(--rose)", background:"white", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)", outline:"none", marginBottom:10 }}
                />
                {errorAnulacion && (
                  <p style={{ fontSize:12, color:"var(--rose)", marginBottom:8 }}>{errorAnulacion}</p>
                )}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setMostrarAnulacion(false); setMotivoAnulacion(""); setErrorAnulacion(""); }}
                    style={{ flex:1, padding:"9px 0", borderRadius:8, border:"1.5px solid var(--rose)", background:"transparent", color:"var(--rose)", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                    Cancelar
                  </button>
                  <button onClick={handleAnular} disabled={anular.isPending}
                    style={{ flex:2, padding:"9px 0", borderRadius:8, border:"none", background:"var(--rose)", color:"white", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor: anular.isPending ? "not-allowed" : "pointer", opacity: anular.isPending ? 0.6 : 1 }}>
                    {anular.isPending ? "Anulando…" : "Confirmar anulación"}
                  </button>
                </div>
              </div>
            )}

            <p style={{ fontSize:10, color:"var(--ink-light)", marginTop:14, fontFamily:"monospace", textAlign:"center" }}>
              ID: {venta.id}
            </p>
          </div>

          {/* Footer con acciones */}
          <div style={{ padding:"14px 24px", borderTop:"1px solid var(--cream-deep)", display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={() => setMostrarTicket(true)}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-mid)", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.15s" }}>
              <Printer size={13} />
              Ver ticket
            </button>

            {venta.estado === "cobrada" && !mostrarAnulacion && (
              <button onClick={() => setMostrarAnulacion(true)}
                style={{ flex:1, padding:"10px 0", borderRadius:10, border:"1.5px solid var(--rose)", background:"var(--rose-bg)", color:"var(--rose)", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.15s" }}>
                Anular venta
              </button>
            )}

            {venta.estado === "anulada" && (
              <div style={{ flex:1, padding:"10px 0", borderRadius:10, background:"var(--cream-mid)", color:"var(--ink-light)", fontSize:12, fontFamily:"'DM Sans',sans-serif", textAlign:"center" }}>
                Venta anulada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal ticket */}
      {mostrarTicket && (
        <ModalTicket venta={venta} onCerrar={() => setMostrarTicket(false)} />
      )}

      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </>
  );
}