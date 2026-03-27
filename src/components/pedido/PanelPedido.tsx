"use client";

import { useState } from "react";
import type { Mesa } from "@/types/mesa";
import type { Producto, VarianteProducto } from "@/types/producto";
import { useCategorias, useProductos, useVariantes } from "@/hooks/useProductos";
import { useCarrito } from "@/hooks/useCarrito";
import { ModalPeso } from "./ModalPeso";
import { ModalVariante } from "./ModalVariante";
import { ModalCobro } from "./ModalCobro";
import { X, Minus, Plus, Trash2, Tag, Search } from "lucide-react";

interface PanelPedidoProps {
  mesa: Mesa | null;
  onCerrar: () => void;
}

type Modal =
  | { tipo: "peso";     producto: Producto }
  | { tipo: "variante"; producto: Producto; variantes: VarianteProducto[] }
  | { tipo: "descuento" }
  | null;

const fmt = (n: number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

export function PanelPedido({ mesa, onCerrar }: PanelPedidoProps) {
  const { data: categorias = [] } = useCategorias();
  const { data: productos = [], isLoading } = useProductos();
  const { data: variantes = [] } = useVariantes();
  const carrito = useCarrito();

  const [catActiva, setCatActiva] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [mostraCobro, setMostraCobro] = useState(false);

  const productosFiltrados = productos.filter((p) => {
    const matchCat = catActiva ? p.categoria_id === catActiva : true;
    const matchBusqueda = busqueda.trim()
      ? p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    return matchCat && matchBusqueda;
  });

  const handleTocarProducto = (producto: Producto) => {
    if (producto.tipo_venta === "peso") {
      setModal({ tipo: "peso", producto });
      return;
    }
    if (producto.tipo_venta === "tamanio") {
      const vars = variantes.filter((v) => v.producto_id === producto.id);
      setModal({ tipo: "variante", producto, variantes: vars });
      return;
    }
    carrito.agregarUnidad(producto);
  };

  const titulo = mesa ? `Mesa ${mesa.nombre}` : "Para llevar";

  return (
    <>
      {/* Overlay */}
      <div onClick={onCerrar}
        style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.25)", zIndex:100 }} />

      {/* Panel */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0,
        width:"min(92vw, 900px)",
        background:"var(--cream)",
        boxShadow:"-8px 0 40px rgba(42,34,24,0.18)",
        zIndex:101,
        display:"flex",
        overflow:"hidden",
        animation:"slideIn 0.25s cubic-bezier(0.34,1.1,0.64,1)",
      }}>

        {/* ── PRODUCTOS ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid var(--cream-deep)" }}>

          <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid var(--cream-deep)", background:"var(--parchment)", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:500, color:"var(--ink)" }}>
                {titulo}
              </h2>
              <button onClick={onCerrar}
                style={{ width:32, height:32, borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Búsqueda */}
            <div style={{ position:"relative", marginBottom:10 }}>
              <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--ink-light)", pointerEvents:"none" }} />
              <input
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setCatActiva(null); }}
                placeholder="Buscar producto…"
                style={{ width:"100%", padding:"8px 12px 8px 30px", borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)", outline:"none", transition:"border-color 0.15s" }}
              />
              {busqueda && (
                <button onClick={() => setBusqueda("")}
                  style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", color:"var(--ink-light)", fontSize:16, lineHeight:1 }}>
                  ×
                </button>
              )}
            </div>

            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
              <CatBtn activa={catActiva === null} onClick={() => setCatActiva(null)} color="#9C8E7D">
                Todo
              </CatBtn>
              {categorias.map((cat) => (
                <CatBtn key={cat.id} activa={catActiva === cat.id}
                  onClick={() => setCatActiva(cat.id)} color={cat.color_hex}>
                  {cat.nombre}
                </CatBtn>
              ))}
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:16 }}>
            {isLoading ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
                {Array.from({ length: 12 }).map((_,i) => (
                  <div key={i} style={{ height:80, borderRadius:12, background:"var(--cream-mid)", animation:"shimmer 1.5s ease-in-out infinite", animationDelay: `${i*0.05}s` }} />
                ))}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
                {productosFiltrados.length === 0 ? (
                  <div style={{ gridColumn:"1/-1", padding:"40px 0", textAlign:"center" }}>
                    <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--ink-light)", opacity:0.5 }}>
                      {busqueda ? `Sin resultados para "${busqueda}"` : "Sin productos"}
                    </p>
                    {busqueda && (
                      <button onClick={() => setBusqueda("")}
                        style={{ marginTop:10, fontSize:12, color:"var(--amber)", background:"transparent", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                ) : productosFiltrados.map((p) => (
                  <ProductoCard key={p.id} producto={p}
                    variantes={variantes.filter((v) => v.producto_id === p.id)}
                    onClick={handleTocarProducto} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CARRITO ── */}
        <div style={{ width:280, display:"flex", flexDirection:"column", background:"var(--parchment)", flexShrink:0 }}>

          <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid var(--cream-deep)", flexShrink:0 }}>
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--ink-light)", fontWeight:500 }}>
              Pedido
            </p>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"var(--ink)", marginTop:2 }}>
              {carrito.items.length === 0 ? "Sin ítems" : `${carrito.items.length} ítem${carrito.items.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
            {carrito.items.length === 0 ? (
              <div style={{ padding:"32px 16px", textAlign:"center" }}>
                <p style={{ fontSize:12, color:"var(--ink-light)", fontStyle:"italic" }}>
                  Tocá un producto para agregarlo
                </p>
              </div>
            ) : (
              carrito.items.map((item) => (
                <div key={item.key} style={{ padding:"10px 16px", borderBottom:"1px solid var(--cream-mid)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:500, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {item.producto.nombre}
                        {item.variante && <span style={{ color:"var(--ink-light)", fontWeight:400 }}> · {item.variante.nombre}</span>}
                      </p>
                      {item.producto.tipo_venta === "peso" && (
                        <p style={{ fontSize:11, color:"var(--ink-light)", marginTop:2 }}>
                          {item.cantidad.toFixed(3)} kg
                        </p>
                      )}
                    </div>
                    <button onClick={() => carrito.eliminar(item.key)}
                      style={{ background:"transparent", border:"none", cursor:"pointer", color:"var(--ink-light)", padding:2, flexShrink:0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                    {item.producto.tipo_venta === "unidad" || item.producto.tipo_venta === "tamanio" ? (
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <button onClick={() => carrito.cambiarCantidad(item.key, -1)}
                          style={{ width:24, height:24, borderRadius:6, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize:13, fontWeight:500, minWidth:20, textAlign:"center" }}>{item.cantidad}</span>
                        <button onClick={() => carrito.cambiarCantidad(item.key, 1)}
                          style={{ width:24, height:24, borderRadius:6, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : <div />}
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:500, color:"var(--ink)" }}>
                      {fmt(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer carrito */}
          <div style={{ padding:"14px 16px", borderTop:"1px solid var(--cream-deep)", flexShrink:0 }}>

            {/* Descuento aplicado */}
            {carrito.descuento && (
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, padding:"6px 8px", background:"var(--sage-bg)", borderRadius:6 }}>
                <span style={{ fontSize:11, color:"var(--sage)" }}>
                  Descuento · {carrito.descuento.motivo}
                </span>
                <span style={{ fontSize:12, color:"var(--sage)", fontWeight:500 }}>
                  - {fmt(carrito.totales.montoDescuento)}
                </span>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12, color:"var(--ink-light)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Subtotal</span>
              <span style={{ fontSize:13, color:"var(--ink)" }}>{fmt(carrito.totales.subtotal)}</span>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:"1px dashed var(--cream-deep)", marginBottom:12 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:"var(--ink)" }}>Total</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:500, color:"var(--ink)" }}>
                {fmt(carrito.totales.total)}
              </span>
            </div>

            {/* Botón descuento */}
            {carrito.items.length > 0 && !carrito.descuento && (
              <button onClick={() => setModal({ tipo: "descuento" })}
                style={{ width:"100%", padding:"8px 0", borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-light)", fontSize:11, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8, transition:"all 0.15s" }}>
                <Tag size={12} />
                Aplicar descuento
              </button>
            )}

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={carrito.limpiar} disabled={carrito.items.length === 0}
                style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-mid)", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor: carrito.items.length > 0 ? "pointer" : "not-allowed", opacity: carrito.items.length > 0 ? 1 : 0.4 }}>
                Limpiar
              </button>
              <button onClick={() => setMostraCobro(true)} disabled={carrito.items.length === 0}
                style={{ flex:2, padding:"11px 0", borderRadius:10, border:"none", background: carrito.items.length > 0 ? "var(--ink)" : "var(--cream-deep)", color: carrito.items.length > 0 ? "var(--cream)" : "var(--ink-light)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor: carrito.items.length > 0 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>
                Cobrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal peso */}
      {modal?.tipo === "peso" && (
        <ModalPeso producto={modal.producto}
          onConfirm={(monto) => { carrito.agregarPeso(modal.producto, monto); setModal(null); }}
          onCancel={() => setModal(null)} />
      )}

      {/* Modal variante */}
      {modal?.tipo === "variante" && (
        <ModalVariante producto={modal.producto} variantes={modal.variantes}
          onConfirm={(v) => { carrito.agregarVariante(modal.producto, v); setModal(null); }}
          onCancel={() => setModal(null)} />
      )}

      {/* Modal descuento */}
      {modal?.tipo === "descuento" && (
        <ModalDescuento
          subtotal={carrito.totales.subtotal}
          onConfirm={(d) => { carrito.setDescuento(d); setModal(null); }}
          onCancel={() => setModal(null)} />
      )}

      {/* Modal cobro */}
      {mostraCobro && (
        <ModalCobro
          mesa={mesa}
          items={carrito.items}
          subtotal={carrito.totales.subtotal}
          total={carrito.totales.total}
          descuento_monto={carrito.totales.montoDescuento}
          descuento_tipo={carrito.descuento?.tipo ?? null}
          descuento_valor={carrito.descuento?.valor ?? 0}
          descuento_motivo={carrito.descuento?.motivo ?? ""}
          onExito={(ventaId) => {
            console.log("Venta guardada:", ventaId);
            carrito.limpiar();
            setMostraCobro(false);
            onCerrar();
          }}
          onCancelar={() => setMostraCobro(false)}
        />
      )}

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ── Modal Descuento ── */
function ModalDescuento({
  subtotal,
  onConfirm,
  onCancel,
}: {
  subtotal: number;
  onConfirm: (d: { tipo: "fijo" | "porcentaje"; valor: number; motivo: string }) => void;
  onCancel: () => void;
}) {
  const [tipo, setTipo] = useState<"fijo" | "porcentaje">("porcentaje");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");

  const valorNum = parseFloat(valor) || 0;
  const montoDesc = tipo === "porcentaje" ? subtotal * (valorNum / 100) : valorNum;
  const valido = valorNum > 0 && motivo.trim().length > 0;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--parchment)", borderRadius:18, padding:28, width:320, boxShadow:"0 20px 60px rgba(42,34,24,0.35)" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--ink)", marginBottom:20 }}>
          Aplicar descuento
        </p>

        <div style={{ display:"flex", gap:4, background:"var(--cream-mid)", padding:4, borderRadius:8, marginBottom:16 }}>
          {(["porcentaje","fijo"] as const).map((t) => (
            <button key={t} onClick={() => setTipo(t)}
              style={{ flex:1, padding:"6px 0", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", background: tipo===t ? "var(--parchment)" : "transparent", color: tipo===t ? "var(--ink)" : "var(--ink-mid)", transition:"all 0.15s" }}>
              {t === "porcentaje" ? "Porcentaje %" : "Monto fijo $"}
            </button>
          ))}
        </div>

        <input type="number" placeholder={tipo === "porcentaje" ? "Ej: 10" : "Ej: 500"}
          value={valor} onChange={(e) => setValor(e.target.value)}
          style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", fontSize:16, fontFamily:"'Playfair Display',serif", color:"var(--ink)", marginBottom:10, outline:"none" }} />

        <input type="text" placeholder="Motivo (obligatorio)"
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
          style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)", marginBottom:16, outline:"none" }} />

        {valorNum > 0 && (
          <p style={{ fontSize:12, color:"var(--sage)", marginBottom:16, textAlign:"center" }}>
            Descuento: ${montoDesc.toLocaleString("es-AR")}
            {tipo === "porcentaje" ? ` (${valorNum}%)` : ""}
          </p>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-mid)", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            Cancelar
          </button>
          <button onClick={() => valido && onConfirm({ tipo, valor: valorNum, motivo })} disabled={!valido}
            style={{ flex:2, padding:"11px 0", borderRadius:10, border:"none", background: valido ? "var(--ink)" : "var(--cream-deep)", color: valido ? "var(--cream)" : "var(--ink-light)", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor: valido ? "pointer" : "not-allowed" }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-componentes ── */
function CatBtn({ activa, onClick, color, children }: { activa: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ padding:"5px 12px", borderRadius:20, border: activa ? `1.5px solid ${color}` : "1.5px solid var(--cream-deep)", background: activa ? color + "22" : "transparent", color: activa ? color : "var(--ink-mid)", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s", letterSpacing:"0.02em" }}>
      {children}
    </button>
  );
}

function ProductoCard({ producto, variantes, onClick }: { producto: Producto; variantes: VarianteProducto[]; onClick: (p: Producto) => void }) {
  const [hover, setHover] = useState(false);
  const precio = producto.tipo_venta === "tamanio"
    ? variantes.length > 0 ? `desde $${Math.min(...variantes.map(v => v.precio)).toLocaleString("es-AR")}` : "—"
    : `$${producto.precio_unitario?.toLocaleString("es-AR")}`;

  return (
    <div onClick={() => onClick(producto)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "var(--parchment)" : "var(--cream)",
        border: `1.5px solid ${hover ? "var(--amber-light)" : "var(--cream-deep)"}`,
        borderRadius:12, padding:"14px 12px", cursor:"pointer",
        transition:"all 0.18s cubic-bezier(0.34,1.3,0.64,1)",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? "0 6px 20px rgba(42,34,24,0.10)" : "none",
        position:"relative", overflow:"hidden",
      }}>
      {producto.tipo_venta !== "unidad" && (
        <div style={{ position:"absolute", top:8, right:8, background: producto.tipo_venta === "peso" ? "var(--sage-bg)" : "var(--amber-bg)", color: producto.tipo_venta === "peso" ? "var(--sage)" : "var(--amber)", fontSize:9, padding:"2px 6px", borderRadius:10, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase" }}>
          {producto.tipo_venta === "peso" ? "kg" : "tamaño"}
        </div>
      )}
      <p style={{ fontSize:13, fontWeight:500, color:"var(--ink)", marginBottom:6, paddingRight: producto.tipo_venta !== "unidad" ? 40 : 0, lineHeight:1.3 }}>
        {producto.nombre}
      </p>
      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:500, color:"var(--ink)" }}>
        {precio}
        {producto.tipo_venta === "peso" && <span style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", color:"var(--ink-light)", fontWeight:400 }}> / kg</span>}
      </p>
    </div>
  );
}