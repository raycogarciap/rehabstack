// Sección de llamada a la acción final — Server Component
// El formulario de email se delega a EmailCaptureForm (Client Component)
import Link from "next/link";
import { EmailCaptureForm } from "./EmailCaptureForm";

export function FinalCTA() {
  return (
    <section
      id="final-cta"
      className="py-24 px-4 bg-gradient-to-br from-[#4F46E5] to-[#3730A3]"
    >
      <div className="max-w-3xl mx-auto text-center">

        {/* Badge eyebrow */}
        <span className="inline-block bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
          48-Hour Free Trial · Card Required · Cancel Anytime
        </span>

        {/* Titular principal */}
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          Your practice growth shouldn&apos;t depend on how many hours you work.
        </h2>

        {/* Subtítulo */}
        <p className="text-lg text-indigo-200 max-w-xl mx-auto mb-10 leading-relaxed">
          Start with the Content Engine and see your first content package in
          under 5 minutes.
        </p>

        {/* CTA principal */}
        <Link
          href="/register"
          className="bg-white text-[#4F46E5] hover:bg-gray-50 px-10 py-4 rounded-xl font-bold text-lg transition-colors inline-block shadow-lg"
        >
          Start Your Free Trial →
        </Link>

        {/* Bloque de captura de email */}
        <div className="mt-10">
          <p className="text-indigo-200 text-sm mb-3">Not ready yet?</p>
          <p className="text-white text-sm font-medium mb-4">
            Get weekly insights on AI for rehabilitation professionals. No spam, unsubscribe anytime.
          </p>
          {/* Client Component para el formulario interactivo */}
          <EmailCaptureForm />
        </div>

      </div>
    </section>
  );
}
