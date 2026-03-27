"use client";

import { useState } from "react";
import { X, Check, Plus, Trash2, Printer } from "lucide-react";
import { useMediosPago, useSubmediosPago } from "@/hooks/useMediosPago";
import { useCobrar, type MedioPagoSeleccionado } from "@/hooks/useCobrar";
import { ModalTicket } from "@/components/reportes/ModalTicket";
import type { ItemCarrito } from "@/types/producto";
import type { Mesa } from "@/types/mesa";
import type { VentaReporte } from "@/hooks/useReportes";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

interface ModalCobroProps {
  mesa: Mesa | null;
  items: ItemCarrito[];
  subtotal: number;
  total: number;
  descuento_monto: number;
  descuento_tipo: "fijo" | "porcentaje" | null;
  descuento_valor: number;
  descuento_motivo: string;
  onExito: (ventaId: string) => void;
  onCancelar: () => void;
}

export function ModalCobro({
  mesa, items, subtotal, total,
  descuento_monto, descuento_tipo, descuento_valor, descuento_motivo,
  onExito, onCancelar,
}: ModalCobroProps) {
  const { data: medios = [] } = useMediosPago();
  const { data: submedios = [] } = useSubmediosPago();
  const cobrar = useCobrar();

  const [pagos, setPagos] = useState<MedioPagoSeleccionado[]>([]);
  const [medioActual, setMedioActual] = useState<string>("");
  const [submedioActual, setSubmedioActual] = useState<string>("");
  const [montoActual, setMontoActual] = useState<string>("");
  const [paso, setPaso] = useState<"seleccionar" | "procesando" | "exito" | "error">("seleccionar");
  const [errorMsg, setErrorMsg] = useState("");
  const [ventaGuardada, setVentaGuardada] = useState<VentaReporte | null>(null);
  const [mostrarTicket, setMostrarTicket] = useState(false);

  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const restante = total - totalPagado;
  const listo = Math.abs(restante) < 0.01 || restante < 0;

  const submediosFiltrados = submedios.filter(
    (s) => s.medio_pago_id === medioActual
  );
  const medioSeleccionado = medios.find((m) => m.id === medioActual);

  const agregarPago = () => {
    const monto = parseFloat(montoActual) || restante;
    if (!medioActual || monto <= 0) return;

    setPagos((prev) => [
      ...prev,
      {
        medio_pago_id: medioActual,
        submedio_pago_id: submedioActual || undefined,
        monto: Math.min(monto, restante > 0 ? restante : monto),
      },
    ]);
    setMedioActual("");
    setSubmedioActual("");
    setMontoActual("");
  };

  const quitarPago = (idx: number) => {
    setPagos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCobrar = async () => {
    if (!listo) return;
    setPaso("procesando");
    try {
      const ventaId = await cobrar.mutateAsync({
        mesa,
        items,
        subtotal,
        total,
        descuento_monto,
        descuento_tipo,
        descuento_valor,
        descuento_motivo,
        pagos,
      });
      // Construir objeto de venta para el ticket
      const ventaObj: VentaReporte = {
        id: ventaId,
        fecha_hora: new Date().toISOString(),
        total,
        subtotal,
        descuento_monto,
        descuento: descuento_monto,
        estado: "cobrada",
        mesa: mesa ? { nombre: mesa.nombre } : null,
        pagos: pagos.map((p, idx) => {
          const m = medios.find(m => m.id === p.medio_pago_id);
          return {
            id: `pago-${idx}`,
            monto: p.monto,
            medio_pago: m ? m.nombre : "—",
            medio: m ?? { nombre: "—" },
            submedio: submedios.find(s => s.id === p.submedio_pago_id) ?? null,
          };
        }),
        items: items.map((item, idx) => ({
          id: `item-${idx}`,
          cantidad: item.cantidad,
          cantidad_kg: null,
          precio_unitario: item.precio_unitario,
          precio_total: item.subtotal,
          subtotal: item.subtotal,
          producto_nombre: item.producto.nombre,
          variante_nombre: item.variante ? item.variante.nombre : null,
          producto: { nombre: item.producto.nombre, tipo_venta: item.producto.tipo_venta },
          variante: item.variante ? { nombre: item.variante.nombre } : null,
        })),
      };
      setVentaGuardada(ventaObj);
      setPaso("exito");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar la venta";
      setErrorMsg(msg);
      setPaso("error");
    }
  };

  // ── Pantalla de éxito ─────────────────────────────
  if (paso === "exito" && ventaGuardada) {
    return (
      <>
        <Overlay>
          <div style={{ width:"min(96vw,380px)", padding:"32px 28px", textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--sage-bg)", border:"2px solid var(--sage)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <Check size={24} color="var(--sage)" />
            </div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"var(--ink)", marginBottom:6 }}>
              ¡Venta registrada!
            </p>
            <p style={{ fontSize:13, color:"var(--ink-light)", marginBottom:24 }}>
              {mesa ? `Mesa ${mesa.nombre}` : "Para llevar"} · {fmt(total)}
            </p>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button onClick={() => setMostrarTicket(true)}
                style={{ width:"100%", padding:"12px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", color:"var(--ink)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.15s" }}>
                <Printer size={15} />
                Ver e imprimir ticket
              </button>
              <button onClick={() => onExito(ventaGuardada.id)}
                style={{ width:"100%", padding:"12px 0", borderRadius:10, border:"none", background:"var(--ink)", color:"var(--cream)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.15s" }}>
                Cerrar
              </button>
            </div>
          </div>
        </Overlay>
        {mostrarTicket && (
          <ModalTicket venta={ventaGuardada} onCerrar={() => setMostrarTicket(false)} />
        )}
      </>
    );
  }

  // ── Pantalla de error ─────────────────────────────
  if (paso === "error") {
    return (
      <Overlay>
        <div style={{ padding:28, maxWidth:360 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--rose)", marginBottom:12 }}>
            Error al cobrar
          </p>
          <p style={{ fontSize:12, color:"var(--ink-mid)", marginBottom:20, fontFamily:"monospace", background:"var(--cream-mid)", padding:"10px 12px", borderRadius:8 }}>
            {errorMsg}
          </p>
          <button onClick={() => setPaso("seleccionar")}
            style={{ width:"100%", padding:"11px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"var(--ink)", color:"var(--cream)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            Reintentar
          </button>
        </div>
      </Overlay>
    );
  }

  // ── Pantalla principal ────────────────────────────
  return (
    <Overlay>
      <div style={{ width:"min(96vw, 480px)", maxHeight:"90vh", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--ink)" }}>
              Cobrar
            </p>
            <p style={{ fontSize:12, color:"var(--ink-light)", marginTop:2 }}>
              {mesa ? `Mesa ${mesa.nombre}` : "Para llevar"}
            </p>
          </div>
          <button onClick={onCancelar}
            style={{ width:32, height:32, borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>

          {/* Resumen de total */}
          <div style={{ background:"var(--cream)", borderRadius:12, padding:"14px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-light)" }}>Total a cobrar</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:500, color:"var(--ink)" }}>
              {fmt(total)}
            </span>
          </div>

          {/* Pagos agregados */}
          {pagos.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", marginBottom:8 }}>
                Pagos registrados
              </p>
              {pagos.map((p, i) => {
                const medio = medios.find((m) => m.id === p.medio_pago_id);
                const sub = submedios.find((s) => s.id === p.submedio_pago_id);
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"var(--sage-bg)", borderRadius:8, marginBottom:6, border:"1px solid var(--sage-light)" }}>
                    <span style={{ fontSize:13, color:"var(--ink)" }}>
                      {medio?.nombre}{sub ? ` · ${sub.nombre}` : ""}
                    </span>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:"var(--ink)" }}>{fmt(p.monto)}</span>
                      <button onClick={() => quitarPago(i)}
                        style={{ background:"transparent", border:"none", cursor:"pointer", color:"var(--ink-light)", padding:2 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderRadius:8, marginTop:8,
                background: restante > 0.01 ? "var(--amber-bg)" : restante < -0.01 ? "var(--sage-bg)" : "var(--sage-bg)",
                border: `1px solid ${restante > 0.01 ? "var(--amber-light)" : "var(--sage-light)"}` }}>
                <span style={{ fontSize:13, fontWeight:500, color: restante > 0.01 ? "var(--amber)" : "var(--sage)" }}>
                  {restante > 0.01 ? "Falta pagar" : restante < -0.01 ? "💵 Vuelto a dar" : "✓ Monto exacto"}
                </span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:500, color: restante > 0.01 ? "var(--amber)" : "var(--sage)" }}>
                  {fmt(Math.abs(restante))}
                </span>
              </div>
            </div>
          )}

          {/* Agregar pago */}
          {!listo && (
            <div style={{ background:"var(--cream-mid)", borderRadius:12, padding:"14px 16px", marginBottom:8 }}>
              <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", marginBottom:12 }}>
                {pagos.length === 0 ? "Seleccioná el medio de pago" : "Agregar otro medio"}
              </p>

              {/* Medios de pago */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                {medios.map((m) => (
                  <button key={m.id} onClick={() => { setMedioActual(m.id); setSubmedioActual(""); }}
                    style={{ padding:"7px 14px", borderRadius:20, border: medioActual===m.id ? "1.5px solid var(--ink)" : "1.5px solid var(--cream-deep)", background: medioActual===m.id ? "var(--ink)" : "var(--parchment)", color: medioActual===m.id ? "var(--cream)" : "var(--ink-mid)", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.15s" }}>
                    {m.nombre}
                  </button>
                ))}
              </div>

              {/* Submedios (si corresponde) */}
              {submediosFiltrados.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                  {submediosFiltrados.map((s) => (
                    <button key={s.id} onClick={() => setSubmedioActual(s.id)}
                      style={{ padding:"5px 10px", borderRadius:16, border: submedioActual===s.id ? "1.5px solid var(--amber)" : "1.5px solid var(--cream-deep)", background: submedioActual===s.id ? "var(--amber-bg)" : "transparent", color: submedioActual===s.id ? "var(--amber)" : "var(--ink-light)", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.15s" }}>
                      {s.nombre}
                    </button>
                  ))}
                </div>
              )}

              {/* Monto parcial */}
              {medioActual && (
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <input
                      type="number"
                      placeholder={`${fmt(restante)} (completo)`}
                      value={montoActual}
                      onChange={(e) => setMontoActual(e.target.value)}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"var(--parchment)", color:"var(--ink)", fontSize:14, fontFamily:"'Playfair Display',serif", outline:"none" }}
                    />
                  </div>
                  <button onClick={agregarPago}
                    style={{ width:38, height:38, borderRadius:8, border:"none", background:"var(--ink)", color:"var(--cream)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px", borderTop:"1px solid var(--cream-deep)", flexShrink:0 }}>
          <button onClick={handleCobrar} disabled={!listo || paso === "procesando"}
            style={{ width:"100%", padding:"14px 0", borderRadius:12, border:"none", background: listo ? "var(--ink)" : "var(--cream-deep)", color: listo ? "var(--cream)" : "var(--ink-light)", fontSize:15, fontWeight:500, fontFamily:"'Playfair Display',serif", cursor: listo ? "pointer" : "not-allowed", transition:"all 0.15s", letterSpacing:"0.02em" }}>
            {paso === "procesando" ? "Guardando…" : listo ? `Confirmar cobro · ${fmt(total)}` : `Falta ${fmt(restante)}`}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--parchment)", borderRadius:18, overflow:"hidden", boxShadow:"0 24px 70px rgba(42,34,24,0.35)", animation:"scaleIn 0.2s cubic-bezier(0.34,1.3,0.64,1)" }}>
        {children}
      </div>
      <style>{`@keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}