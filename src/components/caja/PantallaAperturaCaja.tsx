"use client";

import { useState, useEffect } from "react";
import { useAbrirCaja } from "@/hooks/useSesionCaja";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Lock } from "lucide-react";

export function PantallaAperturaCaja() {
  const [fondo, setFondo] = useState("");
  const [error, setError] = useState("");
  const [horaActual, setHoraActual] = useState("");
  const [fechaActual, setFechaActual] = useState("");
  
  const { empleado, signOut } = useAuth();
  const abrir = useAbrirCaja();

  // Reloj en tiempo real
  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      setHoraActual(ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
      setFechaActual(ahora.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }));
    };
    actualizar();
    const interval = setInterval(actualizar, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAbrir = async () => {
    setError("");
    const monto = parseFloat(fondo) || 0;
    
    if (monto < 0) { 
      setError("El fondo inicial no puede ser negativo"); 
      return; 
    }

    try {
      await abrir.mutateAsync(monto);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al abrir el turno");
    }
  };

  return (
    <div style={{
      position: "fixed", 
      inset: 0,
      background: "var(--ink)",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      zIndex: 2000,
    }}>
      <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 420, width: "100%" }}>

        {/* Logo Fika */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: 48, 
            color: "var(--cream)", 
            marginBottom: 6, 
            letterSpacing: "-1px" 
          }}>
            Fika
          </p>
          <div style={{ 
            height: 1, 
            width: 40, 
            background: "var(--sage)", 
            margin: "0 auto 12px" 
          }} />
          <p style={{ 
            fontFamily: "'DM Sans', sans-serif", 
            fontSize: 11, 
            color: "var(--ink-light)", 
            letterSpacing: "0.25em", 
            textTransform: "uppercase" 
          }}>
            Sistema de Gestión · Catamarca
          </p>
        </div>

        {/* Reloj Central */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: 36, 
            color: "var(--cream)", 
            marginBottom: 4 
          }}>
            {horaActual}
          </p>
          <p style={{ 
            fontSize: 13, 
            color: "var(--ink-light)", 
            textTransform: "capitalize",
            fontFamily: "'DM Sans', sans-serif" 
          }}>
            {fechaActual}
          </p>
        </div>

        {/* Card de Acción */}
        <div style={{ 
          background: "rgba(242,235,224,0.04)", 
          borderRadius: 24, 
          padding: "32px 28px", 
          border: "1px solid rgba(242,235,224,0.1)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)"
        }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: 20, 
              color: "var(--cream)", 
              marginBottom: 8 
            }}>
              Hola, {empleado?.nombre || "Empleado"}
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-light)" }}>
              Para comenzar a facturar, debés abrir el turno.
            </p>
          </div>

          <div style={{ marginBottom: 24, textAlign: "left" }}>
            <label style={{ 
              fontSize: 10, 
              textTransform: "uppercase", 
              letterSpacing: "0.1em", 
              color: "var(--ink-light)", 
              display: "block", 
              marginBottom: 10,
              fontWeight: 600
            }}>
              Fondo inicial en caja ($)
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={fondo}
                onChange={e => setFondo(e.target.value)}
                placeholder="0.00"
                onKeyDown={e => e.key === "Enter" && handleAbrir()}
                style={{
                  width: "100%", 
                  padding: "16px", 
                  borderRadius: 14,
                  border: "1px solid rgba(242,235,224,0.15)",
                  background: "rgba(242,235,224,0.06)",
                  color: "white", 
                  fontSize: 24,
                  fontFamily: "'Playfair Display', serif",
                  outline: "none", 
                  textAlign: "center",
                  transition: "border-color 0.2s"
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: "var(--ink-light)", marginTop: 10, textAlign: "center", fontStyle: "italic" }}>
              Efectivo disponible para dar vuelto.
            </p>
          </div>

          {error && (
            <div style={{ 
              background: "rgba(181,98,90,0.15)", 
              border: "1px solid var(--rose)", 
              borderRadius: 10, 
              padding: "10px", 
              marginBottom: 20 
            }}>
              <p style={{ fontSize: 12, color: "#F09595", textAlign: "center" }}>
                {error}
              </p>
            </div>
          )}

          <button
            onClick={handleAbrir}
            disabled={abrir.isPending}
            style={{
              width: "100%", 
              padding: "16px 0", 
              borderRadius: 14,
              background: abrir.isPending ? "var(--ink-mid)" : "var(--sage)",
              border: "none", 
              color: "white",
              fontFamily: "'DM Sans', sans-serif", 
              fontSize: 14, 
              fontWeight: 600,
              cursor: abrir.isPending ? "not-allowed" : "pointer",
              transition: "transform 0.1s, background 0.2s",
              boxShadow: "0 10px 20px rgba(107,140,110,0.2)"
            }}>
            {abrir.isPending ? "Procesando..." : "ABRIR TURNO AHORA"}
          </button>
        </div>

        {/* Logout */}
        <button 
          onClick={signOut} 
          style={{ 
            marginTop: 40, 
            background: "none", 
            border: "none", 
            color: "var(--ink-light)", 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            margin: "40px auto 0",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "var(--rose)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--ink-light)")}
        >
          <LogOut size={14} /> Cerrar sesión de {empleado?.nombre}
        </button>
      </div>
    </div>
  );
}