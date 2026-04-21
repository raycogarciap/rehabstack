"use client";

// Barra de anuncio superior — muestra disponibilidad multilingüe
export function AnnouncementBar() {
  return (
    <div className="bg-[#4F46E5] text-white text-sm text-center py-2.5 px-4">
      <span className="font-medium">Now available in 6 languages.</span>{" "}
      <span className="opacity-90">
        AI assistants for physiotherapists, chiropractors &amp; osteopaths worldwide.
      </span>
    </div>
  );
}
