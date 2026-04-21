"use client";

// Selector de idioma del footer — Client Component separado
// Footer.tsx (Server Component) lo importa para mantener el límite cliente/servidor correcto
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "pt", label: "PT" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "ar", label: "AR" },
];

export function FooterLanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // Navega al mismo path con el nuevo locale como prefijo
  function switchLocale(code: string) {
    const withoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
    router.push("/" + code + withoutLocale);
  }

  return (
    <div className="flex gap-4 flex-wrap">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLocale(lang.code)}
          className={`text-xs font-medium transition-colors cursor-pointer ${
            locale === lang.code
              ? "text-white font-bold"
              : "text-[#64748B] hover:text-white"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
