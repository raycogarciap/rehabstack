"use client";

// Navbar principal de RehabStack
// - Logo con "Rehab" en slate y "Stack" en indigo
// - Links de navegación desktop con dropdown "For Creators"
// - Selector de idioma funcional con dropdown y useLocale
// - Menú hamburguesa para móvil
// - Se oculta automáticamente en rutas de dashboard, auth y admin
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, Globe, ChevronDown } from "lucide-react";

// Rutas donde el navbar público no debe aparecer
const HIDDEN_ON = ["/dashboard", "/login", "/register", "/creator", "/admin"];

// Idiomas soportados con bandera y etiqueta — estáticos, no se traducen
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");

  // Ocultar en rutas que tienen su propia navegación (dashboard, auth, admin)
  if (HIDDEN_ON.some((route) => pathname.includes(route))) return null;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [creatorDropdownOpen, setCreatorDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Cierra el dropdown de creadores al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCreatorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cierra el dropdown de idioma al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determina si un link está activo comparando con el pathname actual
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Navega al mismo path pero con el nuevo locale como prefijo
  function switchLocale(code: string) {
    const withoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
    router.push("/" + code + withoutLocale);
    setLangOpen(false);
  }

  // Al abrir el menú móvil, cierra los dropdowns desktop y viceversa
  function toggleMobile() {
    setMobileOpen((prev) => {
      if (!prev) {
        setCreatorDropdownOpen(false);
        setLangOpen(false);
      }
      return !prev;
    });
  }

  // Items del menú principal — construidos con t() para que se traduzcan
  const NAV_LINKS = [
    { label: t("agents"), href: "/agents" },
    { label: t("showcase"), href: "/showcase" },
    { label: t("howItWorks"), href: "/how-it-works" },
    { label: t("blog"), href: "/blog" },
    { label: t("about"), href: "/about" },
  ];

  // Items del dropdown "For Creators" — también traducidos
  const CREATOR_LINKS = [
    { label: t("documentation"), href: "/docs" },
    { label: t("listYourAgent"), href: "/for-creators" },
    { label: t("creatorDashboard"), href: "/creator" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-xl font-bold text-[#1E293B]">Rehab</span>
            <span className="text-xl font-bold text-[#4F46E5]">Stack</span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#4F46E5]"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Dropdown "For Creators" */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setCreatorDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  creatorDropdownOpen || CREATOR_LINKS.some((l) => isActive(l.href))
                    ? "text-[#4F46E5]"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
                aria-expanded={creatorDropdownOpen}
                aria-haspopup="true"
              >
                {t("forCreators")}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    creatorDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Panel del dropdown de creadores */}
              {creatorDropdownOpen && (
                <div className="absolute left-0 mt-1 w-52 rounded-lg bg-white shadow-lg border border-gray-100 py-1 z-50">
                  {CREATOR_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setCreatorDropdownOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive(link.href)
                          ? "text-[#4F46E5] bg-[#EEF2FF]"
                          : "text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Acciones del lado derecho — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Link "Log in" */}
            <Link
              href="/login"
              className="text-[#64748B] hover:text-[#4F46E5] font-medium transition-colors text-sm"
            >
              {t("logIn")}
            </Link>

            {/* Selector de idioma con dropdown funcional */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((prev) => !prev)}
                aria-label="Change language"
                aria-expanded={langOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#4F46E5] transition-colors px-2 py-1 rounded-md hover:bg-[#EEF2FF]"
              >
                <Globe className="h-4 w-4" />
                <span className="font-medium">{locale.toUpperCase()}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    langOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Panel del dropdown de idiomas */}
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-100 rounded-xl shadow-lg py-2 min-w-[160px]">
                  {LANGUAGES.map(({ code, label, flag }) => (
                    <button
                      key={code}
                      onClick={() => switchLocale(code)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm cursor-pointer transition-colors text-left ${
                        code === locale
                          ? "text-[#4F46E5] font-semibold bg-[#EEF2FF]"
                          : "text-[#1E293B] hover:bg-gray-50"
                      }`}
                    >
                      <span>{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón "Get Started" */}
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#3730A3] transition-colors"
            >
              {t("getStarted")}
            </Link>
          </div>

          {/* Botón hamburguesa — móvil */}
          <button
            className="md:hidden p-2 rounded-md text-[#64748B] hover:text-[#1E293B] transition-colors"
            onClick={toggleMobile}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 pt-2 pb-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#4F46E5] bg-[#EEF2FF]"
                    : "text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Link "Log in" en móvil */}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive("/login")
                  ? "text-[#4F46E5] bg-[#EEF2FF]"
                  : "text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50"
              }`}
            >
              {t("logIn")}
            </Link>

            {/* Sección "For Creators" en móvil — expandida directamente */}
            <div className="pt-1">
              <p className="px-3 py-1 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                {t("forCreators")}
              </p>
              {CREATOR_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-[#4F46E5] bg-[#EEF2FF]"
                      : "text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Selector de idioma en móvil — grid de pills */}
            <div className="pt-2 pb-1">
              <p className="px-3 py-1 text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                Language
              </p>
              <div className="grid grid-cols-3 gap-2 px-3">
                {LANGUAGES.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onClick={() => { switchLocale(code); setMobileOpen(false); }}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                      code === locale
                        ? "bg-[#EEF2FF] text-[#4F46E5]"
                        : "bg-gray-50 text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#4F46E5]"
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón "Get Started" en móvil */}
            <div className="pt-3">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center px-4 py-2.5 rounded-lg bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#3730A3] transition-colors"
              >
                {t("getStarted")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
