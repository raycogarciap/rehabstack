// Pie de página principal del sitio — Server Component
// Cinco columnas: marca + Product + Resources + Company + Legal
// Barra inferior con copyright y selector visual de idioma
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// SVG inline — lucide-react v1.8.0 no incluye iconos de redes sociales
function IconInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconYoutube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
}

function IconTwitter() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Idiomas disponibles — solo visual en el footer
const LANGUAGES = ["EN", "ES", "PT", "FR", "DE", "AR"];

export async function Footer() {
  const t = await getTranslations("homepage");

  // Columnas de navegación del footer — etiquetas traducidas
  const FOOTER_COLUMNS = [
    {
      heading: t("footer.product"),
      links: [
        { label: t("footer.links.agents"), href: "/agents" },
        { label: t("footer.links.showcase"), href: "/showcase" },
        { label: t("footer.links.howItWorks"), href: "/how-it-works" },
        { label: t("footer.links.pricing"), href: "/agents" },
      ],
    },
    {
      heading: t("footer.resources"),
      links: [
        { label: t("footer.links.blog"), href: "/blog" },
        { label: t("footer.links.documentation"), href: "/docs" },
        { label: t("footer.links.community"), href: "/about" },
      ],
    },
    {
      heading: t("footer.company"),
      links: [
        { label: t("footer.links.about"), href: "/about" },
        { label: t("footer.links.contact"), href: "/about" },
        { label: t("footer.links.forCreators"), href: "/for-creators" },
      ],
    },
    {
      heading: t("footer.legal"),
      links: [
        { label: t("footer.links.terms"), href: "/terms" },
        { label: t("footer.links.privacy"), href: "/privacy" },
        { label: t("footer.links.creatorAgreement"), href: "/creator-agreement" },
      ],
    },
  ];

  return (
    <footer className="bg-[#0F172A] pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Fila superior: columna de marca (2/5) + cuatro columnas de nav */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

          {/* Columna de marca — ocupa 2 columnas en desktop */}
          <div className="col-span-2 md:col-span-2">
            {/* Logo */}
            <Link href="/" className="inline-flex items-baseline">
              <span className="text-xl font-bold text-white">Rehab</span>
              <span className="text-xl font-bold text-[#818CF8]">Stack</span>
            </Link>

            {/* Tagline traducida */}
            <p className="text-[#94A3B8] text-sm mt-2 mb-4 max-w-xs leading-relaxed">
              {t("footer.tagline")}
            </p>

            {/* Iconos de redes sociales */}
            <div className="flex gap-4 items-center">
              <a
                href="https://instagram.com/rehabstack"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <IconInstagram />
              </a>
              <a
                href="https://youtube.com/@rehabstack"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <IconYoutube />
              </a>
              <a
                href="https://twitter.com/rehabstack"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <IconTwitter />
              </a>
              {/* Skool — sin icono en lucide-react, badge de texto */}
              <a
                href="https://skool.com/rehabstack"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Skool community"
                className="text-xs font-bold text-[#64748B] hover:text-white transition-colors"
              >
                Sk
              </a>
            </div>
          </div>

          {/* Columnas de navegación */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-white font-semibold text-sm mb-4">{col.heading}</p>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href + link.label} className="mb-2">
                    <Link
                      href={link.href}
                      className="text-[#94A3B8] hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Barra inferior: copyright + selector de idioma */}
        <div className="border-t border-[#1E293B] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">

          {/* Copyright traducido */}
          <p className="text-[#64748B] text-sm">
            {t("footer.copyright")}
          </p>

          {/* Pills de idioma — solo visual */}
          <div className="flex gap-4">
            {LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="text-xs text-[#64748B] hover:text-white cursor-pointer transition-colors"
              >
                {lang}
              </span>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
