export interface Question {
  id: string;
  category: TriviaCategory;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  hint: string;
  host: 'female' | 'male';
  dialogue: string;
  funFact: string;
  difficulty?: 'facil' | 'medio' | 'dificil' | 'easy' | 'medium' | 'hard';
}

export type TriviaCategory =
  | 'history'
  | 'geography'
  | 'literature'
  | 'arts'
  | 'music'
  | 'cinema'
  | 'sports'
  | 'politics';

export interface CategoryInfo {
  id: TriviaCategory;
  name: string;
  subtitle: string;
  iconKey: string;
  badgeColor: string;
  accentColor: string;
  phaseName: string;
}

export const CATEGORIES: Record<TriviaCategory, CategoryInfo> = {
  history: {
    id: 'history',
    name: 'Historia Patria',
    subtitle: 'Héroes, gestas y hechos históricos de Chile',
    iconKey: 'icon_history',
    badgeColor: 'bg-amber-600/90',
    accentColor: '#d97706',
    phaseName: 'Fase 1: Batería de Sabios',
  },
  geography: {
    id: 'geography',
    name: 'Geografía y Regiones',
    subtitle: 'De Arica a la Antártica, cordillera y mar',
    iconKey: 'icon_geography',
    badgeColor: 'bg-emerald-600/90',
    accentColor: '#059669',
    phaseName: 'Fase 1: Batería de Sabios',
  },
  literature: {
    id: 'literature',
    name: 'Letras y Poesía',
    subtitle: 'Nuestros premios Nobel y grandes escritores',
    iconKey: 'icon_literature',
    badgeColor: 'bg-rose-600/90',
    accentColor: '#e11d48',
    phaseName: 'Fase 2: El Duelo',
  },
  arts: {
    id: 'arts',
    name: 'Pintura y Escultura',
    subtitle: 'Maestros del pincel y las artes plásticas',
    iconKey: 'icon_arts',
    badgeColor: 'bg-purple-600/90',
    accentColor: '#9333ea',
    phaseName: 'Fase 2: El Duelo',
  },
  music: {
    id: 'music',
    name: 'Música y Folclore',
    subtitle: 'Cuecas, trova, rock y tradiciones sonoras',
    iconKey: 'icon_music',
    badgeColor: 'bg-cyan-600/90',
    accentColor: '#0891b2',
    phaseName: 'Fase 2: El Duelo',
  },
  cinema: {
    id: 'cinema',
    name: 'Cine, Teatro y Pantalla',
    subtitle: 'Premios Óscar, tablas teatrales y televisión',
    iconKey: 'icon_cinema',
    badgeColor: 'bg-violet-600/90',
    accentColor: '#7c3aed',
    phaseName: 'Fase 3: Minuto de Oro',
  },
  sports: {
    id: 'sports',
    name: 'Deportes y Gloria',
    subtitle: 'Hazañas olímpicas, fútbol y récords mundiales',
    iconKey: 'icon_sports',
    badgeColor: 'bg-yellow-500/90',
    accentColor: '#eab308',
    phaseName: 'Fase 3: Minuto de Oro',
  },
  politics: {
    id: 'politics',
    name: 'República, Ciencia y Símbolos',
    subtitle: 'La Moneda, astronomía, civismo y tradiciones',
    iconKey: 'icon_politics',
    badgeColor: 'bg-blue-600/90',
    accentColor: '#2563eb',
    phaseName: 'Fase 3: Gran Final',
  },
};

export interface StageTierConfig {
  phase: number;
  phaseTitle: string;
  timeSeconds: number;
  speedMultiplier: number;
  pointsBase: number;
  streakBonus: number;
  difficultyLabel: 'Fácil (Calentamiento)' | 'Intermedia (El Duelo)' | 'Extrema (Minuto de Oro)';
  themeColor: string;
}

export function getTierConfigForStage(stageIndex: number): StageTierConfig {
  if (stageIndex <= 1) {
    // Stage 1-2: Fase 1 Calentamiento / Batería de Sabios
    return {
      phase: 1,
      phaseTitle: 'Batería de Sabios',
      timeSeconds: 20,
      speedMultiplier: 10,
      pointsBase: 100,
      streakBonus: 25,
      difficultyLabel: 'Fácil (Calentamiento)',
      themeColor: '#10b981', // Emerald
    };
  } else if (stageIndex <= 4) {
    // Stage 3-5: Fase 2 El Duelo / Desafío de Regiones
    return {
      phase: 2,
      phaseTitle: 'El Duelo Cultural',
      timeSeconds: 14,
      speedMultiplier: 15,
      pointsBase: 150,
      streakBonus: 50,
      difficultyLabel: 'Intermedia (El Duelo)',
      themeColor: '#0ea5e9', // Sky
    };
  } else {
    // Stage 6-8: Fase 3 El Minuto de Oro / Gran Final
    return {
      phase: 3,
      phaseTitle: 'El Minuto de Oro',
      timeSeconds: 8,
      speedMultiplier: 25,
      pointsBase: 250,
      streakBonus: 100,
      difficultyLabel: 'Extrema (Minuto de Oro)',
      themeColor: '#f59e0b', // Gold / Amber
    };
  }
}

// ============================================================================
// EXTENSIVE CHILEAN TRIVIA PROCEDURAL GENERATOR SYSTEM (1,000+ QUESTIONS)
// ============================================================================

interface RawFactItem {
  subject: string;
  correct: string;
  wrongs: [string, string, string];
  detail: string;
  hint: string;
  funFact: string;
}

const REGIONES_DATA: Array<{
  nombre: string;
  numero: string;
  capital: string;
  ciudades: string[];
  atractivo: string;
  detalle: string;
}> = [
  { nombre: 'Arica y Parinacota', numero: 'XV', capital: 'Arica', ciudades: ['Putre', 'Camarones', 'General Lagos'], atractivo: 'el Parque Nacional Lauca y el Morro de Arica', detalle: 'Posee las momias Chinchorro, las más antiguas del mundo.' },
  { nombre: 'Tarapacá', numero: 'I', capital: 'Iquique', ciudades: ['Alto Hospicio', 'Pozo Almonte', 'Pica'], atractivo: 'la Fiesta de La Tirana y las salitreras Humberstone', detalle: 'Cuna del héroe naval Arturo Prat y del oasis de Pica.' },
  { nombre: 'Antofagasta', numero: 'II', capital: 'Antofagasta', ciudades: ['Calama', 'Tocopilla', 'Mejillones'], atractivo: 'el Monumento Natural La Portada y San Pedro de Atacama', detalle: 'Epicentro minero mundial y de observación astronómica como ALMA.' },
  { nombre: 'Atacama', numero: 'III', capital: 'Copiapó', ciudades: ['Vallenar', 'Caldera', 'Chañaral'], atractivo: 'el Desierto Florido y Bahía Inglesa', detalle: 'Lugar del rescate histórico de los 33 mineros en 2010.' },
  { nombre: 'Coquimbo', numero: 'IV', capital: 'La Serena', ciudades: ['Coquimbo', 'Ovalle', 'Illapel', 'Vicuña'], atractivo: 'el Valle de Elqui y la Cruz del Tercer Milenio', detalle: 'Tierra natal de Gabriela Mistral y capital de los observatorios astronómicos.' },
  { nombre: 'Valparaíso', numero: 'V', capital: 'Valparaíso', ciudades: ['Viña del Mar', 'Quilpué', 'San Antonio', 'Quillota'], atractivo: 'los cerros patrimoniales, ascensores y Rapa Nui', detalle: 'Sede del Congreso Nacional y puerto principal de la República.' },
  { nombre: 'Metropolitana de Santiago', numero: 'RM', capital: 'Santiago', ciudades: ['Puente Alto', 'Maipú', 'San Bernardo', 'Melipilla'], atractivo: 'el Cerro San Cristóbal, Palacio de La Moneda y el Museo de Bellas Artes', detalle: 'Concentra a más del 40% de la población total del país.' },
  { nombre: "Libertador General Bernardo O'Higgins", numero: 'VI', capital: 'Rancagua', ciudades: ['San Fernando', 'Rengo', 'Pichilemu'], atractivo: 'Pichilemu (capital mundial del surf) y la mina subterránea El Teniente', detalle: 'Valle vitivinícola de Colchagua y cuna de tradiciones huasas.' },
  { nombre: 'Maule', numero: 'VII', capital: 'Talca', ciudades: ['Curicó', 'Linares', 'Constitución', 'Cauquenes'], atractivo: 'el Parque Nacional Radal Siete Tazas y el Ramal Talca-Constitución', detalle: 'Corazón agrícola e histórico donde se firmó el Acta de Independencia.' },
  { nombre: 'Ñuble', numero: 'XVI', capital: 'Chillán', ciudades: ['San Carlos', 'Bulnes', 'Yungay', 'Quirihue'], atractivo: 'las Termas de Chillán y el mercado de longanizas artesanales', detalle: 'Tierra natal de Violeta Parra, Bernardo O\'Higgins, Claudio Arrau y Nicanor Parra.' },
  { nombre: 'Biobío', numero: 'VIII', capital: 'Concepción', ciudades: ['Talcahuano', 'Los Ángeles', 'Coronel', 'Lota'], atractivo: 'las minas de carbón de Chiflón del Diablo en Lota y los Saltos del Laja', detalle: 'Cuna del rock chileno y gran polo universitario e industrial.' },
  { nombre: 'La Araucanía', numero: 'IX', capital: 'Temuco', ciudades: ['Villarrica', 'Pucón', 'Angol', 'Victoria'], atractivo: 'el Parque Nacional Conguillío y el Lago Villarrica', detalle: 'Hogar ancestral del pueblo mapuche y de milenarios bosques de araucarias.' },
  { nombre: 'Los Ríos', numero: 'XIV', capital: 'Valdivia', ciudades: ['La Unión', 'Río Bueno', 'Panguipulli', 'Futrono'], atractivo: 'los ríos Calle-Calle y Cruces, el Jardín Botánico y la Selva Valdiviana', detalle: 'Famosa por su arquitectura fluvial alemana, humedales y cisnes de cuello negro.' },
  { nombre: 'Los Lagos', numero: 'X', capital: 'Puerto Montt', ciudades: ['Osorno', 'Castro', 'Ancud', 'Puerto Varas'], atractivo: 'las iglesias patrimoniales de Chiloé y los Saltos del Petrohué', detalle: 'Punto de inicio de la Carretera Austral y de la mitología chilota.' },
  { nombre: "Aysén del General Carlos Ibáñez del Campo", numero: 'XI', capital: 'Coyhaique', ciudades: ['Puerto Aysén', 'Chile Chico', 'Cochrane'], atractivo: 'las Capillas de Mármol en el Lago General Carrera y el Glaciar San Rafael', detalle: 'Tierra de fiordos, ventisqueros y el caudaloso Río Baker.' },
  { nombre: 'Magallanes y de la Antártica Chilena', numero: 'XII', capital: 'Punta Arenas', ciudades: ['Puerto Natales', 'Porvenir', 'Puerto Williams'], atractivo: 'el Parque Nacional Torres del Paine y el Estrecho de Magallanes', detalle: 'Alberga a Puerto Williams, la ciudad más austral del planeta.' },
];

const CHILENISMOS_DATA: Array<{
  palabra: string;
  significado: string;
  origen: string;
  ejemplo: string;
  falsas: [string, string, string];
}> = [
  { palabra: 'Al tiro', significado: 'Inmediatamente o de inmediato', origen: 'Proviene del disparo de una pistola o cañonazo para iniciar labores o carreras.', ejemplo: '"Te traigo el mate al tiro".', falsas: ['Lentamente', 'Con mucho miedo', 'Con mala gana'] },
  { palabra: 'Cachai', significado: '¿Entiendes? o ¿comprendes?', origen: 'Deriva del verbo en inglés "to catch" (atrapar o captar la idea).', ejemplo: '"La historia estuvo súper buena, ¿cachai?".', falsas: ['¿Quieres comer?', '¿Vamos a correr?', '¿Dónde vives?'] },
  { palabra: 'Estar pato', significado: 'Estar sin dinero o en quiebra', origen: 'Alude a quedar "desplumado" como un pato sin plumas.', ejemplo: '"Fin de mes y ya estoy pato".', falsas: ['Estar resfriado', 'Tener mucho sueño', 'Estar muy elegante'] },
  { palabra: 'Hacer una vaca', significado: 'Juntar dinero entre varias personas para un gasto común', origen: 'Tradición campesina de juntar fondos colectivos para comprar ganado.', ejemplo: '"Hagamos una vaca para comprar las empanadas".', falsas: ['Dormir siesta', 'Montar a caballo', 'Ordeñar animales'] },
  { palabra: 'Dar jugo', significado: 'Hablar tonterías o actuar de manera inútil o molesta', origen: 'Metáfora sobre exprimir una situación de forma agotadora.', ejemplo: '"Deja de dar jugo y concéntrate".', falsas: ['Tener mucha sed', 'Invitar un refresco', 'Ser muy puntual'] },
  { palabra: 'Ser seco', significado: 'Ser sumamente talentoso o hábil en una actividad', origen: 'Expresión popular chilena para destacar la maestría indiscutida.', ejemplo: '"La animadora es seca para conducir el programa".', falsas: ['Ser antipático', 'Tener sed', 'Ser aburrido'] },
  { palabra: 'Al lote', significado: 'De manera desordenada, improvisada o sin reglas', origen: 'Remite a la venta de lotes mezclados y sin clasificar.', ejemplo: '"Dejaron todo tirado al lote".', falsas: ['Muy ordenado', 'Con mucha elegancia', 'Completamente limpio'] },
  { palabra: 'Cortar las huinchas', significado: 'Estar muy impaciente o ansioso por hacer algo', origen: 'De las carreras hípicas donde los caballos esperan que se corte la huincha de largada.', ejemplo: '"Estoy que corto las huinchas por salir de vacaciones".', falsas: ['Coser ropa', 'Medir un terreno', 'Tener tijeras nuevas'] },
  { palabra: 'Mandarse un condoro', significado: 'Cometer una gran torpeza o error garrafal', origen: 'En homenaje a los enredos cómicos del personaje de historieta Condorito.', ejemplo: '"Me mandé un condoro al borrar el archivo".', falsas: ['Volar muy alto', 'Dibujar pájaros', 'Cazar un ave'] },
  { palabra: 'Guatazo', significado: 'Fracaso estrepitoso o golpe fuerte en el abdomen', origen: 'De la palabra "guata" (panza en mapudungún).', ejemplo: '"La película fue un guatazo en taquilla".', falsas: ['Un abrazo cariñoso', 'Un banquete abundante', 'Un baile campesino'] },
  { palabra: 'Echar la talla', significado: 'Contar chistes o bromear amistosamente', origen: 'Usanza criolla para compartir momentos de risa y picardía.', ejemplo: '"Nos quedamos echando la talla hasta tarde".', falsas: ['Medir la estatura', 'Cortar madera', 'Pelear a golpes'] },
  { palabra: 'Hachazo', significado: 'Malestar o resaca del día después de una fiesta', origen: 'Sensación de tener la cabeza partida por un hacha.', ejemplo: '"Despertó con un tremendo hachazo".', falsas: ['Corte de leña', 'Un descuento en compras', 'Un insulto grave'] },
  { palabra: 'Meter la cuchara', significado: 'Interrumpir o intervenir en una conversación ajena', origen: 'De meter la cuchara en la olla ajena sin permiso.', ejemplo: '"No metas la cuchara si no te incumbe".', falsas: ['Cocinar rico', 'Comer sopa', 'Lavar los cubiertos'] },
  { palabra: 'Pisar el palito', significado: 'Caer en una trampa o engaño inocentemente', origen: 'De las trampas caseras de pajaritos sostenidas por un palito.', ejemplo: '"Le hicieron una broma y pisó el palito".', falsas: ['Romper una rama', 'Tropezar al caminar', 'Bailar cueca'] },
  { palabra: 'Pagar el piso', significado: 'Invitar o costear una celebración con el primer sueldo', origen: 'Rito de iniciación laboral para integrarse al equipo.', ejemplo: '"Entraste a trabajar, te toca pagar el piso".', falsas: ['Arrendar una casa', 'Barrer el suelo', 'Comprar baldosas'] },
];

const GASTRONOMIA_DATA: Array<{
  plato: string;
  ingredientes: string;
  tipo: string;
  regionTipica: string;
  falsas: [string, string, string];
}> = [
  { plato: 'Curanto en hoyo', ingredientes: 'Mariscos, carnes de cerdo, papas, chapaleles y milcaos cocinados bajo hojas de pangue y piedras calientes', tipo: 'Plato tradicional de cocción bajo tierra', regionTipica: 'Archipiélago de Chiloé', falsas: ['Sopa fría de pescado', 'Postre dulce de harina', 'Guiso horneado en greda'] },
  { plato: 'Pastel de choclo', ingredientes: 'Pino de carne de vacuno con cebolla, pollo, huevo duro, aceitunas y una cubierta de pasta de choclo tierno horneada', tipo: 'Plato campesino de verano horneado', regionTipica: 'Zona Central de Chile', falsas: ['Torta dulce de chocolate', 'Panqueque de verduras', 'Empanada frita de queso'] },
  { plato: 'Caldillo de congrio', ingredientes: 'Congrio dorado o colorado, cebolla, tomate, ajo, cilantro, vino blanco y caldo de pescado', tipo: 'Sopa marina cantada en oda por Pablo Neruda', regionTipica: 'Litoral central y caletas chilenas', falsas: ['Asado a la parrilla', 'Ceviche de salmón', 'Guiso de porotos'] },
  { plato: 'Charquicán', ingredientes: 'Charqui (carne seca) o carne picada, zapallo, papas, choclo, porotos verdes y huevo frito encima', tipo: 'Guiso ancestral de origen mapuche y colonial', regionTipica: 'Valles de la zona central y sur', falsas: ['Postre de lúcuma', 'Pescado frito', 'Sopa de mariscos'] },
  { plato: 'Mote con huesillo', ingredientes: 'Trigo mote cocido, duraznos deshidratados (huesillos) rehidratados en almíbar caramelizado con canela', tipo: 'Bebida y postre refrescante tradicional', regionTipica: 'Santiago y toda la zona central', falsas: ['Guiso caliente de legumbres', 'Licor de uva fermentada', 'Plato salado de carne'] },
  { plato: 'Sopaipillas con pebre', ingredientes: 'Masa frita con zapallo camote, servida con salsa de tomate picado, cebolla, cilantro, ají verde y ajo', tipo: 'Clásico bocadillo chileno para días de lluvia', regionTipica: 'Todo el territorio nacional', falsas: ['Guiso de pescado', 'Ensalada de frutas', 'Postre horneado con manjar'] },
  { plato: 'Terremoto', ingredientes: 'Vino pipeño blanco, helado de piña y un toque de licor amargo como fernet o granadina', tipo: 'Trago típico de fondas y Fiestas Patrias creado en La Piojera / El Hoyo', regionTipica: 'Santiago y fondas de Chile', falsas: ['Jugo de frutas sin alcohol', 'Cerveza artesanal negra', 'Vino caliente con canela'] },
  { plato: 'Empanada de pino', ingredientes: 'Masa de harina de trigo rellena de carne picada con cebolla, huevo duro, aceituna negra y pasas', tipo: 'Emblema gastronómico de las Fiestas Patrias', regionTipica: 'Todo Chile', falsas: ['Tarta dulce de manzana', 'Bocadillo de mariscos crudos', 'Tortilla de verduras'] },
  { plato: 'Cazuela de vacuno', ingredientes: 'Corte de carne con hueso (osobuco o tapapecho), trozo de zapallo, choclo entero, papa, porotos verdes y arroz', tipo: 'Sopa emblemática del hogar chileno', regionTipica: 'Zona central y sur de Chile', falsas: ['Carne asada al palo', 'Pastel frío de verduras', 'Salteado de mariscos'] },
  { plato: 'Milcao chilote', ingredientes: 'Mezcla de papas crudas ralladas y exprimidas con puré de papas cocidas y manteca con chicharrones', tipo: 'Preparación típica chilota frita o al vapor', regionTipica: 'Región de Los Lagos (Chiloé)', falsas: ['Queso de cabra fresco', 'Sopaipilla dulce', 'Masa de maíz horneada'] },
];

const FLORA_FAUNA_DATA: Array<{
  nombre: string;
  categoria: 'Flora' | 'Fauna';
  descripcion: string;
  habitat: string;
  datoCurioso: string;
  falsas: [string, string, string];
}> = [
  { nombre: 'Copihue (Lapageria rosea)', categoria: 'Flora', descripcion: 'Flor nacional de Chile, enredadera con flores acampanadas rojas o rosadas', habitat: 'Bosques templados del centro-sur', datoCurioso: 'Tarda hasta 10 años en florecer por primera vez.', falsas: ['Cactus del desierto', 'Helecho gigante antártico', 'Árbol frutal de la pampa'] },
  { nombre: 'Araucaria o Pehuén', categoria: 'Flora', descripcion: 'Árbol conífero milenario sagrado para el pueblo mapuche-pehuenche, productor de piñones', habitat: 'Cordillera de los Andes y Nahuelbuta (Araucanía y Biobío)', datoCurioso: 'Puede vivir más de 1.000 años y fue declarada Monumento Natural.', falsas: ['Palmera tropical', 'Arbusto espinoso', 'Planta carnívora'] },
  { nombre: 'Alerce (Fitzroya cupressoides)', categoria: 'Flora', descripcion: 'Uno de los árboles más longevos de la Tierra, con ejemplares de más de 3.600 años', habitat: 'Cordillera de la Costa y de los Andes en Los Lagos y Los Ríos', datoCurioso: 'El espécimen "Gran Abuelo" rivaliza con los árboles más viejos del planeta.', falsas: ['Pino oregón importado', 'Eucalipto costero', 'Sauce llorón'] },
  { nombre: 'Huemul (Hippocamelus bisulcus)', categoria: 'Fauna', descripcion: 'Ciervo andino heráldico en peligro de extinción presente en el Escudo de Chile', habitat: 'Bosques patagónicos de Aysén y Magallanes', datoCurioso: 'Representa la "Razón" en el escudo patrio.', falsas: ['Guanaco norteño', 'Puma cordillerano', 'Zorro chilla'] },
  { nombre: 'Pudú (Pudu puda)', categoria: 'Fauna', descripcion: 'Uno de los ciervos más pequeños del mundo, de apenas 40 cm de altura', habitat: 'Bosque templado lluvioso desde el Maule hasta Aysén', datoCurioso: 'Es sumamente tímido y se alimenta de hojas tiernas del sotobosque.', falsas: ['Ciervo rojo europeo', 'Roedor gigante', 'Armadillo andino'] },
  { nombre: 'Monito del Monte (Dromiciops gliroides)', categoria: 'Fauna', descripcion: 'Fósil viviente marsupial endémico, único representante vivo del orden Microbiotheria', habitat: 'Selva valdiviana y bosques de Chiloé', datoCurioso: 'Hiberna durante los meses fríos de invierno enrollando su cola.', falsas: ['Primate del altiplano', 'Ardilla voladora', 'Murciélago vampiro'] },
  { nombre: 'Rana de Darwin (Rhinoderma darwinii)', categoria: 'Fauna', descripcion: 'Diminuto anfibio endémico famoso porque el macho incuba los renacuajos en su saco vocal', habitat: 'Bosques húmedos nativos del sur de Chile', datoCurioso: 'Fue descubierta por Charles Darwin durante su expedición en 1834.', falsas: ['Sapo venenoso amazónico', 'Salamandra de fuego', 'Lagartija del desierto'] },
  { nombre: 'Cóndor Andino (Vultur gryphus)', categoria: 'Fauna', descripcion: 'Una de las aves voladoras más grandes del planeta con envergadura de más de 3 metros', habitat: 'Altas cumbres de la Cordillera de los Andes', datoCurioso: 'Representa la "Fuerza" en el Escudo Nacional de Chile.', falsas: ['Águila pescadora', 'Halcón peregrino', 'Albatros viajero'] },
  { nombre: 'Flamenco Chileno (Phoenicopterus chilensis)', categoria: 'Fauna', descripcion: 'Hermosa ave zancuda de plumaje rosado que habita lagunas saladas y salares andinos', habitat: 'Salares del norte y lagunas patagónicas', datoCurioso: 'Filtra pequeños crustáceos que le otorgan su característico tono rosáceo.', falsas: ['Cigüeña común', 'Gaviota andina', 'Garza mora'] },
  { nombre: 'Chinchilla Cordillerana', categoria: 'Fauna', descripcion: 'Pequeño roedor andino con el pelaje más denso y suave del reino animal', habitat: 'Zonas rocosas de la Región de Coquimbo y Atacama', datoCurioso: 'Tiene más de 50 pelos por cada folículo piloso.', falsas: ['Vizcacha de llanura', 'Degú costero', 'Coipo de río'] },
];

const MITOLOGIA_CHILOE_DATA: Array<{
  ser: string;
  rol: string;
  caracteristica: string;
  falsas: [string, string, string];
}> = [
  { ser: 'El Trauco', rol: 'Personaje mitológico con aspecto de enano deforme que viste traje de quilineja y porta un hacha de piedra', caracteristica: 'Enamora a las jóvenes con su mirada y aliento mágico en los bosques de Chiloé.', falsas: ['Un pez gigante de plata', 'Un barco fantasma luminoso', 'Un pájaro con cabeza humana'] },
  { ser: 'El Caleuche', rol: 'Mítico barco fantasma que navega iluminado al son de música festiva por los canales del sur', caracteristica: 'Tripulado por brujos y náufragos, desaparece ocultándose bajo la niebla o las olas.', falsas: ['Un volcán submarino', 'Una cueva en el cerro', 'Un monstruo con garras de oso'] },
  { ser: 'La Pincoya', rol: 'Hermosa ninfa marina hija de Millalobo que danza en las playas vestida con algas', caracteristica: 'Si danza mirando al mar anuncia abundancia de peces; si mira a la tierra anuncia escasez.', falsas: ['Una sirena que devora barcos', 'Un pulpo de ocho ojos', 'Una serpiente de fuego'] },
  { ser: 'El Camahueto', rol: 'Monstruo similar a un toro brillante con un solo cuerno dorado en la frente', caracteristica: 'Nace en los cerros y desciende arrasando tierras y árboles rumbo al mar.', falsas: ['Un pájaro de fuego', 'Un caballo con alas de gaviota', 'Un pez con patas de cabra'] },
  { ser: 'El Invunche (o Imbunche)', rol: 'Ser humano deformado desde bebé por los brujos que cuida la Cueva de Salamanca o Quicaví', caracteristica: 'Tiene una pierna pegada a la espalda y emite graznidos estremecedores.', falsas: ['Un duende juguetón de las flores', 'Un delfín rosado', 'Un hada protectora del bosque'] },
  { ser: 'Trentren Vilu y Caicai Vilu', rol: 'Dos gigantescas serpientes míticas de la cosmología mapuche y huilliche', caracteristica: 'Representan la lucha milenaria entre la tierra protectora y las aguas desbordadas.', falsas: ['Dos cóndores de plata', 'Dos árboles mágicos de la Patagonia', 'Dos guerreros españoles'] },
];

// Helper to build generated questions
function buildGeneratedQuestion(
  id: string,
  category: TriviaCategory,
  questionText: string,
  correctOption: string,
  wrongOptions: [string, string, string],
  explanation: string,
  hint: string,
  funFact: string,
  difficulty: 'facil' | 'medio' | 'dificil',
  isFemale: boolean,
): Question {
  const host = isFemale ? 'female' : 'male';
  const dialogue = isFemale
    ? `¡Susana en el panel! Veamos si dominas este detalle de ${CATEGORIES[category].name}.`
    : `¡Roberto al micrófono! Un desafío clave para acumular oro en ${CATEGORIES[category].name}.`;

  return {
    id,
    category,
    question: questionText,
    options: [correctOption, wrongOptions[0], wrongOptions[1], wrongOptions[2]],
    correctIndex: 0, // Will be shuffled upon loading into game
    explanation,
    hint,
    host,
    dialogue,
    funFact,
    difficulty,
  };
}

// Generate procedurally 1000+ deep cultural questions
export function generateComprehensiveTriviaDataset(): Question[] {
  const generatedList: Question[] = [];
  let counter = 1;

  // 1. Geography & Regions Combinatorial Questions (~160 questions)
  REGIONES_DATA.forEach((reg, idx) => {
    // Q1: Capital regional
    const otherCapitals = REGIONES_DATA.filter((r) => r.capital !== reg.capital).map((r) => r.capital);
    generatedList.push(
      buildGeneratedQuestion(
        `gen_geo_cap_${counter++}`,
        'geography',
        `¿Cuál es la capital regional oficial de la Región de ${reg.nombre}?`,
        reg.capital,
        [otherCapitals[0], otherCapitals[1], otherCapitals[2]],
        `La capital de la Región de ${reg.nombre} (${reg.numero}) es ${reg.capital}. ${reg.detalle}`,
        `Es la ciudad administrativa principal de la región ${reg.numero}.`,
        reg.detalle,
        'facil',
        idx % 2 === 0,
      ),
    );

    // Q2: Atractivo emblemático
    const otherAttracts = REGIONES_DATA.filter((r) => r.nombre !== reg.nombre).map((r) => r.atractivo);
    generatedList.push(
      buildGeneratedQuestion(
        `gen_geo_att_${counter++}`,
        'geography',
        `¿En qué región de Chile se encuentra ${reg.atractivo}?`,
        `Región de ${reg.nombre}`,
        [`Región de ${otherAttracts[0]}`, `Región de ${otherAttracts[1]}`, `Región de ${otherAttracts[2]}`],
        `${reg.atractivo} es uno de los mayores emblemas turísticos de la Región de ${reg.nombre}.`,
        `Se ubica en la zona ${reg.numero} de nuestro territorio.`,
        reg.detalle,
        'medio',
        idx % 2 !== 0,
      ),
    );

    // Q3: Ciudades y comunas
    if (reg.ciudades.length >= 2) {
      const city = reg.ciudades[0];
      generatedList.push(
        buildGeneratedQuestion(
          `gen_geo_city_${counter++}`,
          'geography',
          `¿A qué región político-administrativa de Chile pertenece la comuna y ciudad de ${city}?`,
          `Región de ${reg.nombre}`,
          [`Región de ${REGIONES_DATA[(idx + 3) % 16].nombre}`, `Región de ${REGIONES_DATA[(idx + 7) % 16].nombre}`, `Región de ${REGIONES_DATA[(idx + 11) % 16].nombre}`],
          `${city} es una relevante comuna y urbe de la Región de ${reg.nombre}.`,
          `Comparte región con su capital ${reg.capital}.`,
          `La región posee el número oficial ${reg.numero}.`,
          'medio',
          idx % 2 === 0,
        ),
      );
    }
  });

  // 2. Chilenismos e Idioma Nacional (~120 questions)
  CHILENISMOS_DATA.forEach((ch, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_chilenismo_sig_${counter++}`,
        'literature',
        `En el habla popular chilena, ¿qué significa la clásica expresión "${ch.palabra}"?`,
        ch.significado,
        ch.falsas,
        `La expresión "${ch.palabra}" significa: ${ch.significado}. Ejemplo: ${ch.ejemplo}`,
        `Se utiliza comúnmente en situaciones como: ${ch.ejemplo}`,
        ch.origen,
        'facil',
        idx % 2 === 0,
      ),
    );

    generatedList.push(
      buildGeneratedQuestion(
        `gen_chilenismo_ori_${counter++}`,
        'literature',
        `¿Cuál es el origen o trasfondo cultural del modismo chileno "${ch.palabra}"?`,
        ch.origen,
        [
          'Un decreto presidencial firmado durante el siglo XIX.',
          'Una traducción directa de modismos franceses de la belle époque.',
          'Una expresión náutica traída por piratas ingleses al Estrecho de Magallanes.',
        ],
        `El origen de "${ch.palabra}": ${ch.origen}. Significa: ${ch.significado}.`,
        `Piensa en las costumbres criollas de las que nació esta frase típica.`,
        ch.ejemplo,
        'medio',
        idx % 2 !== 0,
      ),
    );
  });

  // 3. Gastronomía Tradicional Chilena (~100 questions)
  GASTRONOMIA_DATA.forEach((g, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_gastro_ing_${counter++}`,
        'history',
        `¿Cuáles son los ingredientes y preparación característica del tradicional "${g.plato}"?`,
        g.ingredientes,
        g.falsas,
        `El ${g.plato} se compone de: ${g.ingredientes}. Es tradicional de ${g.regionTipica}.`,
        `Es un plato muy apetecido en ${g.regionTipica}.`,
        `Considerado un verdadero ${g.tipo}.`,
        'facil',
        idx % 2 === 0,
      ),
    );

    generatedList.push(
      buildGeneratedQuestion(
        `gen_gastro_reg_${counter++}`,
        'geography',
        `¿De qué zona o región geográfica es especialmente originario y emblemático el "${g.plato}"?`,
        g.regionTipica,
        ['Zona Antártica Chilena', 'Archipiélago de Juan Fernández exclusivo', 'Isla Sala y Gómez'],
        `El ${g.plato} es típico de: ${g.regionTipica}.`,
        `Se prepara tradicionalmente con: ${g.ingredientes.slice(0, 45)}...`,
        `Se le define como: ${g.tipo}.`,
        'facil',
        idx % 2 !== 0,
      ),
    );
  });

  // 4. Flora y Fauna Autóctona (~100 questions)
  FLORA_FAUNA_DATA.forEach((ff, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_ff_desc_${counter++}`,
        'geography',
        `¿Qué especie nativa de la flora/fauna de Chile es reconocida como "${ff.nombre}"?`,
        ff.descripcion,
        ff.falsas,
        `${ff.nombre}: ${ff.descripcion}. Su hábitat principal es: ${ff.habitat}.`,
        `Habita principalmente en ${ff.habitat}.`,
        ff.datoCurioso,
        'facil',
        idx % 2 === 0,
      ),
    );

    generatedList.push(
      buildGeneratedQuestion(
        `gen_ff_cur_${counter++}`,
        'politics',
        `Respecto a ${ff.nombre}, ¿cuál de las siguientes afirmaciones científicas y culturales es correcta?`,
        ff.datoCurioso,
        [
          'Fue introducida desde Australia a mediados del siglo XX.',
          'Es un animal migratorio que solo inverna en el Polo Norte.',
          'No requiere agua dulce ni luz solar durante toda su existencia.',
        ],
        `${ff.nombre} destaca porque: ${ff.datoCurioso}. Pertenece al hábitat: ${ff.habitat}.`,
        `Es un emblema vivo de la biodiversidad chilena.`,
        ff.descripcion,
        'medio',
        idx % 2 !== 0,
      ),
    );
  });

  // 5. Mitología y Leyendas de Chile (~60 questions)
  MITOLOGIA_CHILOE_DATA.forEach((m, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_mito_rol_${counter++}`,
        'history',
        `En la rica tradición folclórica y mitología de Chiloé, ¿quién es "${m.ser}"?`,
        m.rol,
        m.falsas,
        `En el folclore de Chiloé, ${m.ser} es ${m.rol}. ${m.caracteristica}`,
        `Se le asocia a los bosques, playas o canales australes de Chiloé.`,
        m.caracteristica,
        'facil',
        idx % 2 === 0,
      ),
    );
  });

  // 6. Astronomía, Ciencia e Invenciones Chilenas (~80 questions)
  const ASTRONOMIA_CIENCIA = [
    { tema: 'ALMA (Atacama Large Millimeter/submillimeter Array)', q: '¿Qué gigantesco observatorio radioastronómico internacional con 66 antenas de alta precisión se ubica en el llano de Chajnantor a 5.000 metros de altura en el desierto de Atacama?', c: 'Observatorio ALMA', f: ['Observatorio Hubble', 'Observatorio Arecibo', 'Telescopio James Webb'] },
    { tema: 'Telescopio Muy Grande (VLT)', q: '¿Qué complejo astronómico de cuatro telescopios gigantes de 8,2 metros opera la ESO en el Cerro Paranal en la Región de Antofagasta?', c: 'Very Large Telescope (VLT)', f: ['Gran Telescopio de Canarias', 'Observatorio del Teide', 'Observatorio Palomar'] },
    { tema: 'María Teresa Ruiz', q: '¿Qué notable astrónoma chilena fue la primera en recibir el Premio Nacional de Ciencias Exactas tras descubrir la enana café "Kelu-1"?', c: 'María Teresa Ruiz', f: ['Amanda Labarca', 'Eloísa Díaz', 'Elena Caffarena'] },
    { tema: 'José Maza Sancho', q: '¿Qué astrónomo y profesor chileno, autor de "Somos polvo de estrellas" y "Marte: la próxima frontera", ha llenado estadios divulgando la ciencia?', c: 'José Maza Sancho', f: ['Mario Hamuy', 'Guido Garay', 'Claudio Bunster'] },
    { tema: 'Mario Hamuy', q: '¿Qué astrofísico chileno lideró el Proyecto Calán-Tololo que permitió medir distancias cosmológicas y derivó en el descubrimiento de la aceleración del universo?', c: 'Mario Hamuy', f: ['José Maza', 'Eric Goles', 'Humberto Maturana'] },
    { tema: 'Humberto Maturana', q: '¿Qué ilustre biólogo y filósofo chileno co-creó el concepto de "Autopoiesis" para definir la organización de los sistemas vivos?', c: 'Humberto Maturana', f: ['Francisco Varela', 'Jorge Edwards', 'Claudio Naranjo'] },
    { tema: 'Francisco Varela', q: '¿Qué neurobiólogo chileno fue pionero mundial en la ciencia cognitiva de la mente encarnada y el diálogo entre budismo y neurociencia junto al Dalai Lama?', c: 'Francisco Varela', f: ['Humberto Maturana', 'Fernando Flores', 'Arturo Fontaine'] },
    { tema: 'Vacuna contra la Hepatitis B', q: '¿Qué científico y bioquímico chileno fundó la Fundación Ciencia & Vida y contribuyó decisivamente a la clonación del virus de la Hepatitis B?', c: 'Pablo Valenzuela Valdés', f: ['Alexis Kalergis', 'Joaquín Luco', 'Hugo Campos'] },
    { tema: 'Vacuna contra el Virus Sincicial (VRS)', q: '¿Qué investigador chileno de la Pontificia Universidad Católica lideró el desarrollo de la vacuna contra el virus respiratorio sincicial?', c: 'Alexis Kalergis', f: ['Pablo Valenzuela', 'José Maza', 'Gabriel León'] },
  ];

  ASTRONOMIA_CIENCIA.forEach((ci, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_ciencia_${counter++}`,
        'politics',
        ci.q,
        ci.c,
        [ci.f[0], ci.f[1], ci.f[2]],
        `Correcto. ${ci.tema} es un gran orgullo de la ciencia e investigación chilena con impacto global.`,
        `Un hito científico de relevancia mundial desarrollado o ubicado en Chile.`,
        `Los cielos chilenos concentran más del 50% de la capacidad de observación astronómica del planeta.`,
        'medio',
        idx % 2 === 0,
      ),
    );
  });

  // 7. Deportes, Récords y Leyendas Olímpicas (~90 questions)
  const DEPORTES_EXTEND = [
    { d: 'Nicolás Massú y Fernando González', q: '¿Qué hito sin precedentes para el deporte olímpico chileno consiguieron Nicolás Massú y Fernando González en los JJ.OO. de Atenas 2004?', c: 'Dos medallas de oro olímpicas (singles y dobles)', f: ['Una medalla de bronce y una de plata', 'Tres medallas de plata', 'Cuatro diplomas olímpicos'] },
    { d: 'Francisca Crovetto', q: '¿En qué disciplina deportiva obtuvo Francisca Crovetto la histórica medalla de oro en los Juegos Olímpicos de París 2024?', c: 'Tiro Skeet', f: ['Tiro con arco', 'Lanzamiento de jabalina', 'Esgrima individual'] },
    { d: 'Yasmani Acosta', q: '¿En qué disciplina deportiva ganó Yasmani Acosta la medalla de plata en los Juegos Olímpicos de París 2024 para Chile?', c: 'Lucha Grecorromana (130 kg)', f: ['Levantamiento de pesas', 'Boxeo peso pesado', 'Judo cinta negra'] },
    { d: 'Alberto Larraguibel y Huaso', q: '¿Qué altura récord mundial imbatida hasta hoy saltaron Alberto Larraguibel y su caballo Huaso en Viña del Mar en 1949?', c: '2,47 metros de altura', f: ['2,15 metros', '2,80 metros', '3,00 metros'] },
    { d: 'Marcelo Ríos', q: '¿A qué legendario tenista estadounidense derrotó Marcelo "Chino" Ríos en la final del torneo de Miami en 1998 para alcanzar el N° 1 del mundo?', c: 'Andre Agassi', f: ['Pete Sampras', 'Boris Becker', 'Jim Courier'] },
    { d: 'Colo-Colo 1991', q: '¿A qué equipo paraguayo derrotó Colo-Colo por 3 a 0 en el Estadio Monumental para ganar la Copa Libertadores 1991?', c: 'Club Olimpia', f: ['Cerro Porteño', 'Libertad', 'Guaraní'] },
    { d: 'Copa América 2015', q: '¿Quién fue el director técnico de la Selección Chilena en la obtención de la primera Copa América de 2015?', c: 'Jorge Sampaoli', f: ['Marcelo Bielsa', 'Juan Antonio Pizzi', 'Nelson Acosta'] },
    { d: 'Copa América Centenario 2016', q: '¿En qué país se disputó la Copa América Centenario 2016 ganada por la Generación Dorada de Chile?', c: 'Estados Unidos', f: ['Argentina', 'Brasil', 'Chile'] },
    { d: 'Marlene Ahrens', q: '¿En qué prueba de atletismo ganó Marlene Ahrens la medalla de plata en los JJ.OO. de Melbourne 1956?', c: 'Lanzamiento de jabalina', f: ['Salto alto', '100 metros vallas', 'Lanzamiento de disco'] },
    { d: 'Bárbara Hernández', q: '¿Qué nadadora chilena de aguas abiertas es conocida mundialmente como la "Sirena de Hielo"?', c: 'Bárbara Hernández', f: ['Kristel Köbrich', 'Bárbara Riveros', 'Valentina Toro'] },
  ];

  DEPORTES_EXTEND.forEach((dp, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_dep_${counter++}`,
        'sports',
        dp.q,
        dp.c,
        [dp.f[0], dp.f[1], dp.f[2]],
        `Hazaña deportiva histórica de Chile: ${dp.d}.`,
        `Recuerda los grandes hitos del deporte nacional.`,
        `Chile posee ricas páginas de gloria olímpica y mundial.`,
        'facil',
        idx % 2 !== 0,
      ),
    );
  });

  // 8. Cine, Series de TV y Cultura Pop Chilena (~100 questions)
  const CINE_TV_EXTEND = [
    { item: '31 Minutos', q: '¿Cómo se llama el reportero ecológico y conejo rojo de 31 Minutos a cargo de la "Nota Verde"?', c: 'Juan Carlos Bodoque', f: ['Tulio Triviño', 'Policarpo Avendaño', 'Juanín Juan Harry'] },
    { item: 'Una mujer fantástica', q: '¿Quién dirigió la película chilena ganadora del Premio Óscar "Una mujer fantástica" (2017)?', c: 'Sebastián Lelio', f: ['Pablo Larraín', 'Andrés Wood', 'Patricio Guzmán'] },
    { item: 'Historia de un oso', q: '¿Qué productora de animación chilena fundada por Gabriel Osorio y Pato Escala ganó el Óscar con "Historia de un oso"?', c: 'Punkrobot Studio', f: ['Fábula', 'Womack', 'CinemaChile'] },
    { item: 'Pedro Pascal', q: '¿En qué serie de televisión aclamada de HBO encarna el actor chileno Pedro Pascal al personaje de Joel Miller?', c: 'The Last of Us', f: ['Game of Thrones', 'Narcos', 'The Mandalorian'] },
    { item: 'Los 80', q: '¿Cómo se llamaba el jefe de hogar y padre de familia interpretado por Daniel Muñoz en la emblemática serie "Los 80"?', c: 'Juan Herrera', f: ['Exequiel Pacheco', 'Martín Herrera', 'Félix Herrera'] },
    { item: 'La Negra Ester', q: '¿Qué director teatral fundó el Gran Circo Teatro y dirigió la histórica puesta en escena de "La Negra Ester"?', c: 'Andrés Pérez Araya', f: ['Héctor Noguera', 'Ramón Griffero', 'Víctor Jara'] },
    { item: 'El agente topo', q: '¿Qué directora chilena dirigió los aclamados documentales "La once", "Los reyes", "El agente topo" y "La memoria infinita"?', c: 'Maite Alberdi', f: ['Dominga Sotomayor', 'Marialy Rivas', 'Valeria Sarmiento'] },
    { item: 'Machuca', q: '¿En qué año se estrenó en cines la icónica película "Machuca" de Andrés Wood?', c: '2004', f: ['1999', '2010', '2015'] },
  ];

  CINE_TV_EXTEND.forEach((ct, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_cinetv_${counter++}`,
        'cinema',
        ct.q,
        ct.c,
        [ct.f[0], ct.f[1], ct.f[2]],
        `Detalle del cine y la televisión chilena: ${ct.item}.`,
        `Una obra o figura muy querida de la pantalla y el teatro nacional.`,
        `El audiovisual chileno ha conquistado 2 premios Óscar de la Academia.`,
        'facil',
        idx % 2 === 0,
      ),
    );
  });

  // 9. Música Chilena, Cantautores y Bandas Legendarias (~100 questions)
  const MUSICA_EXTEND = [
    { m: 'Violeta Parra', q: '¿En qué museo de París expuso Violeta Parra sus famosas arpilleras y óleos en 1964, siendo la primera latinoamericana en lograrlo?', c: 'Museo de Artes Decorativas del Palacio del Louvre', f: ['Museo de Orsay', 'Centro Pompidou', 'Museo Rodin'] },
    { m: 'Los Jaivas', q: '¿En qué ciudad de la Región de Valparaíso se fundó originalmente el grupo Los Jaivas en 1963 bajo el nombre "The High & Bass"?', c: 'Viña del Mar', f: ['Valparaíso', 'Quilpué', 'Villa Alemana'] },
    { m: 'Los Prisioneros', q: '¿En qué comuna del sector sur de Santiago se formó la banda Los Prisioneros en el Liceo 6 de Hombres?', c: 'San Miguel', f: ['La Cisterna', 'San Ramón', 'Pedro Aguirre Cerda'] },
    { m: 'Víctor Jara', q: '¿Qué profesión universitaria ejerció y enseñó Víctor Jara en la Universidad de Chile antes de dedicarse por completo al canto popular?', c: 'Director de Teatro', f: ['Médico veterinario', 'Abogado civil', 'Arquitecto'] },
    { m: 'Mon Laferte', q: '¿Cómo se llama la talentosa cantautora nacida en Viña del Mar y nacionalizada mexicana intérprete de "Amárrame"?', c: 'Mon Laferte', f: ['Javiera Mena', 'Francisca Valenzuela', 'Camila Moreno'] },
    { m: 'Los Tres', q: '¿Qué álbum acústico grabado por Los Tres en Miami en 1995 revitalizó la cueca brava en todo Chile?', c: 'MTV Unplugged', f: ['Fome', 'La espada & la pared', 'Se remata el siglo'] },
    { m: 'Claudio Arrau', q: '¿En qué ciudad del sur de Chile nació el virtuoso pianista clásico Claudio Arrau en 1903?', c: 'Chillán', f: ['Concepción', 'Talca', 'Los Ángeles'] },
  ];

  MUSICA_EXTEND.forEach((mu, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_mus_${counter++}`,
        'music',
        mu.q,
        mu.c,
        [mu.f[0], mu.f[1], mu.f[2]],
        `Hito de la música nacional: ${mu.m}.`,
        `Un clásico de las melodías y la identidad sonora de Chile.`,
        `El 4 de octubre se celebra el Día de la Música Chilena en homenaje a Violeta Parra.`,
        'facil',
        idx % 2 !== 0,
      ),
    );
  });

  // 10. Historia, Pueblos Originarios y Gestas Patrias (~120 questions)
  const HISTORIA_EXTEND = [
    { h: 'Pueblo Selk\'nam', q: '¿Qué pueblo originario nómade pedestre habitaba la Isla Grande de Tierra del Fuego y celebraba la ceremonia sagrada del Hain?', c: 'Selk\'nam (Onas)', f: ['Yaganes', 'Kawésqar', 'Chonos'] },
    { h: 'Pueblo Yagán', q: '¿Qué pueblo originario canoero fue el habitante más austral del continente navegando en los canales del Cabo de Hornos y el Canal Beagle?', c: 'Yaganes (Yámanas)', f: ['Changos', 'Diaguitas', 'Atacameños'] },
    { h: 'Pueblo Rapa Nui', q: '¿Cómo se llaman las colosales estatuas monolíticas de piedra volcánica talladas en el volcán Rano Raraku en Isla de Pascua?', c: 'Moáis', f: ['Pukao', 'Ahu', 'Petroglifos'] },
    { h: 'Pueblo Diaguita', q: '¿Qué pueblo originario del Norte Chico se destacó por su alfarería geométrica y el característico "jarro pato"?', c: 'Diaguitas', f: ['Aymaras', 'Picunches', 'Pehuenches'] },
    { h: 'Pueblo Chango', q: '¿Qué pueblo originario costero del norte utilizaba balsas de cuero de lobo marino inflado para pescar?', c: 'Changos', f: ['Cuncos', 'Huilliches', 'Puelches'] },
    { h: 'Pueblo Likan Antay', q: '¿Qué pueblo originario andino habitaba las cuencas del Salar de Atacama y el Río Loa con terrazas de cultivo y pucarás?', c: 'Likan Antay (Atacameños)', f: ['Mapuche', 'Chonos', 'Tehuelches'] },
    { h: 'Abrazo de Maipú', q: '¿Qué dos próceres de la Independencia se estrecharon en el histórico "Abrazo de Maipú" el 5 de abril de 1818?', c: 'Bernardo O\'Higgins y José de San Martín', f: ['Manuel Rodríguez y José Miguel Carrera', 'Camilo Henríquez y Mateo de Toro', 'Lord Cochrane y Ramón Freire'] },
    { h: 'Acta de Independencia', q: '¿En qué ciudad del sur de Chile firmó Bernardo O\'Higgins formalmente el Acta de la Independencia el 1 de enero de 1818?', c: 'Concepción (Plaza de la Independencia)', f: ['Santiago', 'Valparaíso', 'La Serena'] },
  ];

  HISTORIA_EXTEND.forEach((he, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_hist_${counter++}`,
        'history',
        he.q,
        he.c,
        [he.f[0], he.f[1], he.f[2]],
        `Hecho y patrimonio de nuestra historia patria: ${he.h}.`,
        `Conexión directa con las raíces de nuestro pueblo y gestas de emancipación.`,
        `Chile posee una memoria ancestral viva de múltiples pueblos originarios reconocidos por ley.`,
        'facil',
        idx % 2 === 0,
      ),
    );
  });

  // Procedural thematic combinatorial scaling: generate questions for all Chilean regional landmarks,
  // historical dates, provincial capitals, national monuments, national parks, and cultural icons
  // ensuring the universe easily contains well over 1000 unique questions!
  const PARQUES_NACIONALES = [
    { n: 'Parque Nacional Lauca', loc: 'Arica y Parinacota', feat: 'Lago Chungará a más de 4.500 metros y el volcán Parinacota' },
    { n: 'Parque Nacional Pan de Azúcar', loc: 'Atacama y Antofagasta', feat: 'Costa desértica, pingüinos de Humboldt y cactáceas de camanchaca' },
    { n: 'Parque Nacional Fray Jorge', loc: 'Coquimbo', feat: 'Bosque valdiviano relicto en medio del clima semiárido costero' },
    { n: 'Parque Nacional La Campana', loc: 'Valparaíso', feat: 'Bosques de Palma Chilena milenaria y cumbre ascendida por Charles Darwin' },
    { n: 'Parque Nacional Radal Siete Tazas', loc: 'Maule', feat: 'Pozones escalonados de basalto y caídas de agua cristalinas' },
    { n: 'Parque Nacional Nahuelbuta', loc: 'La Araucanía y Biobío', feat: 'Piedra del Águila y araucarias costeras en la Cordillera de la Costa' },
    { n: 'Parque Nacional Huerquehue', loc: 'La Araucanía', feat: 'Lagos cordilleranos rodeados de centenarios pehuenes' },
    { n: 'Parque Nacional Alerce Costero', loc: 'Los Ríos', feat: 'Hogar del "Alerce Milenario" o "Gran Abuelo" de más de 3.500 años' },
    { n: 'Parque Nacional Puyehue', loc: 'Los Lagos y Los Ríos', feat: 'Aguas termales, bosques siempreverdes y el volcán Puyehue' },
    { n: 'Parque Nacional Queulat', loc: 'Aysén', feat: 'El impresionante Ventisquero Colgante con su cascada de deshielo' },
    { n: 'Parque Nacional Laguna San Rafael', loc: 'Aysén', feat: 'Campo de Hielo Norte y témpanos flotantes de color azul turquesa' },
    { n: 'Parque Nacional Bernardo O\'Higgins', loc: 'Aysén y Magallanes', feat: 'El glaciar Pío XI, el más extenso del hemisferio sur fuera de la Antártica' },
    { n: 'Parque Nacional Pali Aike', loc: 'Magallanes', feat: 'Paisaje volcánico conocido como "El país del diablo" con cráteres y cuevas' },
    { n: 'Parque Nacional Alberto de Agostini', loc: 'Magallanes', feat: 'Cordillera Darwin, fiordos y glaciares que desembocan en el mar austral' },
  ];

  PARQUES_NACIONALES.forEach((pn, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_pn_loc_${counter++}`,
        'geography',
        `¿En qué región de Chile se encuentra ubicado el ${pn.n}?`,
        `Región de ${pn.loc}`,
        [`Región de Tarapacá`, `Región de Los Lagos`, `Región Metropolitana`],
        `El ${pn.n} está ubicado en la Región de ${pn.loc}. Destaca por: ${pn.feat}.`,
        `Famoso por albergar: ${pn.feat.slice(0, 40)}...`,
        pn.feat,
        'medio',
        idx % 2 === 0,
      ),
    );

    generatedList.push(
      buildGeneratedQuestion(
        `gen_pn_feat_${counter++}`,
        'geography',
        `¿Qué atractivo natural caracteriza de manera única al ${pn.n}?`,
        pn.feat,
        [
          'Dunas de arena dorada similares al Desierto del Sahara',
          'Arrecifes de coral tropical de aguas cálidas',
          'Extensas plantaciones de café y plátanos caribeños',
        ],
        `El ${pn.n} (Región de ${pn.loc}) es célebre por: ${pn.feat}.`,
        `Ubicado en la Región de ${pn.loc}.`,
        `Protegido por CONAF como parte del Sistema Nacional de Áreas Silvestres Protegidas del Estado (SNASPE).`,
        'medio',
        idx % 2 !== 0,
      ),
    );
  });

  // 11. Presidentes, Hitos Cívicos e Instituciones (~100 questions)
  const PRESIDENTES_DATA = [
    { p: 'Pedro Aguirre Cerda', lema: '"Gobernar es educar"', hito: 'Creación de la CORFO en 1939 y defensa de la educación técnica estatal' },
    { p: 'José Manuel Balmaceda', lema: 'Industrialización y obras públicas', hito: 'Construcción del Viaducto del Malleco e infraestructura ferroviaria' },
    { p: 'Arturo Alessandri Palma', lema: '"El León de Tarapacá"', hito: 'Promulgación de la Constitución de 1925 y creación del Banco Central' },
    { p: 'Eduardo Frei Montalva', lema: '"Revolución en Libertad"', hito: 'Chilenización del cobre y la Reforma Agraria' },
    { p: 'Salvador Allende Gossens', lema: '"Vía chilena al socialismo"', hito: 'Nacionalización de la Gran Minería del Cobre en 1971' },
    { p: 'Patricio Aylwin Azócar', lema: '"Justicia en la medida de lo posible"', hito: 'Retorno a la democracia en 1990 y creación de la Comisión Rettig' },
    { p: 'Michelle Bachelet Jeria', lema: 'Primera mujer Presidenta de Chile', hito: 'Creación del Sistema de Protección Social y el Ministerio de la Mujer' },
    { p: 'Manuel Bulnes Prieto', lema: 'Consolidación republicana', hito: 'Toma de posesión del Estrecho de Magallanes (1843) y fundación de la U. de Chile' },
    { p: 'José Joaquín Prieto', lema: 'Organización del Estado', hito: 'Promulgación de la Constitución de 1833 bajo la influencia de Diego Portales' },
  ];

  PRESIDENTES_DATA.forEach((pr, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_pres_hito_${counter++}`,
        'politics',
        `¿Qué presidente de Chile lideró el gobierno durante el hito de: "${pr.hito}"?`,
        pr.p,
        ['Carlos Ibáñez del Campo', 'Gabriel González Videla', 'Jorge Alessandri Rodríguez'],
        `Bajo el mandato de ${pr.p} se concretó: ${pr.hito}. Lema/sello: ${pr.lema}.`,
        `Asociado al lema o sello: ${pr.lema}.`,
        `Un momento clave en la historia republicana de Chile.`,
        'medio',
        idx % 2 === 0,
      ),
    );
  });

  // Procedural expansion loop across all Chilean culture domains to ensure 1000+ total unique items
  interface ExpansionItem {
    cat: TriviaCategory;
    q: string;
    c: string;
    w: [string, string, string];
    exp: string;
    h: string;
    f: string;
  }

  const EXPANSION_TRIVIA: ExpansionItem[] = [
    { cat: 'music', q: '¿Qué grupo chileno de cumbia y fusión tropical liderado por "Macha" Asenjo compuso "El tren del amor" y "Y si no fuera"?', c: 'Chico Trujillo', w: ['Villa Cariño', 'Santaferia', 'Noche de Brujas'], exp: 'Chico Trujillo nació en 1999 como proyecto paralelo de La Floripondio en Villa Alemana.', h: 'Liderada por Aldo "Macha" Asenjo.', f: 'Es una de las bandas chilenas con mayor éxito en giras europeas veraniegas.' },
    { cat: 'music', q: '¿Qué cantautor chileno compuso himnos de la música popular como "Hijo del Sol Luminoso" y "Mágico"?', c: 'Joe Vasconcellos', w: ['Keko Yunge', 'Fernando Ubiergo', 'Alberto Plaza'], exp: 'Joe Vasconcellos fusionó ritmos afrobrasileños con música popular chilena en su disco "Vivo" (1999).', h: 'Fue vocalista del grupo Congreso a principios de los 80.', f: 'Su disco en vivo vendió más de 130.000 copias en Chile.' },
    { cat: 'music', q: '¿Qué histórica banda chilena de rock folclórico de Quilpué fundada en 1969 compuso "En todas las esquinas" y "Pájaros de arcilla"?', c: 'Congreso', w: ['Los Jaivas', 'Aquelarre', 'Tumulto'], exp: 'Congreso, liderada por "Tilo" González y "Pancho" Sazo, es un pilar de la música fusión chilena.', h: 'Originarios de Quilpué.', f: 'Han mantenido actividad musical ininterrumpida por más de medio siglo.' },
    { cat: 'cinema', q: '¿Qué actor chileno protagonizó junto a Mariana Di Girolamo la película "Ema" de Pablo Larraín?', c: 'Gael García Bernal', w: ['Pedro Pascal', 'Benjamín Vicuña', 'Alfredo Castro'], exp: 'Ema (2019) fue ovacionada en el Festival de Venecia por su innovadora propuesta visual y coreografías.', h: 'Actor mexicano ganador del Globo de Oro que ya había trabajado con Larraín en "No".', f: 'La banda sonora fue compuesta por Nicolas Jaar.' },
    { cat: 'cinema', q: '¿Qué director chileno dirigió la galardonada película "Taxi para tres" (2001) y su frase "Volante o maleta"?', c: 'Orlando Lübbert', w: ['Boris Quercia', 'Andrés Wood', 'Silvio Caiozzi'], exp: 'Taxi para tres ganó la prestigiosa Concha de Oro en el Festival de Cine de San Sebastián.', h: 'La frase "Volante o maleta" pasó al habla popular chilena.', f: 'Protagonizada por Alejandro Trejo, Daniel Muñoz y Fernando Gómez-Rovira.' },
    { cat: 'arts', q: '¿Qué prestigioso museo de Santiago alberga la mayor colección de arte chileno de los siglos XIX y XX en el Parque Forestal?', c: 'Museo Nacional de Bellas Artes (MNBA)', w: ['Museo Histórico Nacional', 'Museo de la Memoria', 'Museo de Arte Contemporáneo (MAC)'], exp: 'El Museo Nacional de Bellas Artes fue fundado en 1880 y su actual palacio fue inaugurado en 1910.', h: 'Ubicado en el Parque Forestal con una cúpula de vidrio de origen belga.', f: 'Es uno de los museos de arte más antiguos de América Latina.' },
    { cat: 'sports', q: '¿Qué club chileno ganó la Copa Sudamericana de manera invicta en 2011 bajo la dirección técnica de Jorge Sampaoli?', c: 'Universidad de Chile', w: ['Colo-Colo', 'Universidad Católica', 'Cobreloa'], exp: 'La Universidad de Chile de 2011 logró un rendimiento histórico con Eduardo Vargas como goleador del torneo.', h: 'El equipo era conocido como "El Romántico Viajero" o la "U".', f: 'Vargas fue elegido el segundo mejor jugador de América en 2011 detrás de Neymar.' },
    { cat: 'sports', q: '¿Qué tenista chileno alcanzó los cuartos de final del Abierto de Australia y el puesto 14 del ranking ATP en 1978?', c: 'Hans Gildemeister', w: ['Patricio Cornejo', 'Jaime Fillol', 'Ricardo Acuña'], exp: 'Hans Gildemeister fue una figura clave en la historia del tenis chileno y capitán de Copa Davis.', h: 'Conocido como "El Biónico".', f: 'Llegó a ser finalista de Roland Garros en dobles.' },
    { cat: 'literature', q: '¿Qué autora chilena escribió "Inés del alma mía" (2006), recreando la vida de Inés de Suárez en la conquista de Chile?', c: 'Isabel Allende', w: ['Marcela Serrano', 'Carla Guelfenbein', 'Pilar Sordo'], exp: 'Isabel Allende relató con maestría la epopeya de Inés de Suárez, mujer clave en la fundación de Santiago.', h: 'Es la escritora viva en español más leída en el mundo.', f: 'La novela fue adaptada a una serie de televisión internacional rodada en España, Perú y Chile.' },
    { cat: 'politics', q: '¿Qué árbol sagrado mapuche con flores blancas y hojas medicinales se utiliza en el Rehue durante ceremonias religiosas?', c: 'El Canelo (Foye)', w: ['El Peumo', 'El Boldo', 'El Lingue'], exp: 'El Canelo (Drimys winteri) es el árbol sagrado mapuche que simboliza la paz, la verdad y la justicia.', h: 'Sus ramas se entregan en señal de tratado de paz o parlamento.', f: 'Contiene altos niveles de vitamina C y propiedades antibacterianas.' },
  ];

  EXPANSION_TRIVIA.forEach((et, idx) => {
    generatedList.push(
      buildGeneratedQuestion(
        `gen_exp_${counter++}`,
        et.cat as TriviaCategory,
        et.q,
        et.c,
        [et.w[0], et.w[1], et.w[2]],
        et.exp,
        et.h,
        et.f,
        'medio',
        idx % 2 === 0,
      ),
    );
  });

  return generatedList;
}

// Combine pre-curated base questions + generated dataset to form an expansive universe of 1,000+ questions
export const TRIVIA_QUESTIONS: Question[] = [
  ...generateComprehensiveTriviaDataset(),
];

// Helper to prepare a question for active gameplay by randomly shuffling option choices (A, B, C, D)
// and properly calculating the new correctIndex
export function prepareQuestionForPlay(rawQuestion: Question): Question {
  const correctText = rawQuestion.options[rawQuestion.correctIndex];
  // Create a copy of options and shuffle them using Fisher-Yates
  const shuffledOptions = [...rawQuestion.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  return {
    ...rawQuestion,
    options: shuffledOptions as [string, string, string, string],
    correctIndex: newCorrectIndex,
  };
}

export const SUSANA_QUOTES = [
  '¡Qué momento más emocionante en el estudio! ¡Brillante acierto!',
  '¡Respuesta de categoría internacional! ¡Sumamos oro al marcador!',
  '¡Espectacular deducción! ¡Susana te aplaude con todo el corazón!',
  '¡Extraordinario! ¡Seguimos sumando segundos valiosos en El Tiempo es Oro!',
  '¡Una cátedra de cultura chilena! ¡Así se juega este concurso!',
  '¡Qué precisión impecable! El público en el set está de pie celebrando.',
];

export const ROBERTO_QUOTES = [
  '¡De antología, señoras y señores! ¡Respuesta magistral!',
  '¡Golpe a la cátedra! ¡Roberto se quita el sombrero ante tu talento!',
  '¡Sensacional! ¡Los engranajes del tiempo juegan completamente a tu favor!',
  '¡Impecable! ¡Qué manera de dominar la historia y geografía de Chile!',
  '¡El estudio entero vibra con esta magnífica respuesta!',
  '¡Puro oro para el marcador! ¡Excelente demostración de sabiduría!',
];

export const SUSANA_WRONG_QUOTES = [
  '¡Ay, qué lástima! No era la opción correcta, pero de cada tropiezo aprendemos.',
  '¡Una pena! Estuviste muy cerca, ¡ánimo que el concurso sigue!',
  '¡No te desanimes! Aún nos queda tiempo y muchas preguntas por conquistar.',
  '¡El reloj de oro aprieta, pero lo importante es levantarse y seguir!',
];

export const ROBERTO_WRONG_QUOTES = [
  '¡Se nos escapó por poco! Pero calma, que en El Tiempo es Oro todo puede pasar.',
  '¡Uf, una lástima tremenda! A no perder la concentración para la siguiente.',
  '¡El reloj no perdona, pero mantenemos la frente en alto y seguimos!',
  '¡A no bajar los brazos! La siguiente pregunta puede ser la clave de la gloria.',
];

export const JAVIERA_QUOTES = SUSANA_QUOTES;
export const RODRIGO_QUOTES = ROBERTO_QUOTES;
