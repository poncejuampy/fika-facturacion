"use client";

import { useState } from "react";
import { X, CheckCircle, Trash2, Plus } from "lucide-react";
import { useCobrar, type MedioPagoSeleccionado } from "@/hooks/useCobrar";
import { useMediosPago } from "@/hooks/useMediosPago";
import { ModalTicket, type VentaTicket } from "@/components/reportes/ModalTicket";
import type { ItemCarrito } from "@/types/producto";
import type { Mesa } from "@/types/mesa";

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

export function ModalCobro(props: ModalCobroProps) {
  const { data: mediosGuardados = [] } = useMediosPago();
  const [pagos, setPagos] = useState<MedioPagoSeleccionado[]>([]);
  const [ventaExitosa, setVentaExitosa] = useState<VentaTicket | null>(null);

  // Controles de pago — medioId se deriva del primer medio disponible si no hay selección
  const [medioIdOverride, setMedioId] = useState("");
  const medioId = medioIdOverride || mediosGuardados[0]?.id || "";

  const [submedioId, setSubmedioId] = useState("");
  const [montoPago, setMontoPago] = useState(props.total.toString());

  const { mutate, isPending } = useCobrar();
  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

  // Cálculos
  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const restante = Math.max(0, props.total - totalPagado);

  const handleAgregarPago = () => {
    const m = parseFloat(montoPago);
    if (!medioId || isNaN(m) || m <= 0) return;

    setPagos([...pagos, { medio_pago_id: medioId, submedio_pago_id: submedioId || undefined, monto: m }]);
    setSubmedioId("");
    const nuevoRestante = Math.max(0, restante - m);
    setMontoPago(nuevoRestante > 0 ? nuevoRestante.toString() : "");
  };

  const handleFinalizar = () => {
    if (restante > 0) return;

    mutate({
      mesa: props.mesa,
      items: props.items,
      subtotal: props.subtotal,
      total: props.total,
      descuento_monto: props.descuento_monto,
      descuento_tipo: props.descuento_tipo,
      descuento_valor: props.descuento_valor,
      descuento_motivo: props.descuento_motivo,
      pagos,
      estado: "cobrada",
    }, {
      onSuccess: (id) => {
        setVentaExitosa({
          id,
          fecha_hora: new Date().toISOString(),
          total: props.total,
          subtotal: props.subtotal,
          descuento_monto: props.descuento_monto,
          mesa: props.mesa ? { nombre: props.mesa.nombre } : null,
          items: props.items.map(item => ({
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
            producto: { nombre: item.producto.nombre, tipo_venta: item.producto.tipo_venta },
            variante: item.variante ? { nombre: item.variante.nombre } : null,
          })),
          pagos: pagos.map(p => {
            const m = mediosGuardados.find(x => x.id === p.medio_pago_id);
            return { monto: p.monto, medio: { nombre: m?.nombre } };
          }),
        });
      },
    });
  };

  // ── PANTALLA DE ÉXITO Y TICKET ──
  if (ventaExitosa) {
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
        <div style={{ background:"var(--parchment)", borderRadius:24, width:400, padding:40, textAlign:"center" }}>
          <CheckCircle size={64} color="var(--sage)" style={{ margin:"0 auto 20px" }} />
          <h2 style={{ fontFamily:"'Playfair Display',serif", color:"var(--ink)", marginBottom:10 }}>¡Cobro exitoso!</h2>
          <p style={{ color:"var(--ink-light)", marginBottom:30 }}>La venta se ha registrado correctamente.</p>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={() => window.print()} style={{ width:"100%", padding:14, background:"var(--ink)", color:"white", borderRadius:10, border:"none", cursor:"pointer", fontWeight:600 }}>
              IMPRIMIR TICKET
            </button>
            <button onClick={() => props.onExito(ventaExitosa.id)} style={{ width:"100%", padding:14, background:"transparent", color:"var(--ink)", border:"1px solid var(--ink)", borderRadius:10, cursor:"pointer", fontWeight:600 }}>
              Cerrar y volver a mesas
            </button>
          </div>

          <div style={{ display:"none" }}>
            <ModalTicket venta={ventaExitosa} onCerrar={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  // ── PANTALLA DE COBRO NORMAL ──
  const medioSeleccionadoData = mediosGuardados.find(m => m.id === medioId);
  const submediosDisponibles = medioSeleccionadoData?.submedios ?? [];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"var(--parchment)", borderRadius:20, width:"min(94vw, 440px)", padding:24, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22 }}>Confirmar Cobro</h2>
          <button onClick={props.onCancelar} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--ink-light)" }}><X /></button>
        </div>

        {/* Resumen Total */}
        <div style={{ background:"white", padding:20, borderRadius:16, marginBottom:20, border:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontSize:11, color:"var(--ink-light)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>A cobrar</p>
            <p style={{ fontSize:28, fontWeight:700, fontFamily:"'Playfair Display',serif", color:"var(--ink)" }}>{fmt(props.total)}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:11, color:"var(--ink-light)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Restante</p>
            <p style={{ fontSize:20, fontWeight:700, fontFamily:"'Playfair Display',serif", color: restante > 0 ? "var(--rose)" : "var(--sage)" }}>{fmt(restante)}</p>
          </div>
        </div>

        {/* Lista de pagos agregados */}
        {pagos.length > 0 && (
          <div style={{ marginBottom:20, background:"var(--cream)", borderRadius:12, padding:12 }}>
            <p style={{ fontSize:10, textTransform:"uppercase", color:"var(--ink-light)", fontWeight:600, marginBottom:8 }}>Pagos registrados</p>
            {pagos.map((p, idx) => {
              const nombreMedio = mediosGuardados.find(m => m.id === p.medio_pago_id)?.nombre;
              return (
                <div key={idx} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom: idx === pagos.length - 1 ? "none" : "1px solid var(--cream-deep)" }}>
                  <span style={{ fontSize:13 }}>{nombreMedio}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontWeight:600 }}>{fmt(p.monto)}</span>
                    <button onClick={() => setPagos(pagos.filter((_, i) => i !== idx))} style={{ background:"none", border:"none", color:"var(--rose)", cursor:"pointer", padding:4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulario Agregar Pago */}
        {restante > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <select value={medioId} onChange={e => { setMedioId(e.target.value); setSubmedioId(""); }} style={{ padding:12, borderRadius:10, border:"1px solid var(--cream-deep)", outline:"none", fontSize:13 }}>
                <option value="" disabled>Seleccionar medio...</option>
                {mediosGuardados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>

              {submediosDisponibles.length > 0 ? (
                <select value={submedioId} onChange={e => setSubmedioId(e.target.value)} style={{ padding:12, borderRadius:10, border:"1px solid var(--cream-deep)", outline:"none", fontSize:13 }}>
                  <option value="">(Opcional) Tarjeta...</option>
                  {submediosDisponibles.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              ) : (
                <input type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)} placeholder="Monto" style={{ padding:12, borderRadius:10, border:"1px solid var(--cream-deep)", outline:"none", fontSize:14, fontWeight:600 }} />
              )}
            </div>

            {submediosDisponibles.length > 0 && (
              <input type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)} placeholder="Monto a pagar" style={{ width:"100%", padding:12, borderRadius:10, border:"1px solid var(--cream-deep)", outline:"none", fontSize:14, fontWeight:600, marginBottom:10 }} />
            )}

            <button onClick={handleAgregarPago} disabled={!medioId || !montoPago} style={{ width:"100%", padding:12, background:"white", border:"1px solid var(--ink)", borderRadius:10, fontWeight:600, cursor: (!medioId || !montoPago) ? "not-allowed" : "pointer", display:"flex", justifyContent:"center", gap:8 }}>
              <Plus size={16} /> Añadir Pago
            </button>
          </div>
        )}

        {/* Botón Final */}
        <button
          onClick={handleFinalizar}
          disabled={isPending || restante > 0}
          style={{ width:"100%", padding:18, borderRadius:14, background: restante > 0 ? "var(--cream-deep)" : "var(--ink)", color: restante > 0 ? "var(--ink-light)" : "white", border:"none", fontWeight:700, cursor: (isPending || restante > 0) ? "not-allowed" : "pointer", fontSize:16, transition:"background 0.2s" }}
        >
          {isPending ? "Procesando..." : restante > 0 ? `Falta cobrar ${fmt(restante)}` : "FINALIZAR VENTA"}
        </button>
      </div>
    </div>
  );
}
