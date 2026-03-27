-- ═══════════════════════════════════════════════════════════════
-- TABLA: mesas
-- ═══════════════════════════════════════════════════════════════

-- 1. Crear tabla (si no existe)
CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'libre' 
    CHECK (estado IN ('libre', 'ocupada', 'lista_cobro', 'sucia')),
  ocupada_desde TIMESTAMP WITH TIME ZONE,
  pedido_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_mesas_numero ON public.mesas(numero);
CREATE INDEX IF NOT EXISTS idx_mesas_estado ON public.mesas(estado);

-- 3. Habilitar Realtime para que los cambios se reflejen en tiempo real
-- (Ya debería estar habilitado, pero lo dejamos explícito)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.mesas;

-- 4. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mesas_updated_at ON public.mesas;
CREATE TRIGGER update_mesas_updated_at BEFORE UPDATE ON public.mesas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Habilitar RLS (Row Level Security) para seguridad
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;

-- 6. Crear política de lectura pública (para la app)
DROP POLICY IF EXISTS "Allow public read" ON public.mesas;
CREATE POLICY "Allow public read" ON public.mesas
  FOR SELECT USING (true);

-- 7. Crear política de actualización (si necesitas editar desde la app)
DROP POLICY IF EXISTS "Allow public update" ON public.mesas;
CREATE POLICY "Allow public update" ON public.mesas
  FOR UPDATE USING (true);

-- 8. Insertar datos de ejemplo (8 mesas)
DELETE FROM public.mesas; -- Limpiar primero
INSERT INTO public.mesas (numero, estado) VALUES
  (1, 'libre'),
  (2, 'libre'),
  (3, 'libre'),
  (4, 'libre'),
  (5, 'libre'),
  (6, 'libre'),
  (7, 'libre'),
  (8, 'libre');

-- ✅ Verificar que se insertaron correctamente
SELECT * FROM public.mesas ORDER BY numero;
