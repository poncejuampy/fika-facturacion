"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useCategorias, useVariantes } from "@/hooks/useProductos";
import { useCrearProducto, useEditarProducto, useGestionVariantes } from "@/hooks/useGestionProductos";
import type { Producto } from "@/types/producto";

interface ModalProductoProps {
  producto?: Producto;
  onCerrar: () => void;
}

export function ModalProducto({ producto, onCerrar }: ModalProductoProps) {
  const esEdicion = !!producto;
  const { data: categorias = [] } = useCategorias();
  const { data: todasVariantes = [] } = useVariantes();
  const crear = useCrearProducto();
  const editar = useEditarProducto();
  const gestionVariantes = useGestionVariantes();

  const variantesIniciales = producto
    ? todasVariantes.filter((v) => v.producto_id === producto.id).map((v) => ({ nombre: v.nombre, precio: v.precio }))
    : [{ nombre: "Chico", precio: 0 }, { nombre: "Mediano", precio: 0 }, { nombre: "Grande", precio: 0 }];

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [categoriaIdOverride, setCategoriaId] = useState(producto?.categoria_id ?? "");
  const [tipoVenta, setTipoVenta] = useState<"unidad"|"peso"|"tamanio">(producto?.tipo_venta ?? "unidad");
  const [precio, setPrecio] = useState(producto?.precio_unitario?.toString() ?? "");
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const categoriaId = categoriaIdOverride || categorias[0]?.id || "";
  const [variantes, setVariantes] = useState(variantesIniciales);
  const [error, setError] = useState("");

  const isPending = crear.isPending || editar.isPending || gestionVariantes.isPending;

  const handleGuardar = async () => {
    setError("");
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (!categoriaId) { setError("Seleccioná una categoría"); return; }
    if (tipoVenta !== "tamanio" && !precio) { setError("El precio es obligatorio"); return; }
    if (tipoVenta === "tamanio" && variantes.some(v => !v.nombre || v.precio <= 0)) {
      setError("Completá todas las variantes con nombre y precio"); return;
    }

    const input = {
      nombre: nombre.trim(),
      categoria_id: categoriaId,
      tipo_venta: tipoVenta,
      precio_unitario: tipoVenta !== "tamanio" ? parseFloat(precio) : null,
      activo,
    };

    try {
      if (esEdicion) {
        await editar.mutateAsync({ id: producto!.id, ...input });
        if (tipoVenta === "tamanio") {
          await gestionVariantes.mutateAsync({ productoId: producto!.id, variantes });
        }
      } else {
        const nuevoId = await crear.mutateAsync(input);
        if (tipoVenta === "tamanio") {
          await gestionVariantes.mutateAsync({ productoId: nuevoId, variantes });
        }
      }
      onCerrar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"9px 12px", borderRadius:8,
    border:"1.5px solid var(--cream-deep)", background:"var(--cream)",
    fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)",
    outline:"none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize:11, textTransform:"uppercase", letterSpacing:"0.07em",
    color:"var(--ink-light)", fontWeight:500, marginBottom:6, display:"block",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,34,24,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}>
      <div style={{ background:"var(--parchment)", borderRadius:18, width:"min(96vw, 480px)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 70px rgba(42,34,24,0.35)", animation:"scaleIn 0.2s cubic-bezier(0.34,1.3,0.64,1)" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--cream-deep)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--ink)" }}>
            {esEdicion ? "Editar producto" : "Nuevo producto"}
          </p>
          <button onClick={onCerrar}
            style={{ width:32, height:32, borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-mid)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

          {/* Nombre */}
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Café en jarrito" style={inputStyle} />
          </div>

          {/* Categoría */}
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Categoría</label>
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Tipo de venta */}
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Tipo de venta</label>
            <div style={{ display:"flex", gap:8 }}>
              {([["unidad","Por unidad"],["peso","Por peso (kg)"],["tamanio","Por tamaño"]] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setTipoVenta(val)}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border: tipoVenta===val ? "1.5px solid var(--ink)" : "1.5px solid var(--cream-deep)", background: tipoVenta===val ? "var(--ink)" : "transparent", color: tipoVenta===val ? "var(--cream)" : "var(--ink-mid)", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.15s", fontWeight: tipoVenta===val ? 500 : 400 }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Precio (unidad o peso) */}
          {tipoVenta !== "tamanio" && (
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>
                {tipoVenta === "peso" ? "Precio por kg ($)" : "Precio por unidad ($)"}
              </label>
              <input type="number" value={precio} onChange={e => setPrecio(e.target.value)}
                placeholder="Ej: 1500" style={inputStyle} />
            </div>
          )}

          {/* Variantes (tamaño) */}
          {tipoVenta === "tamanio" && (
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Variantes y precios</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {variantes.map((v, i) => (
                  <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input value={v.nombre} onChange={e => setVariantes(prev => prev.map((x,j) => j===i ? {...x, nombre: e.target.value} : x))}
                      placeholder="Nombre" style={{ ...inputStyle, flex:1 }} />
                    <input type="number" value={v.precio || ""} onChange={e => setVariantes(prev => prev.map((x,j) => j===i ? {...x, precio: parseFloat(e.target.value)||0} : x))}
                      placeholder="$" style={{ ...inputStyle, width:90 }} />
                    <button onClick={() => setVariantes(prev => prev.filter((_,j) => j!==i))}
                      style={{ width:32, height:36, borderRadius:8, border:"1.5px solid var(--cream-deep)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-light)", flexShrink:0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setVariantes(prev => [...prev, { nombre:"", precio:0 }])}
                  style={{ padding:"8px 0", borderRadius:8, border:"1.5px dashed var(--cream-deep)", background:"transparent", color:"var(--ink-light)", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <Plus size={13} />Agregar variante
                </button>
              </div>
            </div>
          )}

          {/* Activo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setActivo(!activo)}
              style={{ width:42, height:24, borderRadius:12, background: activo ? "var(--sage)" : "var(--cream-deep)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ width:18, height:18, borderRadius:"50%", background:"white", position:"absolute", top:3, left: activo ? 21 : 3, transition:"left 0.2s" }} />
            </button>
            <span style={{ fontSize:13, color:"var(--ink-mid)" }}>
              {activo ? "Producto activo (visible en el POS)" : "Producto inactivo (oculto)"}
            </span>
          </div>

          {error && (
            <p style={{ marginTop:14, fontSize:12, color:"var(--rose)", background:"var(--rose-bg)", padding:"8px 12px", borderRadius:8 }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px", borderTop:"1px solid var(--cream-deep)", display:"flex", gap:10, flexShrink:0 }}>
          <button onClick={onCerrar}
            style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1.5px solid var(--cream-deep)", background:"transparent", color:"var(--ink-mid)", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={isPending}
            style={{ flex:2, padding:"11px 0", borderRadius:10, border:"none", background:"var(--ink)", color:"var(--cream)", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1 }}>
            {isPending ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}