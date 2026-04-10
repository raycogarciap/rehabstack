// Página de registro de nuevos usuarios.
// Recoge email, contraseña, nombre completo, especialidad e idioma preferido.
// Usa una Server Action para crear la cuenta con Supabase Auth.
// Tras el registro exitoso, muestra un mensaje de confirmación por email
// (Supabase envía el enlace de verificación automáticamente).

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create Account | RehabStack",
  description:
    "Join RehabStack — the AI agent marketplace for rehabilitation professionals.",
};

// Opciones de especialidad disponibles en el marketplace
const SPECIALTIES = [
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Athletic Training",
  "Chiropractic",
  "Massage Therapy",
  "Other",
];

// Idiomas soportados (i18n: EN, ES, PT)
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
];

// -------------------------------------------------------------------
// Server Action
// -------------------------------------------------------------------

// Crea la cuenta en Supabase Auth e inserta el perfil en public.users.
// Supabase envía automáticamente un email de verificación con el enlace
// configurado en emailRedirectTo.
async function registerUser(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const specialty = formData.get("specialty") as string;
  const language = (formData.get("language") as string) || "en";

  const supabase = await createClient();

  // Crea el usuario en auth.users y envía el email de confirmación
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Datos adicionales que Supabase incluye en el JWT y en auth.users.raw_user_meta_data
      data: { name, specialty, language },
      // Tras confirmar el email, el usuario llega al callback de auth
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // Si el usuario ya existe y está confirmado, Supabase no devuelve error
  // pero sí devuelve identities vacío — lo tratamos como "email ya registrado"
  if (data.user && data.user.identities?.length === 0) {
    redirect(
      `/register?error=${encodeURIComponent("This email is already registered.")}`
    );
  }

  // Inserta el perfil en public.users usando el id del usuario recién creado.
  // Nota: esto puede fallar si el usuario no está confirmado aún, dependiendo
  // de la política RLS. En ese caso, el trigger on_auth_user_created puede
  // encargarse de esta inserción desde la base de datos.
  if (data.user) {
    await supabase.from("users").insert({
      id: data.user.id,
      email,
      name,
      specialty,
      language,
    });
  }

  // Redirige a /register con la bandera de confirmación pendiente
  redirect("/register?confirm=pending");
}

// -------------------------------------------------------------------
// Componente de página
// -------------------------------------------------------------------

interface RegisterPageProps {
  searchParams: Promise<{ error?: string; confirm?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const errorMessage = params.error;
  const confirmPending = params.confirm === "pending";

  // Si el registro fue exitoso, muestra solo el mensaje de confirmación
  if (confirmPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link. Click it to activate your
            account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-green-50 px-4 py-4 text-sm text-green-700 border border-green-200">
            <p className="font-medium">Almost there!</p>
            <p className="mt-1">
              Open your inbox and click the link to complete your registration.
              The link expires in 24 hours.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-sm text-neutral-500">
          Already confirmed?&nbsp;
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Join the marketplace for rehabilitation professionals.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Mensaje de error proveniente de la Server Action */}
        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form action={registerUser} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@clinic.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {/* Nombre completo */}
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Dr. Jane Smith"
              required
              autoComplete="name"
            />
          </div>

          {/* Especialidad — input oculto recibe el valor del Select */}
          <div className="space-y-1">
            <Label htmlFor="specialty">Specialty</Label>
            <Select name="specialty" required>
              <SelectTrigger id="specialty">
                <SelectValue placeholder="Select your specialty" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Idioma preferido */}
          <div className="space-y-1">
            <Label htmlFor="language">Preferred language</Label>
            <Select name="language" defaultValue="en">
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-neutral-500">
        Already have an account?&nbsp;
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
