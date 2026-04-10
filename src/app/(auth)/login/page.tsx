// Página de inicio de sesión.
// Ofrece dos métodos: email + contraseña y magic link (enlace mágico sin contraseña).
// Los formularios usan Server Actions para enviar los datos de forma segura.
// Tras un login exitoso con contraseña, Supabase redirige al callback de auth.
// El magic link envía un correo y muestra confirmación en pantalla.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Login | RehabStack",
  description: "Sign in to your RehabStack account.",
};

// -------------------------------------------------------------------
// Server Actions
// -------------------------------------------------------------------

// Inicia sesión con email y contraseña.
// Si hay error, redirige de vuelta a /login con el mensaje en la URL.
// Si tiene éxito, Supabase redirige al callback de auth que lleva al /dashboard.
async function loginWithPassword(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Redirige al dashboard tras un login exitoso
  redirect("/dashboard");
}

// Envía un magic link al email indicado (inicio de sesión sin contraseña).
// El enlace lleva al usuario al callback de auth que inicia la sesión.
async function loginWithMagicLink(formData: FormData) {
  "use server";

  const email = formData.get("magic-email") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Después de hacer clic en el enlace, redirige al callback de auth
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Indica al usuario que revise su correo
  redirect("/login?magic=sent");
}

// -------------------------------------------------------------------
// Componente de página
// -------------------------------------------------------------------

interface LoginPageProps {
  searchParams: Promise<{ error?: string; magic?: string; redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error;
  const magicSent = params.magic === "sent";

  return (
    <>
      {/* Formulario principal: email + contraseña */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Mensaje de error proveniente de la Server Action */}
          {errorMessage && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {errorMessage}
            </div>
          )}

          <form action={loginWithPassword} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-neutral-500">
          Don&apos;t have an account?&nbsp;
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:underline"
          >
            Create one
          </Link>
        </CardFooter>
      </Card>

      {/* Separador visual */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs text-neutral-400">
          <span className="bg-neutral-50 px-2">or</span>
        </div>
      </div>

      {/* Formulario de magic link (sin contraseña) */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Sign in with a magic link</CardTitle>
          <CardDescription className="text-sm">
            We&apos;ll send you a one-click login link — no password needed.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Confirmación de magic link enviado */}
          {magicSent && (
            <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
              Check your inbox — the magic link is on its way!
            </div>
          )}

          <form action={loginWithMagicLink} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                name="magic-email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" variant="outline" className="w-full">
              Send magic link
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
