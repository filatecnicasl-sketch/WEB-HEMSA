export const defaultContent = {
  notice: {
    enabled: false,
    label: 'Actualidad',
    text: 'Convocatorias 2026 del Servicio de Ayuda a Domicilio',
    link: '/empleo',
  },
  hero: {
    eyebrow: 'Tu empresa municipal en La Isla',
    title: 'Cerca de ti, en cada etapa de la vida',
    text: 'Te ayudamos a encontrar casa, a vender la tuya y a cuidar de tus mayores en su hogar. Somos HEMSA, y estamos aquí para las personas de San Fernando.',
  },
  contact: {
    address: 'Avenida San Juan Bosco, 46. 11100 San Fernando (Cádiz)',
    phone: '956 945 000',
    email: 'correo@hemsasanfernando.es',
    schedule: 'Lunes a viernes, de 9:00 a 13:30 h',
  },
};

export const services = [
  {
    id: 'vivienda',
    title: 'Vivienda',
    text: 'Promociones de vivienda protegida, registro de demandantes y actuaciones de rehabilitación.',
    link: '/vivienda',
    icon: 'Building2',
  },
  {
    id: 'ayuda-a-domicilio',
    title: 'Ayuda a domicilio',
    text: 'Gestión del Servicio Municipal de Ayuda a Domicilio, atención e información para la ciudadanía.',
    link: '/ayuda-a-domicilio',
    icon: 'HeartHandshake',
  },
  {
    id: 'garajes',
    title: 'Garajes y trasteros',
    text: 'Información sobre disponibilidad, venta y documentación de garajes y trasteros.',
    link: '/garajes-trasteros',
    icon: 'Warehouse',
  },
  {
    id: 'locales',
    title: 'Parcelas en Fadricas II',
    text: 'Suelo empresarial y parcelas para impulsar la actividad económica del municipio.',
    link: '/servicios#locales',
    icon: 'LandPlot',
  },
];

export const transparencyGroups = [
  {
    title: 'Información institucional y organizativa',
    description: 'Estatutos, estructura y normativa de la empresa municipal.',
    links: [
      { label: 'Información institucional y organizativa', url: '/transparencia#informacion-organizativa' },
      { label: 'Estatutos HEMSA refundidos', url: '/documents/transparencia/estatutos-hemsa.pdf' },
    ],
  },
  {
    title: 'Contratación y convenios',
    description: 'Contratos, contratos menores, convenios y subvenciones.',
    links: [
      { label: 'Contratos', url: '/transparencia#contratos' },
      { label: 'Contratos menores', url: '/transparencia#contratos-menores' },
      { label: 'Convenios y subvenciones', url: '/transparencia#convenios' },
      { label: 'Perfil de contratante', url: 'https://contrataciondelestado.es/wps/portal/!ut/p/b0/DcexDkAwEADQTzqbkBgQC5Gw0HY7WnJxTjUNv8_bHhhQYAQf2jHSJcj_tXXOM8mRexc24vqSGDCiRAczGDBkKw86u_uVllYG7tQ4JXOTsh7eogB_nuUHDNVcvg!!/' },
    ],
  },
  {
    title: 'Información económica',
    description: 'Presupuestos, cuentas anuales, auditorías y gastos de publicidad.',
    links: [
      { label: 'Presupuestos', url: '/transparencia#presupuestos' },
      { label: 'Cuentas anuales', url: '/transparencia#cuentas' },
      { label: 'Control financiero y auditorías', url: '/transparencia#control-financiero-auditorias' },
      { label: 'Gastos públicos en publicidad', url: '/transparencia#gastos-publicidad' },
    ],
  },
];

export const currentJobs = [
  {
    title: 'Auxiliar del Servicio de Ayuda a Domicilio',
    year: 'Convocatoria 2026',
    description: 'Selección de personal laboral indefinido, fijo discontinuo y bolsa eventual.',
    details: '30 puestos indefinidos · 25 fijos discontinuos · bolsa eventual',
    url: '/empleo#bolsa-auxiliar-2026-octubre',
  },
  {
    title: 'Coordinador/a de Ayuda a Domicilio',
    year: 'Convocatoria 2026',
    description: 'Proceso de selección para la coordinación del Servicio Municipal de Ayuda a Domicilio.',
    details: 'Consulta las bases, requisitos, plazos y documentación del proceso.',
    url: '/empleo#bolsa-coordinador-2026-octubre',
  },
];

export const archivedJobs = [
  { title: 'Convocatoria de coordinador/a SAD 2025', url: '/empleo#bolsa-coordinador-2025' },
  { title: 'Convocatoria de auxiliar SAD 2025', url: '/empleo#bolsa-auxiliar-2025' },
  { title: 'Promoción interna de responsable de coordinación', url: '/empleo#promoción-interna-coordinación' },
];
