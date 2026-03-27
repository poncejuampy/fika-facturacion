"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function PantallaLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [hora, setHora] = useState("");
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setHora(new Date().toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" }));
      setFecha(new Date().toLocaleDateString("es-AR", { weekday:"long", day:"numeric", month:"long" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Completá los dos campos"); return; }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al ingresar. Verificá tus credenciales.");
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", background:"var(--cream)", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Left panel - Branding */}
      <div style={{ flex:1, background:"var(--ink)", color:"var(--cream)", display:"flex", flexDirection:"column", padding:"60px", position:"relative", overflow:"hidden" }}>
        {/* Subtle background decoration */}
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"70%", height:"70%", background:"var(--sage)", opacity:0.15, filter:"blur(120px)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-20%", width:"60%", height:"60%", background:"var(--amber)", opacity:0.1, filter:"blur(120px)", borderRadius:"50%" }} />
        
        <div style={{ flex:1, display:"flex", flexDirection:"column", zIndex:1 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:600, letterSpacing:"0.02em" }}>Fika</p>
          <div style={{ marginTop:"auto", marginBottom:"auto" }}>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:72, lineHeight:1.1, marginBottom:24, fontWeight:400 }}>El arte del<br/>buen café.</h1>
            <p style={{ fontSize:18, color:"var(--ink-light)", maxWidth:420, lineHeight:1.6 }}>Sistema de Punto de Venta exclusivo para Fika Cafetería. Gestioná mesas, pedidos y cobros de forma simple e intuitiva.</p>
          </div>
          <div>
            <p style={{ fontSize:12, color:"rgba(242,235,224,0.4)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Sucursal</p>
            <p style={{ fontSize:16, color:"var(--cream)", marginTop:4 }}>Catamarca Centro</p>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--parchment)", position:"relative" }}>
        
        {/* Top right corner time & date */}
        <div style={{ position:"absolute", top:40, right:40, textAlign:"right" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"var(--ink)" }}>{hora || "..."}</p>
          <p style={{ fontSize:13, color:"var(--ink-light)", textTransform:"capitalize", marginTop:2 }}>{fecha}</p>
        </div>

        <div style={{ width:"min(100%, 420px)", padding:"0 40px" }}>
          <div style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, color:"var(--ink)", marginBottom:8 }}>Bienvenido</h2>
            <p style={{ color:"var(--ink-mid)", fontSize:16 }}>Ingresá tus credenciales para iniciar tu turno.</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--ink-mid)", display:"block", marginBottom:8 }}>Correo Electrónico</label>
              <div style={{ position:"relative" }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder="empleado@fika.com" autoComplete="email"
                  style={{ width:"100%", padding:"16px 18px", borderRadius:12, border:"1px solid var(--cream-deep)", background:"white", color:"var(--ink)", fontSize:15, outline:"none", transition:"all 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.02)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--sage)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--sage-bg)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--cream-deep)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--ink-mid)", display:"block", marginBottom:8 }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder="••••••••" autoComplete="current-password"
                style={{ width:"100%", padding:"16px 18px", borderRadius:12, border:"1px solid var(--cream-deep)", background:"white", color:"var(--ink)", fontSize:15, outline:"none", transition:"all 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.02)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--sage)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--sage-bg)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--cream-deep)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
              />
            </div>

            {error && (
              <div style={{ background:"var(--rose-bg)", border:"1px solid rgba(181,98,90,0.3)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, marginTop:4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p style={{ fontSize:14, color:"var(--rose)", margin:0 }}>{error}</p>
              </div>
            )}

            <button onClick={handleLogin} disabled={loading}
              style={{ width:"100%", padding:"16px", borderRadius:12, border:"none", background: loading ? "var(--sage-light)" : "var(--sage)", color:"white", fontSize:16, fontWeight:600, marginTop:12, cursor: loading ? "not-allowed" : "pointer", transition:"all 0.2s", boxShadow:"0 4px 12px rgba(107,140,110,0.25)" }}
              onMouseOver={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)", e.currentTarget.style.boxShadow = "0 6px 16px rgba(107,140,110,0.35)")}
              onMouseOut={e => !loading && (e.currentTarget.style.transform = "none", e.currentTarget.style.boxShadow = "0 4px 12px rgba(107,140,110,0.25)")}
            >
              {loading ? "Iniciando sesión..." : "Ingresar al POS"}
            </button>
          </div>
          
          <div style={{ marginTop:48, textAlign:"center" }}>
            <p style={{ fontSize:14, color:"var(--ink-light)" }}>¿Problemas para ingresar? Contactá al administrador.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
