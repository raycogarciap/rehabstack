"use client";

// Navbar principal de RehabStack
// - Logo con "Rehab" en slate y "Stack" en indigo
// - Links de navegación desktop con dropdown "For Creators"
// - Botón "Get Started", icono de idioma
// - Menú hamburguesa para móvil
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, ChevronDown } from "lucide-react";

// Items del menú principal (sin "For Creators" que tiene dropdown propio)
const NAV_LINKS = [
  { label: "Agents", href: "/agents" },
  { label: "Showcase", href: "/showcase" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

// Items del dropdown "For Creators"
const CREATOR_LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "List Your Agent", href: "/for-creators" },
  { label: "Creator Dashboard", href: "/creator" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creatorDropdownOpen, setCreatorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Determina si un link está activo comparando con el pathname actual
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

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
                For Creators
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    creatorDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Panel del dropdown */}
              {creatorDropdownOpen && (
                <div className="absolute left-0 mt-1 w-48 rounded-lg bg-white shadow-lg border border-gray-100 py-1 z-50">
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
              Log in
            </Link>

            {/* Icono de cambio de idioma (sin funcionalidad por ahora) */}
            <button
              aria-label="Change language"
              className="p-2 rounded-md text-[#64748B] hover:text-[#1E293B] transition-colors"
            >
              <Globe className="h-5 w-5" />
            </button>

            {/* Botón "Get Started" */}
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#3730A3] transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Botón hamburguesa — móvil */}
          <button
            className="md:hidden p-2 rounded-md text-[#64748B] hover:text-[#1E293B] transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
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
              Log in
            </Link>

            {/* Sección "For Creators" en móvil — expandida directamente */}
            <div className="pt-1">
              <p className="px-3 py-1 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                For Creators
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

            {/* Botón "Get Started" en móvil */}
            <div className="pt-3">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center px-4 py-2.5 rounded-lg bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#3730A3] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
