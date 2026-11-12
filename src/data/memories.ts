export interface Chapter {
  id: string;
  tag: string;
  location: string;
  date: string;
  title: string;
  story: string;
  quote: string;
  imageUrl: string;
  isRemote?: boolean;
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
}

export interface Quote {
  id: string;
  title: string;
  quote: string;
  author: string;
  context: string;
  imageUrl: string;
  category: string;
  isRemote?: boolean;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  category: 'roblox' | 'chats' | 'gaming' | string;
  location: string;
  date: string;
  imageUrl: string;
  caption: string;
  aspect?: 'square' | 'portrait' | 'landscape';
  isRemote?: boolean;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'noches-platicas',
    tag: 'Capítulo 01',
    location: 'Discord // 🇲🇽 México & 🇨🇴 Colombia',
    date: 'Madrugadas Eternas • 2025 - 2026',
    title: 'Noches de Pláticas: Yaei & Diezos.',
    story:
      'Lo que nació como un espacio para hablar después de las partidas se convirtió en nuestro podcast no oficial y en el refugio de cada noche. Micrófonos abiertos, confesiones sinceras, debates sobre el futuro y risas imparables hasta que salía el sol. La distancia entre México y Colombia dejó de existir en el segundo en que nos conectábamos.',
    quote: '«Noches de pláticas con Yaei & Diezos: donde arreglar el mundo era el plan de cada madrugada.»',
    imageUrl: '/images/Banner_Noches_de_Platicas_Yaei_y_Diezos.png',
  },
  {
    id: 'el-grupo-unido',
    tag: 'Capítulo 02',
    location: 'Roblox // Servidor de Siempre',
    date: '31 de Julio, 2025 - 2026',
    title: 'La Pandilla en Roblox: Colombia & México.',
    story:
      'Yaei, Zopas, NightDark, Mich, Gabdiauva, Jhunrow, Rango y Diezos juntos en la misma sala. Posar con los avatares, sacar el palo de selfie virtual y levantar con orgullo las banderas de Colombia y México. No importa qué tan lejos estemos o qué tan difícil haya sido el día, este grupo siempre encuentra el camino para reunirse.',
    quote: '«Dos países, amigos reales y una hermandad que no sabe de fronteras ni de pantallas.»',
    imageUrl: '/images/Roblox_Zopas_May_Diezos_Selfie.png',
  },
  {
    id: 'enigma-jhunrow',
    tag: 'Capítulo 03',
    location: 'Roblox // Servidor de Madrugada',
    date: '28 de Marzo, 2026',
    title: '«Tengo un dedo en la espalda de mi nevera» — El Enigma de Jhunrow.',
    story:
      'De la nada, en medio de la partida más tensa y con risas de fondo en Discord, Jhunrow soltó una de las frases más surrealistas e inolvidables en la historia del grupo. Con su avatar elegante y la corona en alto, coronó una madrugada llena de anécdotas que se quedaron para siempre grabadas en la memoria de la pandilla.',
    quote: '«"Tengo un dedo en la espalda de mi nevera." — Jhunrow»',
    imageUrl: '/images/Roblox_Dialogo_Jhunrow_Dedo_Nevera.png',
  },
  {
    id: 'minecraft-cerezos',
    tag: 'Capítulo 04',
    location: 'Minecraft // Coordenadas: -334, 135, -4047',
    date: '31 de Diciembre, 2025',
    title: 'El Bosque de Cerezos y la Lluvia.',
    story:
      'Fin de año en el servidor. Subir a la montaña, encontrar el bioma rosa de cerezos y construir la cabaña frente al lago. Mientras afuera caía una tormenta implacable y los zombis y arañas se agolpaban en la cerca, nosotros cuidábamos los caballos y comíamos bajo techo, sintiendo que nada malo podía pasar.',
    quote: '«Afuera el mundo se derrumba; adentro de la casa de cerezo, la banda está a salvo.»',
    imageUrl: '/images/Minecraft_Bosque_Cerezos_Lluvia_Coordenadas.png',
  },
];

export const PILLARS: Pillar[] = [
  {
    id: 'complicidad',
    title: 'Noches de Discord',
    description: 'De 10 PM a 5 AM. No importa el tema: desde desahogos serios hasta debates absurdos de juegos.',
    icon: 'Sparkles',
    badge: '01 / Conexión',
  },
  {
    id: 'presencia',
    title: 'Siempre en la Partida',
    description: 'Si falta uno en el squad, la partida se pausa o se espera. El lobby no inicia sin la banda completa.',
    icon: 'PhoneCall',
    badge: '02 / Hermandad',
  },
  {
    id: 'humor',
    title: 'Humor Sin Filtros',
    description: 'Desde las ocurrencias de Jhunrow, Zopas, Mich y Rango hasta la inolvidable confesión de la babosa de Gabdiauva.',
    icon: 'Smile',
    badge: '03 / Auténticos',
  },
  {
    id: 'eterno',
    title: 'Cero Fronteras',
    description: 'Colombia y México en un solo canal de voz. Pueden pasar semanas, pero la vibra se mantiene intacta.',
    icon: 'Infinity',
    badge: '04 / Inquebrantable',
  },
];

export const QUOTES: Quote[] = [
  {
    id: 'darius',
    title: 'La Lección de Darius',
    quote:
      '«Adivina, así funciona la vida, si quieres algo, ganatelo, no te cae del cielo. ¿Crees que solo te dan los trabajos porque eres tú? Nada te cae del cielo, además ¿Qué vas a hacer después de esta partida ? Jugarte otra partida ? Que más da quedarse en esta.»',
    author: 'Darius (2025)',
    context: 'Filosofía pura en medio de una partida competitiva que nadie quería abandonar',
    imageUrl: '/images/Frase_Darius_Ganatelo_2025.png',
    category: 'Filosofía Gamer',
  },
  {
    id: 'zopas-fit',
    title: 'El Outfit Legendario de Zopas',
    quote: '«pls fit check: saco elegante, corbata y boxers de corazones.»',
    author: 'Z0PaS (Roblox Park)',
    context: 'Aparecer en el parque de Roblox con el atuendo más épico y aleatorio de todo el servidor junto a Diezos y Yaei',
    imageUrl: '/images/Roblox_Zopas_Banquillo_Diezos_Yaei.png',
    category: 'Roblox Momentos',
  },
  {
    id: 'mustio',
    title: 'El Destino Elegido',
    quote:
      '«Si pudieras ver el destino de los caminos que no tomaste, tu mente se quebraría. Alégrate por el camino elegido. Al fin y al cabo, te pertenece.»',
    author: 'Mustio (Elden Ring)',
    context: 'La frase que le dio sentido a cada elección y a cada amistad elegida en nuestro viaje',
    imageUrl: '/images/Elden_Ring_Dialogo_Mustio_Destino_Caminos.png',
    category: 'Destino',
  },
  {
    id: 'diezos-ow2',
    title: 'Spawn Camp con D.Va',
    quote: '«[Diezos]: ez ... [Diezos]: sorry»',
    author: 'Diezos (Overwatch 2)',
    context: 'Haciendo spawn camp legendario con D.Va mientras el rival escribe "look at your pfp before you talk"',
    imageUrl: '/images/Overwatch2_Chat_Diezos_EZ_Rendito.png',
    category: 'Overwatch 2',
  },
  {
    id: 'gabdiauva',
    title: 'La Confesión de la Babosa',
    quote: '«Por la noche, me gusta frotar jalea sobre mí mismo y fingir que soy una babosa.»',
    author: 'Gabdiauva',
    context: 'Esperando a 0 jugadores en Roblox con una declaración existencial inolvidable que quedó para la historia',
    imageUrl: '/images/Roblox_Dialogo_Gabdiauva_Jalea_Babosa.png',
    category: 'Roblox Lore',
  },
  {
    id: 'jhunrow',
    title: 'El Misterio de la Nevera',
    quote: '«Tengo un dedo en la espalda de mi nevera.»',
    author: 'Jhunrow (i ♥ my gf)',
    context: 'El misterio culinario más grande y bizarro jamás contado en el chat grupal de Roblox',
    imageUrl: '/images/Roblox_Dialogo_Jhunrow_Dedo_Nevera.png',
    category: 'Roblox Lore',
  },
];

export const GALLERY: GalleryPhoto[] = [
  {
    id: 'yaei-diezos-selfie',
    title: 'Selfie Sin Fronteras: Yaei & Diezos',
    category: 'roblox',
    location: 'Roblox // México & Colombia',
    date: '2026',
    imageUrl: '/images/Roblox_Diezos_Yaei_Selfie_Banderas.png',
    caption: 'Yaei sacando el palo de selfie y Diezos posando juntos bajo las banderas de México y Colombia.',
    aspect: 'landscape',
  },
  {
    id: 'ow2-dva-stats',
    title: 'Récord con D.Va: 81 Eliminaciones',
    category: 'gaming',
    location: 'Overwatch 2 // Historial de D.Va',
    date: '2026',
    imageUrl: '/images/Overwatch2_Estadisticas_DVa.png',
    caption: 'Una hora imparable jugando con D.Va: 81 eliminaciones, 20 asistencias y mejor racha de 8 en 10 partidas.',
    aspect: 'landscape',
  },
  {
    id: 'mogged-duel',
    title: 'Duelo de Outfits: Diezos vs Yaei',
    category: 'roblox',
    location: 'Roblox Fashion Battle',
    date: '2025',
    imageUrl: '/images/Roblox_Duelo_Outfits_Mogged_Diezos_vs_Yaei.png',
    caption: 'MOGGED! Diezos llevándose la victoria con 7.5 sobre 7.3 (+15 ELO) en la pasarela.',
    aspect: 'landscape',
  },
  {
    id: 'omori-basil',
    title: 'Doble Basil de Omori (Conny & Diezos)',
    category: 'roblox',
    location: 'Mundo Omori Roblox',
    date: '2025',
    imageUrl: '/images/Roblox_Omori_Basil_Conny_y_Diezos.png',
    caption: 'Conny_que y DIEZOS123 sincronizados con la flor en la cabeza y el chaleco verde.',
    aspect: 'square',
  },
  {
    id: 'conny-meme',
    title: 'Conny en su Momento más Inolvidable',
    category: 'chats',
    location: 'Roblox Chat',
    date: '2025',
    imageUrl: '/images/Roblox_Omori_Basil_Conny_Meme_Chat.png',
    caption: 'Conny_que diciendo "yo quiero pitó uwu" en medio de la sesión.',
    aspect: 'portrait',
  },
  {
    id: 'bonice-zack',
    title: 'El BonIce de FTNx & Zack',
    category: 'roblox',
    location: 'Roblox Hub',
    date: '14 de Noviembre, 2025',
    imageUrl: '/images/Roblox_Avatar_BonIce_y_Zack.png',
    caption: 'FTNx con camiseta de BonIce, sombrero vueltiao y silla de ruedas junto a Diezos y Zack.',
    aspect: 'square',
  },
  {
    id: 'zopas-banquillo',
    title: 'Zopas, Diezos y Yaei en el Parque',
    category: 'roblox',
    location: 'Parque Nocturno de Roblox',
    date: '2026',
    imageUrl: '/images/Roblox_Zopas_Banquillo_Diezos_Yaei.png',
    caption: 'Z0PaS con su icónico traje rojo y boxers de corazones sentado bajo el árbol con Diezos y Yaei.',
    aspect: 'landscape',
  },
  {
    id: 'banana-show',
    title: 'El Concurso de la Banana: NightDark vs Yaei',
    category: 'roblox',
    location: 'Roblox Show TV // SWTV',
    date: '2026',
    imageUrl: '/images/Roblox_NightDark_Yaei_Banana_Show.png',
    caption: 'NightDark (0 puntos) y Yaei (20 puntos) en el concurso de preguntas presentado por una banana gigante.',
    aspect: 'landscape',
  },
  {
    id: 'ezequiel-carteles',
    title: '«Ezequiel mi casita / Ezequiel mi varon»',
    category: 'roblox',
    location: 'Cancha de Roblox',
    date: '2026',
    imageUrl: '/images/Roblox_Ezequiel_Casita_Carteles.png',
    caption: 'Yaei y Diezos posando frente a la portería con los carteles gigantes de Ezequiel.',
    aspect: 'landscape',
  },
  {
    id: 'cabana-chocolate',
    title: 'Cabaña Cálida y Chocolate Caliente',
    category: 'roblox',
    location: 'Refugio Invernal',
    date: '2026',
    imageUrl: '/images/Roblox_Cabana_Chocolate_Caliente.png',
    caption: 'Conny_que y DIEZOS123 compartiendo una taza de chocolate caliente junto a la chimenea.',
    aspect: 'landscape',
  },
  {
    id: 'zopas-may-selfie',
    title: 'Selfie Grupal: Zopas, May y Diezos',
    category: 'roblox',
    location: 'Roblox Hub Banderas',
    date: '2026',
    imageUrl: '/images/Roblox_Zopas_May_Diezos_Selfie.png',
    caption: 'Z0PaS, May y Diezos sacando la cámara con las banderas de México y Colombia al fondo.',
    aspect: 'landscape',
  },
  {
    id: 'atardecer-arbol',
    title: 'Atardecer bajo el Árbol: NightDark, Diezos y Yaei',
    category: 'roblox',
    location: 'Terraza al Atardecer',
    date: '2026',
    imageUrl: '/images/Roblox_NightDark_Diezos_Yaei_Atardecer.png',
    caption: 'NightDark con sus alas negras, Diezos y Yaei sentados en la banca disfrutando del atardecer.',
    aspect: 'landscape',
  },
  {
    id: 'backrooms',
    title: 'El Terror en los Backrooms',
    category: 'roblox',
    location: 'Nivel 0 // Pasillo Oscuro',
    date: '22 de Julio, 2026',
    imageUrl: '/images/Roblox_Backrooms_Pasillo_Oscuro_Figura.png',
    caption: 'Aquella expedición a oscuras en Roblox donde una sombra al final del pasillo nos hizo gritar a todos.',
    aspect: 'landscape',
  },
  {
    id: 'platino-lol',
    title: 'Ascenso a Platino IV: Liah #Zoe',
    category: 'gaming',
    location: 'League of Legends Solo/Dúo',
    date: '29 de Diciembre, 2025',
    imageUrl: '/images/LoL_Ascenso_Platino_IV_Liah_Zoe.png',
    caption: 'Celebrando el ascenso con Zoe tras incontables partidas de esfuerzo y risas en dúo.',
    aspect: 'landscape',
  },
  {
    id: 'ow2-love',
    title: 'Elogios en Overwatch 2: "D.Va I love you"',
    category: 'gaming',
    location: 'Overwatch 2 Partida Competitiva',
    date: '13 de Febrero, 2026',
    imageUrl: '/images/Overwatch2_Chat_Elogios_DVa_I_Love_You.png',
    caption: 'Cuando el equipo reconoce a la mejor D.Va de la sala: ¡Recomendación recibida!',
    aspect: 'landscape',
  },
];
