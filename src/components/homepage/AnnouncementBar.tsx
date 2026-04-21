"use client";

// Barra de anuncio superior — muestra disponibilidad multilingüe
import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations("homepage");
  return (
    <div className="bg-[#4F46E5] text-white text-sm text-center py-2.5 px-4">
      <span className="font-medium">{t("announcementBar.text")}</span>{" "}
      <span className="opacity-90">{t("announcementBar.subtext")}</span>
    </div>
  );
}
