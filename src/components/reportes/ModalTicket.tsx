"use client";

import { X, Printer } from "lucide-react";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const linea = (char = "-", len = 32) => char.repeat(len);

export type VentaTicket = {
  id: string;
  fecha_hora: string;
  total: number;
  subtotal: number;
  descuento_monto: number;
  mesa: { nombre: string } | null;
  pagos: { monto: number; medio: { nombre: string | undefined } | null }[];
  items: {
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    producto: { nombre: string; tipo_venta: string } | null;
    variante: { nombre: string } | null | undefined;
  }[];
};

interface ModalTicketProps {
  venta: VentaTicket;
  onCerrar: () => void;
}

export function ModalTicket({ venta, onCerrar }: ModalTicketProps) {
  const fecha = new Date(venta.fecha_hora);
  const mesa = venta.mesa?.nombre;
  const fechaStr = fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:400 }}
      onClick={onCerrar}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"var(--parchment)", borderRadius:18, width:"min(96vw, 420px)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 70px rgba(42,34,24,0.35)", overflow:"hidden" }}>

        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"var(--ink)" }}>Vista previa del ticket</p>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => window.print()}
              style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"var(--ink)", color:"var(--cream)", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Printer size={13} /> Imprimir
            </button>
            <button onClick={onCerrar}
              style={{ width:32, height:32, borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", justifyContent:"center" }}>
          <div id="fika-ticket-print" style={{
            background:"white", width:280, padding:"20px 16px",
            fontFamily:"'Courier New', Courier, monospace", fontSize:13,
            lineHeight:1.5, color:"#111", boxShadow:"0 2px 20px rgba(0,0,0,0.12)",
          }}>
            <div style={{ textAlign:"center", marginBottom:12 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, letterSpacing:"0.04em", marginBottom:2 }}>Fika</p>
              <p style={{ fontSize:11, color:"#666" }}>Cafetería</p>
              <p style={{ fontSize:11, color:"#666" }}>Catamarca Capital</p>
            </div>

            <pre style={{ margin:0, fontFamily:"inherit", fontSize:11, color:"#aaa", textAlign:"center" }}>{linea("·")}</pre>

            <div style={{ fontSize:11, margin:"8px 0", color:"#555" }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Fecha:</span><span>{fechaStr}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Hora:</span><span>{horaStr}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>{mesa ? "Mesa:" : "Tipo:"}</span>
                <span>{mesa ? `Mesa ${mesa}` : "Para llevar"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Comprobante:</span>
                <span>#{venta.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            <pre style={{ margin:0, fontFamily:"inherit", fontSize:11, color:"#aaa", textAlign:"center" }}>{linea("-")}</pre>

            <div style={{ margin:"12px 0" }}>
              {venta.items.map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", marginBottom:10, fontSize:13 }}>
                  <div style={{ flex:1, paddingRight:8 }}>
                    <p style={{ margin:0 }}>
                      {item.producto?.nombre}
                      {item.variante ? ` (${item.variante.nombre})` : ""}
                    </p>
                    <p style={{ margin:0, fontSize:12, color:"#666" }}>
                      {item.producto?.tipo_venta === "peso"
                        ? `${Number(item.cantidad).toFixed(3)} kg`
                        : Math.round(item.cantidad)
                      } × {fmt(item.precio_unitario)}
                    </p>
                  </div>
                  <span style={{ minWidth:"70px", textAlign:"right", fontWeight:500 }}>{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <pre style={{ margin:0, fontFamily:"inherit", fontSize:11, color:"#aaa", textAlign:"center" }}>{linea("-")}</pre>

            <div style={{ margin:"10px 0", fontSize:12, color:"#333" }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Subtotal:</span><span>{fmt(venta.subtotal)}</span>
              </div>
              {venta.descuento_monto > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span>Descuento:</span><span>-{fmt(venta.descuento_monto)}</span>
                </div>
              )}
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:"bold", fontSize:16, margin:"10px 0", borderTop:"1px solid #ddd", paddingTop:8 }}>
              <span>TOTAL:</span><span>{fmt(venta.total)}</span>
            </div>

            <pre style={{ margin:0, fontFamily:"inherit", fontSize:11, color:"#aaa", textAlign:"center" }}>{linea("=")}</pre>

            <div style={{ margin:"12px 0" }}>
              <p style={{ fontSize:12, textTransform:"uppercase", letterSpacing:"0.05em", color:"#555", marginBottom:6 }}>Forma de pago:</p>
              {venta.pagos.map((p, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                  <span>{p.medio?.nombre ?? "—"}</span>
                  <span>{fmt(p.monto)}</span>
                </div>
              ))}
            </div>

            <pre style={{ margin:0, fontFamily:"inherit", fontSize:11, color:"#aaa", textAlign:"center" }}>{linea("-")}</pre>

            <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:"#888" }}>
              <p>¡Gracias por tu visita!</p>
              <p style={{ marginTop:4 }}>Fika — Catamarca</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #fika-ticket-print, #fika-ticket-print * { visibility: visible; }
          #fika-ticket-print {
            position: fixed !important;
            left: 0 !important; top: 0 !important;
            width: 80mm !important; padding: 4mm !important;
            font-size: 12px !important; box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
