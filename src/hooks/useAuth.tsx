"use client";
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabaseClient";

export type EmpleadoAuth = {
  id: string; nombre: string; apellido: string; es_administrador: boolean;
};

type AuthState = "loading" | "unauthenticated" | "authenticated";
type AuthContextType = {
  state: AuthState; isLoading: boolean; isAuthenticated: boolean; isAdmin: boolean;
  empleado: EmpleadoAuth | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [empleado, setEmpleado] = useState<EmpleadoAuth | null>(null);
  const done = useRef(false);

  const cargarEmpleado = async (userId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("empleados").select("id, nombre, apellido, es_administrador")
      .eq("auth_user_id", userId).eq("activo", true).maybeSingle();
    if (data && !error) { setEmpleado(data as EmpleadoAuth); setState("authenticated"); return true; }
    console.warn("Sin empleado:", userId, error?.message);
    setEmpleado(null); setState("unauthenticated"); return false;
  };

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!done.current) return;
      if (session?.user?.id) cargarEmpleado(session.user.id);
      else { setEmpleado(null); setState("unauthenticated"); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      done.current = true;
      if (session?.user?.id) cargarEmpleado(session.user.id);
      else setState("unauthenticated");
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Email o contraseña incorrectos");
    if (data.user?.id) {
      const ok = await cargarEmpleado(data.user.id);
      if (!ok) { await supabase.auth.signOut(); throw new Error("Sin acceso. Contactá al administrador."); }
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmpleado(null); setState("unauthenticated");
  };

  return (
    <AuthContext.Provider value={{ state, isLoading: state==="loading", isAuthenticated: state==="authenticated", isAdmin: empleado?.es_administrador??false, empleado, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
