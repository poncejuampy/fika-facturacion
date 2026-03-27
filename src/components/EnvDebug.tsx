"use client";

export function EnvDebug() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("🔍 ENV DEBUG:", {
    URL: url ? `${url.slice(0, 20)}...` : "UNDEFINED",
    KEY: key ? `${key.slice(0, 20)}...` : "UNDEFINED",
  });

  if (!url || !key) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 rounded">
        <h3 className="font-bold text-red-800">❌ Variables de Entorno No Inyectadas</h3>
        <p className="text-red-700 text-sm mt-2">
          URL: {url ? "✓" : "✗ UNDEFINED"}
        </p>
        <p className="text-red-700 text-sm">
          ANON_KEY: {key ? "✓" : "✗ UNDEFINED"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 border border-green-400 rounded">
      <h3 className="font-bold text-green-800">✓ Variables de Entorno Inyectadas</h3>
      <p className="text-green-700 text-sm mt-2">
        URL: {url.slice(0, 30)}...
      </p>
    </div>
  );
}
