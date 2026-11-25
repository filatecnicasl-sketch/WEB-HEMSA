export const REGISTRO_URL = "https://hemsa-frontend.onrender.com/admin";

export const CONTACT = {
  phone: "956 94 50 00",
  phoneHref: "+34956945000",
  email: "correo@hemsasanfernando.es",
  address: "Avda. San Juan Bosco, 46 · 11100 San Fernando (Cádiz)",
  hours: "de 9:00 a 13:30 h",
  cif: "A11376548",
  company: "HUB EMPRESA MUNICIPAL DE SAN FERNANDO MP S.A. (HEMSA)",
};

export const IMG = {
  logoH: "/brand/logo-pie.jpg",
  logoV: "/brand/logo.jpg",
  mark: "/brand/favicon.png",
  banner: "/brand/banner.png",
  logoCentro: "/brand/logo-centro.jpg",
  promociones: "/brand/promociones.png",
  promociones2: "/brand/promocion-2.jpg",
  garajes: "/brand/garajes.jpeg",
  bahia: "https://images.unsplash.com/photo-1700678619535-81f9bcf5f77c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
  calle: "https://images.unsplash.com/photo-1759434610921-0e91414e3b6b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  llaves: "https://images.unsplash.com/photo-1741156386380-0236c72eb6f9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  cuidado: "https://images.unsplash.com/photo-1765896387377-e293914d1e69?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  cuidado2: "https://images.unsplash.com/photo-1762955911431-4c44c7c3f408?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
};

export const SERVICES = [
  {
    id: "vivienda",
    title: "Nuevas promociones de viviendas en venta",
    short: "Promociones de vivienda",
    text: "Viviendas de nueva construcción en San Fernando a precios asequibles, pensadas para las familias isleñas.",
    warm: "Tu nuevo hogar en La Isla, a un precio pensado para ti y tu familia.",
    href: "/promociones-vivienda",
    img: IMG.promociones,
    icon: "Building2",
  },
  {
    id: "garajes",
    title: "Venta de garajes y trasteros en Ronda del Estero",
    short: "Garajes y trasteros",
    text: "Plazas de garaje y trasteros en propiedad disponibles en Ronda del Estero.",
    warm: "Más espacio para lo tuyo: garajes y trasteros cerca de casa.",
    href: "/garajes-trasteros",
    img: IMG.garajes,
    icon: "Car",
  },
  {
    id: "venta_vivienda",
    title: "HEMSA compra viviendas en San Fernando",
    short: "HEMSA compra viviendas",
    text: "Si desea vender su vivienda, HEMSA puede adquirirla para ampliar el parque público municipal.",
    warm: "¿Quieres vender tu casa? Te escuchamos y te acompañamos en todo el proceso.",
    href: "/hemsa-compra-viviendas",
    img: IMG.llaves,
    icon: "KeyRound",
  },
  {
    id: "ayuda_domicilio",
    title: "Servicio Municipal de Ayuda a Domicilio",
    short: "Ayuda a domicilio",
    text: "Atención y apoyo en el hogar para personas mayores y en situación de dependencia de San Fernando.",
    warm: "Cuidamos de quienes más quieres, en su propia casa y con trato cercano.",
    href: "/ayuda-domicilio",
    img: IMG.cuidado2,
    icon: "HeartHandshake",
  },
];

export const MOTIVOS = [
  { value: "vivienda", label: "Promociones de vivienda" },
  { value: "garajes", label: "Garajes y trasteros" },
  { value: "venta_vivienda", label: "Vender mi vivienda a HEMSA" },
  { value: "ayuda_domicilio", label: "Ayuda a domicilio" },
  { value: "otro", label: "Otro motivo" },
];

export const motivoLabel = (v) => MOTIVOS.find((m) => m.value === v)?.label || v;

export const HISTORY = {
  title: "HEMSA, un nuevo nombre para una nueva etapa",
  intro:
    "HUB EMPRESA MUNICIPAL DE SAN FERNANDO MP S.A. (HEMSA) es la nueva denominación de la histórica empresa pública del Ayuntamiento de San Fernando, Empresa de Suelo Isleña S.A. (ESISA).",
  p2: "Comienza así, una nueva etapa para convertirse en una empresa de gestión de Servicios Públicos.",
  p3: "Como Medio Propio y Servicio Técnico del Ayuntamiento de San Fernando, podemos recibir encargos de servicios que se encuentren en nuestro objeto social que ya ha sido ampliado con el Servicio Municipal de Ayuda a Domicilio.",
  timeline: [
    { year: "1996", title: "Nace ESISA", text: "El Excmo. Ayuntamiento de San Fernando constituye la Empresa De Suelo Isleña, S.A. (ESISA), la empresa pública municipal, para la construcción de viviendas y la gestión de suelo." },
    { year: "2024", title: "Nace HEMSA", text: "La Junta General de ESISA aprueba el 22 de marzo de 2024 la modificación de estatutos que incluye la declaración como Medio Propio del Ayuntamiento de San Fernando y el cambio de denominación a HEMSA." },
    { year: "Hoy", title: "Servicios públicos", text: "Vivienda, garajes y trasteros, compra de viviendas y Servicio Municipal de Ayuda a Domicilio para toda la ciudadanía." },
  ],
};

export const LINKS = [
  { label: "Consejería de Fomento, Infraestructuras y Ordenación del Territorio", href: "https://www.juntadeandalucia.es/organismos/fomentoinfraestructurasyordenaciondelterritorio.html" },
  { label: "Ministerio de Fomento y Vivienda", href: "https://www.fomento.gob.es/vivienda" },
  { label: "Ayuntamiento de San Fernando", href: "http://www.sanfernando.es/ayto/" },
  { label: "Perfil contratante HEMSA", href: "https://contrataciondelestado.es/wps/portal/!ut/p/b0/DcexDkAwEADQTzqbkBgQC5Gw0HY7WnJxTjUNv8_bHhhQYAQf2jHSJcj_tXXOM8mRexc24vqSGDCiRAczGDBkKw86u_uVllYG7tQ4JXOTsh7eogB_nuUHDNVcvg!!/" },
  { label: "Estatutos HEMSA refundidos", href: "/docs/estatutos-hemsa.pdf" },
];

export const LEGAL = [
  { label: "Aviso legal", href: "/aviso-legal" },
  { label: "Política de cookies", href: "/politica-cookies" },
  { label: "Política de privacidad", href: "/politica-privacidad" },
];
