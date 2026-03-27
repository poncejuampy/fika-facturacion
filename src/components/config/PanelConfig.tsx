"use client";

import { useState } from "react";
import { Plus, Pencil, Eye, EyeOff, Search } from "lucide-react";
import { useTodosProductos, useCategorias, useVariantes } from "@/hooks/useProductos";
import { useToggleProducto } from "@/hooks/useGestionProductos";
import { useCrearCategoria, useEditarCategoria } from "@/hooks/useGestionCategorias";
import { ModalProducto } from "./ModalProducto";
import type { Producto } from "@/types/producto";

const fmt = (n: number | null) => n != null ? "$" + n.toLocaleString("es-AR") : "—";

type CatModal = null | "nueva" | { id: string; nombre: string; color_hex: string };

export function PanelConfig() {
  const { data: productos = [], isLoading } = useTodosProductos();
  const { data: categorias = [] } = useCategorias();
  const { data: variantes = [] } = useVariantes();
  const toggle = useToggleProducto();
  const crearCat = useCrearCategoria();
  const editarCat = useEditarCategoria();

  const [busqueda, setBusqueda] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [modal, setModal] = useState<null | "nuevo" | Producto>(null);
  const [modalCat, setModalCat] = useState<CatModal>(null);

  const productosFiltrados = productos.filter(p => {
    const matchNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCat = catFiltro ? p.categoria_id === catFiltro : true;
    return matchNombre && matchCat;
  });

  const getCat = (id: string) => categorias.find(c => c.id === id);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"var(--cream)" }}>

      {/* Header */}
      <div style={{ padding:"20px 28px 16px", background:"var(--parchment)", borderBottom:"1px solid var(--cream-deep)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"var(--ink-light)", fontStyle:"italic" }}>
            Gestioná los productos del menú
          </p>
          <button onClick={() => setModal("nuevo")}
            style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--ink)", color:"var(--cream)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <Plus size={14} />
            Nuevo producto
          </button>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, position:"relative" }}>
            <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--ink-light)" }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto…"
              style={{ width:"100%", padding:"8px 12px 8px 32px", borderRadius:8, border:"1px solid var(--cream-deep)", background:"var(--cream)", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)", outline:"none" }} />
          </div>
          <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
            style={{ padding:"8px 12px", borderRadius:8, border:"1px solid var(--cream-deep)", background:"var(--cream)", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)", cursor:"pointer", outline:"none" }}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Lista de productos */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 28px" }}>
        {isLoading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Array.from({length:6}).map((_,i) => (
              <div key={i} style={{ height:56, borderRadius:10, background:"var(--cream-mid)", animation:"shimmer 1.5s ease-in-out infinite", animationDelay:`${i*0.08}s` }} />
            ))}
          </div>
        ) : (
          <div style={{ background:"var(--parchment)", borderRadius:12, border:"1px solid var(--cream-deep)", overflow:"hidden", marginBottom:32 }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"var(--cream-mid)" }}>
                  {["Producto","Categoría","Tipo","Precio","Estado",""].map((h,i) => (
                    <th key={i} style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-light)", padding:"10px 16px", textAlign: i===5?"right":"left", fontWeight:500, borderBottom:"1px solid var(--cream-deep)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => {
                  const cat = getCat(p.categoria_id);
                  const vars = variantes.filter(v => v.producto_id === p.id);
                  const precioLabel = p.tipo_venta === "tamanio"
                    ? vars.length > 0 ? `desde ${fmt(Math.min(...vars.map(v=>v.precio)))}` : "—"
                    : p.tipo_venta === "peso" ? `${fmt(p.precio_unitario)} / kg` : fmt(p.precio_unitario);

                  return (
                    <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.5 }}>
                      <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--cream-mid)", fontSize:14, fontWeight:500, color:"var(--ink)" }}>
                        {p.nombre}
                      </td>
                      <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--cream-mid)" }}>
                        <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11, background: (cat?.color_hex ?? "#ccc") + "22", color: cat?.color_hex ?? "#ccc", border:`1px solid ${(cat?.color_hex ?? "#ccc")}44` }}>
                          {cat?.nombre ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--cream-mid)" }}>
                        <span style={{ padding:"2px 8px", borderRadius:8, fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em",
                          background: p.tipo_venta==="peso" ? "var(--sage-bg)" : p.tipo_venta==="tamanio" ? "var(--amber-bg)" : "var(--cream-mid)",
                          color: p.tipo_venta==="peso" ? "var(--sage)" : p.tipo_venta==="tamanio" ? "var(--amber)" : "var(--ink-mid)" }}>
                          {p.tipo_venta}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--cream-mid)", fontFamily:"'Playfair Display',serif", fontSize:15, color:"var(--ink)" }}>
                        {precioLabel}
                        {p.tipo_venta === "tamanio" && vars.length > 0 && (
                          <div style={{ fontSize:11, color:"var(--ink-light)", marginTop:2 }}>
                            {vars.map(v => `${v.nombre}: ${fmt(v.precio)}`).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--cream-mid)" }}>
                        <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:500,
                          background: p.activo ? "var(--sage-bg)" : "var(--cream-mid)",
                          color: p.activo ? "var(--sage)" : "var(--ink-light)" }}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--cream-mid)", textAlign:"right" }}>
                        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                          <button onClick={() => setModal(p)}
                            style={{ width:30, height:30, borderRadius:7, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => toggle.mutate({ id: p.id, activo: !p.activo })}
                            style={{ width:30, height:30, borderRadius:7, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: p.activo ? "var(--amber)" : "var(--sage)" }}>
                            {p.activo ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {productosFiltrados.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:"28px", textAlign:"center", color:"var(--ink-light)", fontStyle:"italic" }}>
                    {busqueda ? "Sin resultados" : "Sin productos"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Sección categorías */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--ink)" }}>Categorías</h2>
            <button onClick={() => setModalCat("nueva")}
              style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"var(--ink)", color:"var(--cream)", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Plus size={12} /> Nueva categoría
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {categorias.map(cat => {
              const cant = productos.filter(p => p.categoria_id === cat.id).length;
              return (
                <div key={cat.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--parchment)", borderRadius:10, border:"1px solid var(--cream-deep)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:14, height:14, borderRadius:"50%", background:cat.color_hex, flexShrink:0 }} />
                    <span style={{ fontSize:14, fontWeight:500, color:"var(--ink)" }}>{cat.nombre}</span>
                    <span style={{ fontSize:11, color:"var(--ink-light)" }}>{cant} producto{cant !== 1 ? "s" : ""}</span>
                  </div>
                  <button onClick={() => setModalCat({ id:cat.id, nombre:cat.nombre, color_hex:cat.color_hex })}
                    style={{ width:28, height:28, borderRadius:6, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
                    <Pencil size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize:11, color:"var(--ink-light)" }}>
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
          {!isLoading && ` · ${productos.filter(p=>!p.activo).length} inactivos`}
        </p>
      </div>

      {/* Modal producto */}
      {modal !== null && (
        <ModalProducto
          producto={modal === "nuevo" ? undefined : modal}
          onCerrar={() => setModal(null)}
        />
      )}

      {/* Modal categoría */}
      {modalCat !== null && (
        <ModalCategoria
          cat={modalCat}
          cantCategorias={categorias.length}
          onCerrar={() => setModalCat(null)}
          onCreate={async (nombre, color_hex, orden) => {
            await crearCat.mutateAsync({ nombre, color_hex, orden_display: orden });
          }}
          onEdit={async (id, nombre, color_hex) => {
            await editarCat.mutateAsync({ id, nombre, color_hex });
          }}
        />
      )}

      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

// ── Modal Categoría ────────────────────────────────────────────

const COLORES = ["#6B8C6E","#C4824A","#6F4E37","#D4A574","#FF6B9D","#4A90D9","#F5C842","#B5625A"];

function ModalCategoria({ cat, cantCategorias, onCerrar, onCreate, onEdit }: {
  cat: CatModal;
  cantCategorias: number;
  onCerrar: () => void;
  onCreate: (nombre: string, color_hex: string, orden: number) => Promise<void>;
  onEdit: (id: string, nombre: string, color_hex: string) => Promise<void>;
}) {
  const esNueva = cat === "nueva";
  const [nombre, setNombre] = useState(cat && cat !== "nueva" ? cat.nombre : "");
  const [color, setColor] = useState(cat && cat !== "nueva" ? cat.color_hex : "#6B8C6E");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    setError("");
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true);
    try {
      if (esNueva) {
        await onCreate(nombre.trim(), color, cantCategorias + 1);
      } else if (cat && cat.id !== "nueva") {
        await onEdit(cat.id, nombre.trim(), color);
      }
      onCerrar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}>
      <div style={{ background:"var(--parchment)", borderRadius:18, width:"min(96vw,380px)", boxShadow:"0 24px 70px rgba(42,34,24,0.35)", animation:"scaleIn 0.2s cubic-bezier(0.34,1.3,0.64,1)" }}>

        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--ink)" }}>
            {esNueva ? "Nueva categoría" : "Editar categoría"}
          </p>
          <button onClick={onCerrar}
            style={{ width:30, height:30, borderRadius:7, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", fontSize:18, color:"var(--ink-mid)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            ×
          </button>
        </div>

        <div style={{ padding:"20px 24px" }}>
          <label style={{ fontSize:11, textTransform:"uppercase" as const, letterSpacing:"0.07em", color:"var(--ink-light)", display:"block", marginBottom:6 }}>
            Nombre
          </label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Cafés, Helados…"
            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"var(--cream)", fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)", outline:"none", marginBottom:16 }}
          />

          <label style={{ fontSize:11, textTransform:"uppercase" as const, letterSpacing:"0.07em", color:"var(--ink-light)", display:"block", marginBottom:8 }}>
            Color
          </label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const, marginBottom:16 }}>
            {COLORES.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width:32, height:32, borderRadius:"50%", background:c, border: color===c ? "3px solid var(--ink)" : "2px solid transparent", cursor:"pointer", transition:"all 0.15s", outline:"none" }} />
            ))}
          </div>

          {/* Vista previa */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--cream)", borderRadius:8, border:"1px solid var(--cream-deep)", marginBottom:16 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:color }} />
            <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>{nombre || "Vista previa"}</span>
          </div>

          {error && (
            <p style={{ fontSize:12, color:"var(--rose)", marginBottom:12, background:"var(--rose-bg)", padding:"8px 10px", borderRadius:6 }}>
              {error}
            </p>
          )}

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onCerrar}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-mid)", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={loading}
              style={{ flex:2, padding:"10px 0", borderRadius:10, border:"none", background:"var(--ink)", color:"var(--cream)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}