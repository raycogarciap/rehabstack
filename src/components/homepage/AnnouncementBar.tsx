"use client";

// Barra de anuncio superior — muestra disponibilidad multilingüe
// Se oculta automáticamente en rutas de dashboard, auth y admin
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

// Rutas donde el navbar público no debe aparecer
const HIDDEN_ON = ["/dashboard", "/login", "/register", "/creator", "/admin"];

export function AnnouncementBar() {
  const t = useTranslations("homepage");
  const pathname = usePathname();

  if (HIDDEN_ON.some((route) => pathname.includes(route))) return null;

  return (
    <div className="bg-[#4F46E5] text-white text-sm text-center py-2.5 px-4">
      <span className="font-medium">{t("announcementBar.text")}</span>{" "}
      <span className="opacity-90">{t("announcementBar.subtext")}</span>
    </div>
  );
}
