"use client";

import { useState, useEffect } from "react";
import { useSesionActiva, useFacturadoHoy } from "@/hooks/useSesionCaja";
import { useAuth } from "@/hooks/useAuth";
import { MapaMesas } from "./mesas/MapaMesas";
import { PanelReportes } from "./reportes/PanelReportes";
import { PanelConfig } from "./config/PanelConfig";
import { PantallaLogin } from "./auth/PantallaLogin";

type Vista = "mesas" | "pos" | "reportes" | "config";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function POSShell() {
  const [vista, setVista] = useState<Vista>("mesas");
  const [hora, setHora] = useState("");
  const { data: sesion } = useSesionActiva();
  const { data: facturado } = useFacturadoHoy(sesion?.id);
  const { state, signOut, empleado, isAdmin } = useAuth();

  useEffect(() => {
    const update = () => {
      const n = new Date();
      const h = n.getHours() % 12 || 12;
      const m = String(n.getMinutes()).padStart(2, "0");
      setHora(`${h}:${m} ${n.getHours() >= 12 ? "p. m." : "a. m."}`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const vistaLabel: Record<Vista, string> = { 
    mesas: "Mesas", 
    pos: "Venta", 
    reportes: "Reportes", 
    config: "Configuración" 
  };

  const navItems = [
    { id: "mesas",    label: "Mesas",    path: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></> },
    { id: "pos",      label: "Venta",    path: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></> },
    { id: "reportes", label: "Reportes", path: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
  ];

  const S: Record<string, React.CSSProperties> = {
    root:    { display:"flex", height:"100vh", overflow:"hidden", background:"var(--cream)", color:"var(--ink)", fontFamily:"'DM Sans',sans-serif" },
    nav:     { width:68, background:"var(--ink)", display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 0", gap:6, flexShrink:0 },
    navLogo: { fontFamily:"'Playfair Display',serif", color:"var(--cream)", fontSize:18, fontWeight:600, letterSpacing:"0.04em", marginBottom:18, writingMode:"vertical-rl", transform:"rotate(180deg)", cursor:"default" },
    navDiv:  { width:28, height:1, background:"rgba(242,235,224,0.15)", margin:"6px 0" },
    navSpc:  { flex:1 },
    avatar:  { width:36, height:36, borderRadius:"50%", background:"var(--sage)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:500, color:"white", cursor:"pointer" },
    main:    { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
    topbar:  { background:"var(--parchment)", borderBottom:"1px solid var(--cream-deep)", padding:"0 28px", height:60, display:"flex", alignItems:"center", gap:20, flexShrink:0 },
    title:   { fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:500, color:"var(--ink)", letterSpacing:"0.01em" },
    sub:     { fontSize:12, color:"var(--ink-light)", fontWeight:300, letterSpacing:"0.06em", textTransform:"uppercase" as const },
    vdiv:    { width:1, height:20, background:"var(--cream-deep)" },
    tabs:    { display:"flex", gap:4, background:"var(--cream-mid)", padding:4, borderRadius:8 },
    spc:     { flex:1 },
    pill:    { display:"flex", alignItems:"center", gap:7, background: sesion ? "var(--sage-bg)" : "var(--amber-bg)", border:`1px solid ${sesion ? "var(--sage-light)" : "var(--amber-light)"}`, padding:"5px 12px", borderRadius:20, fontSize:11, color: sesion ? "var(--sage)" : "var(--amber)", fontWeight:600, letterSpacing:"0.03em" },
    dot:     { width:7, height:7, borderRadius:"50%", background: sesion ? "var(--sage)" : "var(--amber)", animation:"pulse 2s infinite" },
    time:    { fontSize:13, color:"var(--ink-mid)", fontWeight:400 },
    content: { flex:1, overflow:"hidden", display:"flex" },
  };

  if (state === "loading") return <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", background:"var(--ink)", color:"white" }}>Cargando Fika...</div>;
  if (state === "unauthenticated") return <PantallaLogin />;

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --cream:#F2EBE0; --cream-mid:#EAE0D3; --cream-deep:#DDD1C2; --parchment:#F8F4EE;
          --ink:#2A2218; --ink-mid:#5C4F3E; --ink-light:#9C8E7D;
          --sage:#6B8C6E; --sage-light:#A8C4AA; --sage-bg:#EAF2EA;
          --amber:#C4824A; --amber-light:#E8C89A; --amber-bg:#FBF0E6;
          --rose:#B5625A; --rose-bg:#FBECEA;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        *{box-sizing:border-box;margin:0;padding:0;}
        .nav-btn{width:44px;height:44px;border-radius:8px;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;transition:all 0.18s;}
        .nav-btn:hover{background:rgba(242,235,224,0.08)!important;color:var(--cream)!important;}
      `}</style>

      <nav style={S.nav}>
        <div style={S.navLogo}>Fika</div>
        <div style={S.navDiv} />
        {navItems.map((item) => (
          <button key={item.id} className="nav-btn" onClick={() => setVista(item.id as Vista)}
            style={{ background: vista===item.id ? "rgba(242,235,224,0.12)" : "transparent", color: vista===item.id ? "var(--cream)" : "rgba(242,235,224,0.5)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18}}>{item.path}</svg>
            <span style={{fontSize:8,textTransform:"uppercase"}}>{item.label}</span>
          </button>
        ))}
        <div style={S.navSpc} />
        {isAdmin && (
          <button className="nav-btn" onClick={() => setVista("config")}
            style={{ background: vista==="config" ? "rgba(242,235,224,0.12)" : "transparent", color: vista==="config" ? "var(--cream)" : "rgba(242,235,224,0.5)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18}}>
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        )}
        <div style={S.avatar}>{empleado?.nombre?.[0]?.toUpperCase() || "E"}</div>
      </nav>

      <div style={S.main}>
        <header style={S.topbar}>
          <span style={S.title}>{vistaLabel[vista]}</span>
          <span style={S.sub}>Catamarca</span>
          <div style={S.vdiv} />
          <div style={S.spc} />
          <div style={{ textAlign:"right", marginRight:15 }}>
              <p style={{ fontSize:9, color:"var(--ink-light)" }}>FACTURADO HOY</p>
              <p style={{ fontWeight:700, fontSize:15 }}>{fmt(facturado?.total || 0)}</p>
          </div>
          <div style={S.pill}>
            <div style={S.dot} />
            {sesion ? "Turno activo" : "Sin turno"}
          </div>
          <span style={S.time}>{hora}</span>
          <button onClick={signOut} style={{ background:"transparent", border:"none", cursor:"pointer", color:"var(--rose)", fontSize:12, fontWeight:500 }}>Salir</button>
        </header>

        <main style={S.content}>
           {vista === "mesas"    && <MapaMesas />}
           {vista === "pos"      && <MapaMesas />} 
           {vista === "reportes" && <PanelReportes isAdmin={isAdmin} />}
           {vista === "config"   && isAdmin && <PanelConfig />}
        </main>
      </div>
    </div>
  );
}