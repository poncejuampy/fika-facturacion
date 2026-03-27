"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { SesionCaja } from "@/hooks/useSesionCaja";
import type { VentaReporte } from "@/hooks/useReportes";

type ArqueoData = {
  efectivoContado: number;
  diferencia: number;
  cambioSiguiente: number;
};

type Props = {
  sesionCaja: SesionCaja;
  ventas: VentaReporte[];
  arqueo: ArqueoData;
};

export function TicketCierreCaja({ sesionCaja, ventas, arqueo }: Props) {
  const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

  const totalPorMedioPago = ventas.reduce((acc, v) => {
    v.pagos.forEach((p) => {
      acc[p.medio_pago] = (acc[p.medio_pago] || 0) + p.monto;
    });
    return acc;
  }, {} as Record<string, number>);

  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const efectivoEnVentas = totalPorMedioPago['Efectivo'] || 0;
  const totalEsperado = sesionCaja.fondo_inicial + efectivoEnVentas;

  return (
    <div style={{ background:"white", color:"#2A2218", fontFamily:"'Courier Prime', monospace, sans-serif", padding:28, width:380, margin:"auto" }} id="fika-cierre-print">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Courier+Prime&family=Playfair+Display:wght@600&display=swap');`}</style>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:600, margin:0 }}>Fika</p>
        <p>Cafetería</p>
        <p>Catamarca Capital</p>
        <p style={{ marginTop:16, borderTop:"1px dashed #5C4F3E", paddingTop:16, textTransform:"uppercase", fontWeight:"bold" }}>Cierre de Turno</p>
      </div>

      <div style={{ fontSize:13, marginBottom:20 }}>
        <p><strong>Inicio:</strong> {format(new Date(sesionCaja.abierta_en), "dd/MM/yy HH:mm", { locale: es })}</p>
        <p><strong>Fin:</strong> {format(sesionCaja.cerrada_en ? new Date(sesionCaja.cerrada_en) : new Date(), "dd/MM/yy HH:mm", { locale: es })}</p>
        <p><strong>Turno ID:</strong> {sesionCaja.id.slice(0,8).toUpperCase()}</p>
      </div>

      <div style={{ borderTop:"1px dashed #5C4F3E", paddingTop:20, marginTop:20 }}>
        <h3 style={{ textTransform:"uppercase", textAlign:"center", marginBottom:16, fontSize:15, letterSpacing:"0.05em" }}>Resumen de Ventas</h3>
        <p style={{ display:"flex", justifyContent:"space-between" }}><span>Ventas del turno:</span> <strong>{ventas.length}</strong></p>
        <div style={{ marginTop:16, borderTop:"1px solid #EAE0D3", paddingTop:16, display:"flex", flexDirection:"column", gap:4, fontSize:13 }}>
          {Object.entries(totalPorMedioPago).map(([medio, monto]) => (
            <p key={medio} style={{ display:"flex", justifyContent:"space-between" }}>
              <span>{medio}:</span>
              <span>{formatCurrency(monto)}</span>
            </p>
          ))}
        </div>
        <div style={{ borderTop:"1px solid #2A2218", marginTop:10, paddingTop:10, display:"flex", justifyContent:"space-between", fontSize:17, fontWeight:"bold" }}>
          <span>TOTAL VENTAS:</span>
          <span>{formatCurrency(totalVentas)}</span>
        </div>
      </div>

      <div style={{ borderTop:"1px dashed #5C4F3E", paddingTop:20, marginTop:20 }}>
        <h3 style={{ textTransform:"uppercase", textAlign:"center", marginBottom:16, fontSize:15, letterSpacing:"0.05em" }}>Arqueo de Caja</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:4, fontSize:13 }}>
          <p style={{ display:"flex", justifyContent:"space-between" }}><span>Fondo Inicial:</span> <span>{formatCurrency(sesionCaja.fondo_inicial)}</span></p>
          <p style={{ display:"flex", justifyContent:"space-between" }}><span>(+) Efectivo en Ventas:</span> <span>{formatCurrency(efectivoEnVentas)}</span></p>
          <p style={{ display:"flex", justifyContent:"space-between", fontWeight:"bold", borderTop:"1px solid #ddd", paddingTop:6, marginTop:4 }}><span>(=) Total Esperado:</span> <span>{formatCurrency(totalEsperado)}</span></p>
          <hr style={{border:"none", borderTop:"1px dotted #CCC", margin:"8px 0"}}/>
          <p style={{ display:"flex", justifyContent:"space-between" }}><span>Efectivo Contado:</span> <span>{formatCurrency(arqueo.efectivoContado)}</span></p>
          <p style={{ display:"flex", justifyContent:"space-between", fontWeight:"bold", fontSize:14, color: arqueo.diferencia !== 0 ? "#B5625A" : "inherit" }}>
            <span>Diferencia:</span>
            <span>{formatCurrency(arqueo.diferencia)}</span>
          </p>
          <hr style={{border:"none", borderTop:"1px dotted #CCC", margin:"8px 0"}}/>
          <p style={{ display:"flex", justifyContent:"space-between" }}><span>Cambio para mañana:</span> <span>{formatCurrency(arqueo.cambioSiguiente)}</span></p>
        </div>
      </div>
      
      <div style={{ textAlign:"center", marginTop:24, paddingTop:24, borderTop:"1px dashed #5C4F3E", fontSize:12 }}>
        <p>¡Gracias por tu turno!</p>
      </div>
    </div>
  );
}
