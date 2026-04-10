// Layout compartido para las páginas de autenticación (/login y /register).
// Centra el contenido vertical y horizontalmente con un fondo neutro limpio,
// y muestra el nombre/logo de RehabStack en la parte superior.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RehabStack",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / nombre de la aplicación */}
      <div className="mb-8 text-center">
        <span className="text-3xl font-bold tracking-tight text-neutral-900">
          Rehab<span className="text-blue-600">Stack</span>
        </span>
        <p className="mt-1 text-sm text-neutral-500">
          AI Agent Marketplace for Rehab Professionals
        </p>
      </div>

      {/* Contenido de la página de autenticación */}
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
