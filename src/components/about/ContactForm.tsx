"use client";

// components/about/ContactForm.tsx
// Formulario de contacto con validación react-hook-form + zod.
// Al enviar muestra un estado de éxito en UI (Resend integration viene después).

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Esquema de validación Zod
const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

// Clases reutilizables para los inputs
const inputClass =
  "border border-gray-200 rounded-lg px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] mb-1 transition-colors";

const errorClass = "text-xs text-red-500 mb-3 block";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(_data: FormData) {
    // Simula latencia de red — Resend integration pendiente
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
  }

  // Estado de éxito
  if (submitted) {
    return (
      <div className="bg-[#F0F7F1] rounded-2xl p-10 text-center">
        <div className="bg-[#6B9E78] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
          {/* Checkmark SVG */}
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-bold text-[#1E293B] text-xl mb-2">Message sent!</h3>
        <p className="text-[#64748B] text-sm">
          We&apos;ll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Nombre */}
      <label className="block text-sm font-medium text-[#374151] mb-1">
        Name
      </label>
      <input
        {...register("name")}
        type="text"
        placeholder="Your name"
        className={inputClass}
      />
      {errors.name && <span className={errorClass}>{errors.name.message}</span>}

      {/* Email */}
      <label className="block text-sm font-medium text-[#374151] mb-1">
        Email
      </label>
      <input
        {...register("email")}
        type="email"
        placeholder="your@email.com"
        className={inputClass}
      />
      {errors.email && <span className={errorClass}>{errors.email.message}</span>}

      {/* Subject */}
      <label className="block text-sm font-medium text-[#374151] mb-1">
        Subject
      </label>
      <select
        {...register("subject")}
        className={inputClass}
        defaultValue=""
      >
        <option value="" disabled>
          Select a subject…
        </option>
        <option value="general">General Question</option>
        <option value="partnership">Partnership</option>
        <option value="creator">Creator / Developer Inquiry</option>
        <option value="press">Press</option>
        <option value="other">Other</option>
      </select>
      {errors.subject && (
        <span className={errorClass}>{errors.subject.message}</span>
      )}

      {/* Mensaje */}
      <label className="block text-sm font-medium text-[#374151] mb-1">
        Message
      </label>
      <textarea
        {...register("message")}
        rows={5}
        placeholder="Tell us what's on your mind..."
        className={inputClass}
      />
      {errors.message && (
        <span className={errorClass}>{errors.message.message}</span>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#4F46E5] text-white hover:bg-[#3730A3] py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        {isSubmitting ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
