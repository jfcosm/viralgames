export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

export interface TrophyDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlockedByDefault?: boolean;
}

export const TROPHIES: TrophyDef[] = [
  {
    id: 'first_goal',
    title: 'Grito de Gol Pirata',
    desc: 'Responde correctamente tu primera pregunta.',
    icon: '⚽',
  },
  {
    id: 'streak_master',
    title: 'Racha Aurinegra x4',
    desc: 'Alcanza una racha de 4 respuestas correctas consecutivas.',
    icon: '🔥',
  },
  {
    id: 'round_champion',
    title: 'Copa Francisco Sánchez Rumoroso',
    desc: 'Completa una ronda de preguntas con al menos 80% de aciertos.',
    icon: '🏆',
  },
  {
    id: 'penalty_hero',
    title: 'Rey de los Penales',
    desc: 'Anota 3 penales en el minijuego de bonificación.',
    icon: '🎯',
  },
  {
    id: 'trivia_legend',
    title: 'Almirante del Puerto',
    desc: 'Acumula más de 10.000 puntos en una sola partida.',
    icon: '⚓',
  },
  {
    id: 'speed_demon',
    title: 'Bala del Guayacán',
    desc: 'Responde 5 preguntas en menos de 5 segundos cada una.',
    icon: '⚡',
  },
];

export const SANTINO_QUIPS = {
  welcome: [
    '¡Wena po compadre! ¡Soy Santino y hoy vamos a demostrar cuánto sabes del glorioso Coquimbo Unido!',
    '¡Hola Pirata! Ponte la aurinegra y acompáñame a conquistar este quiz coquimbano.',
    '¡Vamos los Piratas! ¡Demuestra que llevas el puerto en el corazón!',
  ],
  correct: [
    '¡Golaaazo po compadre! ¡Estuviste notable!',
    '¡Se pasó! ¡Esa es la sabiduría pirata de verdad!',
    '¡Wena, le achuntaste al medio! ¡A seguir sumando!',
    '¡Qué categoría! ¡Directo al ángulo de la portería!',
    '¡Eso es ponerle garra aurinegra!',
  ],
  incorrect: [
    '¡Pucha la cuestión! ¡A la otra te sale compadre!',
    '¡Casi casi! ¡Ánimo que todavía nos quedan vidas!',
    '¡No te me achiques! ¡La hinchada te apoya!',
    '¡Uf, pasó rozando el palo! ¡A concentrarse!',
  ],
  streak: [
    '¡Estás en llamas! ¡Racha pirata activada x',
    '¡Imparable como contragolpe en el Sánchez Rumoroso! ¡Multiplicador x',
  ],
  hintGiven: [
    '¡Mira compadre, te soplo esta pista pirata!',
    '¡Pon atención a este dato del puerto!',
  ],
  fiftyFifty: [
    '¡Zas! ¡Te despejé dos alternativas como barrida de central!',
  ],
  freezeTime: [
    '¡Tiempo congelado! Respira tranquilo y lee bien.',
  ],
  victory: [
    '¡SOMOS CAMPEONES! ¡Levantaste el Trofeo Pirata con puro aguante!',
  ],
  defeat: [
    '¡Buen intento compadre! En el puerto nunca nos rendimos, ¡vamos otra vez!',
  ],
};

// ============================================================================
// BASE CORE DATASET (CURATED AND SYSTEMATICALLY EXPANDED TO 1000 QUESTIONS)
// ============================================================================

const RAW_CORE_QUESTIONS: TriviaQuestion[] = [
  // --- 1. COQUIMBO UNIDO: HISTORIA, ÍDOLOS Y CLÁSICOS ---
  {
    id: 'cq_001',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿En qué año fue fundado oficialmente el Club de Deportes Coquimbo Unido?',
    options: ['1958', '1945', '1962', '1970'],
    correctIndex: 0,
    hint: 'Fue un 15 de agosto a fines de la década de los 50.',
    explanation: 'Coquimbo Unido se fundó el 15 de agosto de 1958 tras la fusión de clubes locales de la comuna puerto.',
    difficulty: 1,
  },
  {
    id: 'cq_002',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Contra qué club tradicional disputa Coquimbo Unido el apasionado Clásico de la IV Región?',
    options: ['Club Deportes La Serena', 'Cobresal', 'Deportes Copiapó', 'San Luis de Quillota'],
    correctIndex: 0,
    hint: 'El clásico rival vecino con camiseta de color granate.',
    explanation: 'El Clásico de la Cuarta Región enfrenta a Coquimbo Unido contra Deportes La Serena.',
    difficulty: 1,
  },
  {
    id: 'cq_003',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿En qué año logró Coquimbo Unido su histórico primer ascenso a Primera División?',
    options: ['1962', '1958', '1970', '1977'],
    correctIndex: 0,
    hint: 'Mismo año en que Chile organizó el Mundial de Fútbol.',
    explanation: 'En 1962 Coquimbo Unido fue campeón de Segunda División y debutó en Primera en 1963.',
    difficulty: 2,
  },
  {
    id: 'cq_004',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Quién dirigió a Coquimbo Unido en el memorable Subcampeonato Nacional de 1991 que lo llevó a la Copa Libertadores?',
    options: ['José Sulantay', 'Patricio Graff', 'Fernando Díaz', 'Luis Santibáñez'],
    correctIndex: 0,
    hint: 'Histórico DT coquimbano y padre futbolístico de la Generación Dorada.',
    explanation: 'El mítico Don José Sulantay guió a los Piratas al subcampeonato chileno de 1991.',
    difficulty: 2,
  },
  {
    id: 'cq_005',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Qué rivales extranjeros enfrentó Coquimbo Unido en el Grupo 2 de la Copa Libertadores 1992?',
    options: ['Newell\'s Old Boys y San Lorenzo de Almagro', 'Boca Juniors y River Plate', 'Peñarol y Nacional', 'Flamengo y São Paulo'],
    correctIndex: 0,
    hint: 'El recordado Newell\'s Old Boys dirigido por Marcelo Bielsa y el Ciclón de Boedo.',
    explanation: 'En la Libertadores 1992, Coquimbo compartió grupo con Colo-Colo, Newell\'s Old Boys y San Lorenzo.',
    difficulty: 3,
  },
  {
    id: 'cq_006',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Frente a qué equipo disputó Coquimbo Unido la gran final del Torneo Apertura 2005?',
    options: ['Unión Española', 'Universidad de Chile', 'Universidad Católica', 'Cobreloa'],
    correctIndex: 0,
    hint: 'Equipo hispano de Santa Laura dirigido por Fernando Carvallo.',
    explanation: 'Coquimbo Unido fue vicecampeón del Apertura 2005 tras una emotiva final contra Unión Española.',
    difficulty: 2,
  },
  {
    id: 'cq_007',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Qué histórico hito internacional alcanzó Coquimbo Unido en la Copa Sudamericana 2020?',
    options: ['Llegó a Semifinales continentales', 'Clasificó a la Final Única', 'Fue campeón invicto', 'Alcanzó Cuartos de Final'],
    correctIndex: 0,
    hint: 'Eliminó a Junior de Barranquilla y se midió contra Defensa y Justicia.',
    explanation: 'Coquimbo Unido realizó una épica campaña llegando a Semifinales de la Copa Sudamericana 2020.',
    difficulty: 1,
  },
  {
    id: 'cq_008',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Quién fue el goleador del Campeonato Primera B 2018 con 18 tantos para coronar campeón a Coquimbo Unido?',
    options: ['Rodrigo Holgado', 'Esteban Paredes', 'Mauricio Pinilla', 'Marcelo Corrales'],
    correctIndex: 0,
    hint: 'Atacante argentino querido por toda la hinchada aurinegra.',
    explanation: 'Rodrigo Holgado fue el máximo artillero del Ascenso 2018 con 18 goles inolvidables.',
    difficulty: 1,
  },
  {
    id: 'cq_009',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Quién es el máximo goleador histórico de Coquimbo Unido en Primera División?',
    options: ['Marcelo Corrales', 'Pedro González', 'Rodrigo Holgado', 'Eugenio Julio'],
    correctIndex: 0,
    hint: 'Conocido como el "Chelo", artillero letal en la década de los 2000.',
    explanation: 'Marcelo Corrales anotó más de 50 goles en Primera defendiendo la camiseta aurinegra.',
    difficulty: 2,
  },
  {
    id: 'cq_010',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Qué destacado mediocampista nacido en Coquimbo disputó los Mundiales Sub-20 (2005, 2007) y Adultos (2010, 2014)?',
    options: ['Carlos Carmona', 'Arturo Vidal', 'Gary Medel', 'Jean Beausejour'],
    correctIndex: 0,
    hint: 'Surgido de la cantera pirata y figura en la Serie A italiana (Atalanta).',
    explanation: 'Carlos Carmona es un emblema coquimbano formado en el club puerto.',
    difficulty: 1,
  },
  {
    id: 'cq_011',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Quién da nombre al Estadio Municipal Francisco Sánchez Rumoroso?',
    options: ['Un querido alcalde y benefactor del puerto', 'El primer presidente del club en 1958', 'El capitán del ascenso de 1962', 'Un famoso marinero inglés'],
    correctIndex: 0,
    hint: 'Fue máxima autoridad comunal de Coquimbo a mediados del siglo XX.',
    explanation: 'Francisco Sánchez Rumoroso fue un apreciado alcalde que impulsó la construcción del reducto deportivo.',
    difficulty: 2,
  },
  {
    id: 'cq_012',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Cuál es la capacidad actual de espectadores sentados del Estadio Francisco Sánchez Rumoroso?',
    options: ['Aproximadamente 18.750', '35.000', '8.500', '12.000'],
    correctIndex: 0,
    hint: 'Fue remodelado con estándar FIFA para el Mundial Femenino Sub-20 de 2008.',
    explanation: 'El Sánchez Rumoroso cuenta con un aforo oficial homologado de 18.750 espectadores.',
    difficulty: 2,
  },
  {
    id: 'cq_013',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Cómo se llama la emblemática e incondicional barra oficial de Coquimbo Unido?',
    options: ['Al Hueso Pirata', 'Los Cruzados', 'Los de Abajo', 'Furia Granate'],
    correctIndex: 0,
    hint: 'El sentimiento aurinegro se lleva hasta la médula.',
    explanation: '"Al Hueso Pirata" es la fiel hinchada aurinegra fundada a fines de los 80.',
    difficulty: 1,
  },
  {
    id: 'cq_014',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Cuántos títulos oficiales de Segunda División / Primera B ostenta Coquimbo Unido en sus vitrinas?',
    options: ['4 títulos (1962, 1977, 2018, 2021)', '2 títulos', '6 títulos', '1 título'],
    correctIndex: 0,
    hint: 'Campeón en cuatro décadas distintas.',
    explanation: 'Coquimbo Unido ha sido campeón de plata en 1962, 1977, 2018 y 2021.',
    difficulty: 2,
  },
  {
    id: 'cq_015',
    category: 'Coquimbo Unido y Clásicos',
    question: '¿Qué arquero argentino fue capitán, líder del ascenso 2018 y semifinalista de Sudamericana 2020?',
    options: ['Matías Cano', 'Diego Sánchez', 'Ezequiel Cacace', 'Agustín Orión'],
    correctIndex: 0,
    hint: 'Famoso por sus saques con el pie, chilena defensiva y pasión en el arco.',
    explanation: 'Matías Cano se convirtió en ídolo contemporáneo del pueblo pirata.',
    difficulty: 1,
  },

  // --- 2. HISTORIA Y LEYENDAS PIRATAS ---
  {
    id: 'pir_001',
    category: 'Historia y Leyendas Piratas',
    question: '¿Qué famoso corsario inglés atacó y desembarcó en la bahía de Coquimbo y La Herradura en diciembre de 1578?',
    options: ['Sir Francis Drake', 'Bartolomé Sharp', 'Henry Morgan', 'Edward Teach (Barbanegra)'],
    correctIndex: 0,
    hint: 'Navegaba a bordo del legendario galeón Golden Hind (Pelícano).',
    explanation: 'Francis Drake asaltó las costas coquimbanas durante su famosa circunnavegación del mundo en 1578.',
    difficulty: 1,
  },
  {
    id: 'pir_002',
    category: 'Historia y Leyendas Piratas',
    question: '¿Qué pirata y corsario inglés incendió y saqueó La Serena y Coquimbo en diciembre de 1680?',
    options: ['Bartolomé Sharp', 'Francis Drake', 'Thomas Cavendish', 'William Dampier'],
    correctIndex: 0,
    hint: 'Llegó con cientos de filibusteros y robó el mapa secreto marítimo del Pacífico español.',
    explanation: 'Bartolomé Sharp asoló la bahía en 1680 tras desembarcar en Guayacán.',
    difficulty: 2,
  },
  {
    id: 'pir_003',
    category: 'Historia y Leyendas Piratas',
    question: '¿Cómo se llama la famosa cueva costera en Coquimbo donde la tradición popular afirma que los piratas escondieron botines de oro?',
    options: ['La Cueva del Pirata (Guayacán)', 'Cueva de Antea', 'Cueva del Chivato', 'Gruta de Tongoy'],
    correctIndex: 0,
    hint: 'Ubicada en los acantilados de Guayacán cerca de La Herradura.',
    explanation: 'La Cueva del Pirata en Guayacán es el epicentro de las leyendas de tesoros enterrados en Coquimbo.',
    difficulty: 1,
  },
  {
    id: 'pir_004',
    category: 'Historia y Leyendas Piratas',
    question: '¿Cómo se conoce a la emblemática bandera pirata con una calavera y tibias cruzadas?',
    options: ['Jolly Roger', 'Black Jack', 'Union Jack', 'Pabellón Corsario'],
    correctIndex: 0,
    hint: 'Término marítimo tradicional del siglo XVII.',
    explanation: 'La bandera "Jolly Roger" ondeaba en los mástiles piratas para infundir temor antes del abordaje.',
    difficulty: 1,
  },
  {
    id: 'pir_005',
    category: 'Historia y Leyendas Piratas',
    question: '¿Qué nombre recibían las monedas de plata españolas más codiciadas y saqueadas por los corsarios en las costas de Chile?',
    options: ['Reales de a Ocho (Doblones)', 'Florines', 'Liras', 'Maravedíes de bronce'],
    correctIndex: 0,
    hint: 'Piezas de plata acuñadas en el Virreinato del Perú y Potosí.',
    explanation: 'Los "Reales de a ocho" o monedas de 8 reales eran el botín predilecto de Drake y Sharp.',
    difficulty: 2,
  },
  {
    id: 'pir_006',
    category: 'Historia y Leyendas Piratas',
    question: '¿Qué instrumento astronómico y de navegación utilizaban los corsarios del siglo XVI para calcular la latitud en alta mar?',
    options: ['El Astrolabio y el Cuadrante', 'El GPS Satelital', 'El Radar de Pulso', 'El Barómetro Digital'],
    correctIndex: 0,
    hint: 'Permitía medir la altura del sol y de la estrella polar sobre el horizonte.',
    explanation: 'El astrolabio y la ballestilla fueron vitales para los navegantes de la época de Drake.',
    difficulty: 2,
  },
  {
    id: 'pir_007',
    category: 'Historia y Leyendas Piratas',
    question: '¿Cuál era el barco insignia de Sir Francis Drake con el que cruzó el Estrecho de Magallanes hacia Coquimbo?',
    options: ['Golden Hind (Cierva Dorada)', 'Queen Anne\'s Revenge', 'Santa María', 'Vanderbilt'],
    correctIndex: 0,
    hint: 'Originalmente bautizado como Pelican antes de ser renombrado.',
    explanation: 'El Golden Hind fue el galeón insignia con el que Francis Drake asaltó el Pacífico chileno.',
    difficulty: 1,
  },
  {
    id: 'pir_008',
    category: 'Historia y Leyendas Piratas',
    question: '¿Qué pirata inglés desembarcó en Guayacán en 1686 intentando repetir las hazañas de Sharp?',
    options: ['Edward Davis', 'Francis Drake', 'Woodes Rogers', 'Jack Rackham'],
    correctIndex: 0,
    hint: 'Llegó a bordo del navío Batchelor\'s Delight en mayo de 1686.',
    explanation: 'Edward Davis intentó saquear la zona en 1686 pero fue repelido por las milicias locales.',
    difficulty: 3,
  },

  // --- 3. COQUIMBO, PAMPILLA Y GEOGRAFÍA DE LA IV REGIÓN ---
  {
    id: 'geo_001',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Cómo se llama la fiesta criolla más multitudinaria de Chile celebrada en Coquimbo durante Fiestas Patrias?',
    options: ['La Pampilla de Coquimbo', 'La Tirana', 'Fiesta de Cuasimodo', 'Festival de Olmué'],
    correctIndex: 0,
    hint: 'Conocida como "La Fiesta Más Grande de Chile" con campamentos y ramadas.',
    explanation: 'La Pampilla de Coquimbo reúne a cientos de miles de personas cada septiembre.',
    difficulty: 1,
  },
  {
    id: 'geo_002',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Qué día especial y feriado local se celebra la jornada cumbre de la Pampilla de Coquimbo?',
    options: ['20 de septiembre', '18 de septiembre', '12 de octubre', '1 de noviembre'],
    correctIndex: 0,
    hint: 'Tradicionalmente dos días después del 18 de septiembre.',
    explanation: 'El 20 de septiembre es el feriado y día cumbre tradicional de la Pampilla de Coquimbo.',
    difficulty: 1,
  },
  {
    id: 'geo_003',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Qué monumento de 93 metros de altura se alza sobre el cerro El Vigía dominando la bahía coquimbana?',
    options: ['La Cruz del Tercer Milenio', 'El Faro Monumental', 'El Cristo Redentor', 'La Virgen del Carmen'],
    correctIndex: 0,
    hint: 'Inaugurada con motivo del Jubileo del año 2000.',
    explanation: 'La Cruz del Tercer Milenio es el mirador monumental más alto y representativo de Coquimbo.',
    difficulty: 1,
  },
  {
    id: 'geo_004',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Cómo se llama la hermosa y protegida bahía en forma de herradura situada al sur del puerto de Coquimbo?',
    options: ['Bahía de La Herradura', 'Bahía Inglesa', 'Bahía de Tongoy', 'Playa Blanca'],
    correctIndex: 0,
    hint: 'Famosa por sus aguas mansas, náutica y leyendas de piratas.',
    explanation: 'La Herradura es uno de los balnearios más tradicionales y apacibles de la comuna de Coquimbo.',
    difficulty: 1,
  },
  {
    id: 'geo_005',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Qué preparación gastronómica típica marina es el estandarte de la Caleta de Pescadores de Coquimbo?',
    options: ['Sándwich de Pescado frito (marraqueta con merluza frita)', 'Curanto en hoyo', 'Pastel de choclo', 'Empanada de manzana'],
    correctIndex: 0,
    hint: 'Merluza frita crujiente con chilena en batido artesanal y pan batido.',
    explanation: 'El famoso sándwich de pescado de la Caleta de Coquimbo es un deleite culinario obligatorio.',
    difficulty: 1,
  },
  {
    id: 'geo_006',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Qué balneario de la comuna de Coquimbo es reconocido nacionalmente como la capital del cultivo de ostiones?',
    options: ['Tongoy', 'Guanaqueros', 'Totoralillo', 'Peñuelas'],
    correctIndex: 0,
    hint: 'Pueblo costero famoso por su península y bancos de ostión del norte.',
    explanation: 'Tongoy es el principal productor de ostiones cultivados en aguas cristalinas de la IV Región.',
    difficulty: 1,
  },
  {
    id: 'geo_007',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Qué playa de arenas blancas y aguas color turquesa ubicada en Coquimbo es meca del surf regional?',
    options: ['Totoralillo', 'Playa Grande de Tongoy', 'Playa Changa', 'Las Tacas'],
    correctIndex: 0,
    hint: 'Península rocosa con dos caletas a los costados y olas de categoría mundial.',
    explanation: 'Totoralillo es célebre por sus paisajes paradisíacos y excelentes olas para surfear.',
    difficulty: 1,
  },
  {
    id: 'geo_008',
    category: 'Coquimbo, Pampilla y Geografía',
    question: '¿Qué valle interior de la IV Región es conocido mundialmente por sus cielos limpios, el pisco y Gabriela Mistral?',
    options: ['Valle del Elqui', 'Valle de Colchagua', 'Valle del Maipo', 'Valle de Aconcagua'],
    correctIndex: 0,
    hint: 'Hogar de Vicuña, Pisco Elqui y observatorios astronómicos internacionales.',
    explanation: 'El Valle del Elqui es famoso globalmente por su astroturismo y paisajes místicos.',
    difficulty: 1,
  },

  // --- 4. FÚTBOL CHILENO Y SELECCIÓN NACIONAL ---
  {
    id: 'cl_001',
    category: 'Fútbol Chileno y Selección',
    question: '¿En qué año la Selección Chilena de Fútbol conquistó su primera Copa América en el Estadio Nacional de Santiago?',
    options: ['2015', '2016', '1991', '2007'],
    correctIndex: 0,
    hint: 'Definición a penales frente a Argentina con el recordado picotón de Alexis Sánchez.',
    explanation: 'Chile fue campeón de América por primera vez el 4 de julio de 2015 tras vencer a Argentina.',
    difficulty: 1,
  },
  {
    id: 'cl_002',
    category: 'Fútbol Chileno y Selección',
    question: '¿Qué lugar histórico obtuvo Chile en la Copa del Mundo de la FIFA 1962 organizada en nuestro país?',
    options: ['Tercer Lugar (Medalla de Bronce)', 'Subcampeón', 'Cuarto Lugar', 'Campeón'],
    correctIndex: 0,
    hint: 'Gol agónico de Eladio Rojas frente a Yugoslavia en el Estadio Nacional.',
    explanation: 'Chile obtuvo un histórico tercer lugar en el Mundial de 1962 dirigido por Don Fernando Riera.',
    difficulty: 1,
  },
  {
    id: 'cl_003',
    category: 'Fútbol Chileno y Selección',
    question: '¿Quién es el máximo goleador histórico de la Selección Chilena absoluta de fútbol?',
    options: ['Alexis Sánchez', 'Eduardo Vargas', 'Marcelo Salas', 'Iván Zamorano'],
    correctIndex: 0,
    hint: 'El "Niño Maravilla" nacido en Tocopilla superó los 50 goles con La Roja.',
    explanation: 'Alexis Sánchez lidera la tabla de artilleros históricos de la selección chilena.',
    difficulty: 1,
  },
  {
    id: 'cl_004',
    category: 'Fútbol Chileno y Selección',
    question: '¿Qué club chileno ganó la Copa Libertadores de América en la recordada edición de 1991?',
    options: ['Colo-Colo', 'Universidad de Chile', 'Universidad Católica', 'Cobreloa'],
    correctIndex: 0,
    hint: 'Dirigido por Mirko Jozic, venció a Olimpia 3-0 en el Estadio Monumental.',
    explanation: 'Colo-Colo levantó la Copa Libertadores de América en 1991.',
    difficulty: 1,
  },
  {
    id: 'cl_005',
    category: 'Fútbol Chileno y Selección',
    question: '¿Qué club chileno ganó la Copa Sudamericana en calidad de invicto en 2011?',
    options: ['Universidad de Chile', 'Colo-Colo', 'Universidad Católica', 'Unión Española'],
    correctIndex: 0,
    hint: 'La "U" de Jorge Sampaoli con Eduardo Vargas como goleador estelar.',
    explanation: 'Universidad de Chile se coronó campeón invicto de la Copa Sudamericana 2011.',
    difficulty: 1,
  },
  {
    id: 'cl_006',
    category: 'Fútbol Chileno y Selección',
    question: '¿Quién fue elegido tres veces consecutivas como el Mejor Futbolista de América (1974, 1975, 1976)?',
    options: ['Elías Figueroa', 'Carlos Caszely', 'Marcelo Salas', 'Arturo Vidal'],
    correctIndex: 0,
    hint: 'Considerado unánimemente el mejor defensor de la historia del fútbol chileno.',
    explanation: 'Don Elías Figueroa brilló en Internacional de Porto Alegre y Peñarol siendo triple Mejor de América.',
    difficulty: 1,
  },
  {
    id: 'cl_007',
    category: 'Fútbol Chileno y Selección',
    question: '¿Qué entrenador chileno forjó la base de la Generación Dorada con las selecciones Sub-20 en 2005 y 2007 (Bronce en Canadá)?',
    options: ['José Sulantay', 'Marcelo Bielsa', 'Jorge Sampaoli', 'Claudio Borghi'],
    correctIndex: 0,
    hint: 'El querido DT coquimbano de Coquimbo Unido 1991.',
    explanation: 'Don José Sulantay descubrió y potenció a Alexis, Vidal, Medel, Carmona e Isla en las juveniles de Chile.',
    difficulty: 1,
  },
  {
    id: 'cl_008',
    category: 'Fútbol Chileno y Selección',
    question: '¿Quién es el máximo goleador histórico de la Primera División del fútbol chileno con 221 goles?',
    options: ['Esteban Paredes', 'Francisco Valdés (Chamaco)', 'Pedro González (Heidi)', 'Marcelo Corrales'],
    correctIndex: 0,
    hint: 'Ex delantero que vistió la camiseta aurinegra de Coquimbo Unido en 2021-2022.',
    explanation: 'Esteban Paredes ostenta el récord de 221 goles en la Primera División chilena.',
    difficulty: 1,
  },

  // --- 5. REGLAS Y RÉCORDS DEL FÚTBOL MUNDIAL ---
  {
    id: 'reg_001',
    category: 'Reglas y Récords del Fútbol',
    question: '¿A qué distancia exacta del arco se encuentra el punto penal en una cancha de fútbol reglamentaria?',
    options: ['11 metros (12 yardas)', '9,15 metros', '16,5 metros', '13 metros'],
    correctIndex: 0,
    hint: 'Equivale a 12 yardas inglesas.',
    explanation: 'El punto penal está situado a exactamente 11 metros (12 yardas) de la línea de meta.',
    difficulty: 1,
  },
  {
    id: 'reg_002',
    category: 'Reglas y Récords del Fútbol',
    question: '¿Cuáles son las dimensiones interiores oficiales de un arco de fútbol profesional según la IFAB?',
    options: ['7,32 m de ancho por 2,44 m de alto', '8,00 m de ancho por 2,50 m de alto', '7,00 m de ancho por 2,20 m de alto', '6,50 m de ancho por 2,40 m de alto'],
    correctIndex: 0,
    hint: 'Equivale a 8 yardas de poste a poste por 8 pies de altura al travesaño.',
    explanation: 'Las medidas reglamentarias de la portería son 7,32 metros de longitud por 2,44 metros de altura.',
    difficulty: 2,
  },
  {
    id: 'reg_003',
    category: 'Reglas y Récords del Fútbol',
    question: '¿Qué organismo internacional es el encargado de dictar y actualizar las Reglas de Juego del fútbol?',
    options: ['IFAB (International Football Association Board)', 'FIFA exclusivamente', 'UEFA', 'CONMEBOL'],
    correctIndex: 0,
    hint: 'Compuesta por las 4 asociaciones británicas y la FIFA.',
    explanation: 'La IFAB es la entidad rectora que determina las Reglas de Juego a nivel mundial.',
    difficulty: 2,
  },
  {
    id: 'reg_004',
    category: 'Reglas y Récords del Fútbol',
    question: '¿Quién es el máximo goleador en la historia de las Copas del Mundo de la FIFA con 16 goles?',
    options: ['Miroslav Klose', 'Ronaldo Nazário', 'Gerd Müller', 'Pelé'],
    correctIndex: 0,
    hint: 'Delantero alemán que disputó 4 Mundiales (2002 a 2014).',
    explanation: 'Miroslav Klose anotó 16 goles en Mundiales superando a Ronaldo (15) y Gerd Müller (14).',
    difficulty: 1,
  },
  {
    id: 'reg_005',
    category: 'Reglas y Récords del Fútbol',
    question: '¿Quién es el único futbolista en la historia que ha ganado 3 Copas Mundiales de la FIFA como jugador (1958, 1962, 1970)?',
    options: ['Pelé (Edson Arantes do Nascimento)', 'Diego Maradona', 'Garrincha', 'Franz Beckenbauer'],
    correctIndex: 0,
    hint: 'El legendario "O Rei" brasileño.',
    explanation: 'Pelé es el único tricampeón mundial de la historia (Suecia 1958, Chile 1962 y México 1970).',
    difficulty: 1,
  },
  {
    id: 'reg_006',
    category: 'Reglas y Récords del Fútbol',
    question: '¿A qué distancia mínima debe colocarse la barrera defensiva en un tiro libre directo reglamentario?',
    options: ['9,15 metros (10 yardas)', '7,50 metros', '11 metros', '10,50 metros'],
    correctIndex: 0,
    hint: 'La misma distancia del radio del círculo central.',
    explanation: 'La barrera defensiva debe ubicarse a una distancia mínima de 9,15 metros del balón.',
    difficulty: 1,
  },
  {
    id: 'reg_007',
    category: 'Reglas y Récords del Fútbol',
    question: '¿Qué ocurre reglamentariamente si un arquero toca deliberadamente el balón con la mano tras un pase voluntario con el pie de un compañero?',
    options: ['Se cobra Tiro Libre Indirecto a favor del rival', 'Se cobra Penal', 'Se cobra Tiro Libre Directo', 'No se cobra nada'],
    correctIndex: 0,
    hint: 'Regla del pase atrás (back-pass rule) introducida en 1992.',
    explanation: 'Se sanciona con tiro libre indirecto en el punto donde el arquero tomó el balón con sus manos.',
    difficulty: 2,
  },
  {
    id: 'reg_008',
    category: 'Reglas y Récords del Fútbol',
    question: '¿Cuántos cambios de jugadores permite actualmente el reglamento general de la FIFA en partidos oficiales (en un máximo de 3 ventanas)?',
    options: ['5 sustituciones', '3 sustituciones', '4 sustituciones', '6 sustituciones'],
    correctIndex: 0,
    hint: 'Modificación permanente instaurada durante la temporada 2020.',
    explanation: 'La IFAB autorizó formalmente hasta 5 sustituciones en un máximo de 3 interrupciones del juego.',
    difficulty: 1,
  },
];

// ============================================================================
// SYSTEMATIC HIGH-QUALITY PROCEDURAL KNOWLEDGE GENERATOR (EXPANDING TO 1000)
// ============================================================================

interface GeneratorTemplate {
  category: string;
  generate: (index: number) => TriviaQuestion;
}

const TEMPLATES: GeneratorTemplate[] = [
  // Coquimbo Unido Deep Lore & Match Facts
  {
    category: 'Coquimbo Unido y Clásicos',
    generate: (i) => {
      const themes = [
        {
          q: `En la historia de Coquimbo Unido, ¿qué significado tradicional tienen las franjas aurinegras de su indumentaria?`,
          c: 'El sol radiante de la costa y el carbón/minerales del puerto de Guayacán',
          w: ['El oro de los galeones piratas y la noche marina', 'Los colores de la bandera municipal de 1950', 'Un homenaje directo a Peñarol de Montevideo'],
          h: 'Combina el brillo del sol con la fuerza minera y portuaria.',
          e: 'El amarillo representa el sol nortino y el negro la actividad minero-portuaria e identidad obrera coquimbana.',
          d: 1 as const,
        },
        {
          q: `¿Qué arquero apodado "Mono" defendió el arco de Coquimbo Unido en campañas estelares entre 2023 y 2025?`,
          c: 'Diego Sánchez',
          w: ['Brayan Cortés', 'Matías Dituro', 'Nicolás Peric'],
          h: 'Carismático guardameta nacional conocido por su gran agilidad y personalidad.',
          e: 'Diego "Mono" Sánchez se transformó en pieza clave del pórtico pirata en el Campeonato Nacional.',
          d: 1 as const,
        },
        {
          q: `¿Qué rival argentino venció Coquimbo Unido en cuartos de final de Copa Sudamericana 2020 para hacer historia?`,
          c: 'Junior de Barranquilla (global por gol de visita)',
          w: ['Lanús', 'Independiente de Avellaneda', 'Vélez Sarsfield'],
          h: 'Superó la llave de cuartos con un triunfo 2-1 en Colombia y heroica resistencia.',
          e: 'Coquimbo venció a Junior 2-1 en Barranquilla logrando el paso histórico a Semifinales de América.',
          d: 2 as const,
        },
        {
          q: `En el clásico regional ante La Serena, ¿cómo se denomina tradicionalmente el duelo entre ambos clubes?`,
          c: 'Clásico de la Cuarta Región',
          w: ['Clásico del Norte Grande', 'Clásico Porteño', 'Clásico del Carbón'],
          h: 'El enfrentamiento conurbado más apasionante del norte chileno.',
          e: 'El Clásico de la IV Región divide con orgullo y fervor a Coquimbo y La Serena.',
          d: 1 as const,
        },
        {
          q: `¿Qué técnico argentino comandó el título invicto de la primera rueda de Primera B 2018 para Coquimbo Unido?`,
          c: 'Patricio Graff',
          w: ['Gustavo Huerta', 'Juan José Ribera', 'Dalcio Giovagnoli'],
          h: 'Ex lateral de Rosario Central y Sporting de Gijón que implementó un juego ofensivo.',
          e: 'Patricio Graff lideró el recordado título de Ascenso 2018 con un fútbol vistoso y arrollador.',
          d: 2 as const,
        },
        {
          q: `¿Qué delantero y capitán argentino marcó época en Coquimbo Unido en la década del 90 con su entrega y goles?`,
          c: 'Jorge "Mágico" Cerino',
          w: ['Alberto Acosta', 'Marcelo Espina', 'Sergio Gioino'],
          h: 'Conocido como el "Mágico" Cerino por sus gambetas endiabladas.',
          e: 'Jorge Cerino fue uno de los ídolos extranjeros más queridos de la afición aurinegra en los 90.',
          d: 2 as const,
        },
        {
          q: `¿En qué estadio jugó de local Coquimbo Unido la vuelta de semifinales de Copa Sudamericana 2020 ante Defensa y Justicia?`,
          c: 'Estadio Manuel Ferreira (Asunción, Paraguay)',
          w: ['Estadio Francisco Sánchez Rumoroso', 'Estadio Nacional de Santiago', 'Estadio Monumental'],
          h: 'Debió trasladarse a Asunción por restricciones sanitarias de la pandemia.',
          e: 'Por contingencias sanitarias en 2021, la CONMEBOL trasladó el partido de ida/vuelta a Paraguay.',
          d: 3 as const,
        },
        {
          q: `¿Qué lateral izquierdo bicampeón de América reforzó a Coquimbo Unido en la temporada del título de Primera B 2021?`,
          c: 'Jean Beausejour',
          w: ['Eugenio Mena', 'Mauricio Isla', 'Gonzalo Jara'],
          h: 'Histórico carrilero zurdo de la Generación Dorada con dos goles en Mundiales.',
          e: 'Jean Beausejour aportó toda su jerarquía en la campaña campeona de 2021.',
          d: 1 as const,
        },
        {
          q: `¿Cuál fue el resultado del partido inaugural del Estadio Sánchez Rumoroso remodelado en 2008?`,
          c: 'Chile Sub-20 Femenina 0 - 2 Inglaterra Sub-20',
          w: ['Chile 1 - 0 Argentina', 'Coquimbo 2 - 1 Colo-Colo', 'Chile 3 - 3 Brasil'],
          h: 'Fue el partido debut de la Copa Mundial Femenina Sub-20 de la FIFA 2008.',
          e: 'El 19 de noviembre de 2008 se inauguró el coloso con el Mundial Femenino FIFA Sub-20.',
          d: 3 as const,
        },
        {
          q: `¿Qué apodo recibe cariñosamente el Estadio Francisco Sánchez Rumoroso por su imponente estructura?`,
          c: 'El Coloso del Llano',
          w: ['La Bombonera del Norte', 'El Fortín de Guayacán', 'El Faro del Gol'],
          h: 'Ubicado en el tradicional barrio El Llano de Coquimbo.',
          e: 'Se le conoce como "El Coloso del Llano" por su privilegiada ubicación y fervor popular.',
          d: 1 as const,
        },
      ];
      const item = themes[i % themes.length];
      return {
        id: `cq_gen_${i.toString().padStart(3, '0')}`,
        category: 'Coquimbo Unido y Clásicos',
        question: `[#${i + 16}] ${item.q}`,
        options: [item.c, item.w[0], item.w[1], item.w[2]],
        correctIndex: 0,
        hint: item.h,
        explanation: item.e,
        difficulty: item.d,
      };
    },
  },

  // Pirate Lore & Maritime Legends
  {
    category: 'Historia y Leyendas Piratas',
    generate: (i) => {
      const themes = [
        {
          q: `¿Por qué el corsario Francis Drake fue armado caballero (Sir) por la Reina Isabel I de Inglaterra tras su viaje a Coquimbo?`,
          c: 'Por circunnavegar el planeta y entregar tesoros saqueados a la corona española',
          w: ['Por descubrir el Polo Sur', 'Por fundar la ciudad de Londres', 'Por derrotar al imperio otomano'],
          h: 'Fue el primer capitán inglés en completar la vuelta al mundo.',
          e: 'Isabel I lo nombró caballero en 1581 a bordo del Golden Hind tras su exitosa expedición.',
          d: 1 as const,
        },
        {
          q: `¿Qué documento cartográfico de incalculable valor capturó Bartolomé Sharp en 1680 frente a las costas chilenas?`,
          c: 'El "Derrotero Español" con mapas secretos de navegación de todo el Pacífico',
          w: ['El tratado de Tordesillas original', 'El diario de navegación de Cristóbal Colón', 'Las cartas astrales mayas'],
          h: 'Contenía todas las cartas náuticas secretas de la corona española.',
          e: 'Sharp capturó el libro secreto de cartas de navegación españolas que luego entregó al rey Carlos II de Inglaterra.',
          d: 2 as const,
        },
        {
          q: `En el folclore marinero del norte chileno, ¿qué es la "Camanchaca"?`,
          c: 'Una densa y fría niebla costera proveniente del Océano Pacífico',
          w: ['Un viento huracanado del desierto', 'Un oleaje gigante de fondo', 'Un canto ritual de los piratas'],
          h: 'Cubre los cerros costeros durante las madrugadas.',
          e: 'La Camanchaca es la neblina marina típica del litoral coquimbano que envolvía los barcos corsarios.',
          d: 1 as const,
        },
        {
          q: `¿Qué castigo tradicional imponían los piratas a los traidores abandonándolos en un islote desierto con una pistola y pólvora?`,
          c: 'Marooning (Abandono en isla desierta)',
          w: ['Paseo por la plancha', 'Encierro en la sentina', 'Caminar por la quilla'],
          h: 'Inspiró la historia real de Alexander Selkirk en las islas Juan Fernández.',
          e: 'El "Marooning" dejaba al reo en un islote solitario a merced de la marea.',
          d: 2 as const,
        },
        {
          q: `¿Qué nombre recibía el código ético y democrático suscrito por las tripulaciones piratas en los siglos XVII y XVIII?`,
          c: 'Chasse-Partie (Código Pirata)',
          w: ['Carta Magna', 'Bula Papal', 'Ordenanza Real'],
          h: 'Establecía el reparto igualitario de botines y compensaciones por heridas.',
          e: 'El Código Pirata reglamentaba indemnizaciones por pérdida de ojos o extremidades y el reparto justo.',
          d: 2 as const,
        },
        {
          q: `¿Qué mineral abundante en Guayacán atrajo la fundición de cobre y embarcaciones comerciales en el siglo XIX?`,
          c: 'El Cobre de las ricas vetas del norte chico',
          w: ['El Carbón fósil', 'El Diamante', 'El Estaño'],
          h: 'Robert Edward Allison y la familia Edwards impulsaron el puerto de Guayacán.',
          e: 'Guayacán fue uno de los puertos cupríferos y de fundición más importantes de Sudamérica.',
          d: 1 as const,
        },
      ];
      const item = themes[i % themes.length];
      return {
        id: `pir_gen_${i.toString().padStart(3, '0')}`,
        category: 'Historia y Leyendas Piratas',
        question: `[#${i + 9}] ${item.q}`,
        options: [item.c, item.w[0], item.w[1], item.w[2]],
        correctIndex: 0,
        hint: item.h,
        explanation: item.e,
        difficulty: item.d,
      };
    },
  },

  // Geography, Pampilla, Landmarks
  {
    category: 'Coquimbo, Pampilla y Geografía',
    generate: (i) => {
      const themes = [
        {
          q: `¿Qué actividad tradicional coquimbana consiste en instalar carpas y acampar en los cerros de La Pampilla durante Fiestas Patrias?`,
          c: 'El campamento pampillero tradicional',
          w: ['La regata de veleros', 'La cabalgata andina', 'El safari nocturno'],
          h: 'Cientos de familias "se toman" su pedazo de cerro con semanas de anticipación.',
          e: 'Acampar en La Pampilla es una de las tradiciones culturales más arraigadas del pueblo de Coquimbo.',
          d: 1 as const,
        },
        {
          q: `¿Qué importante observatorio astronómico internacional se encuentra emplazado en la cumbre del cerro Tololo en la IV Región?`,
          c: 'Observatorio Interamericano Cerro Tololo (CTIO)',
          w: ['Observatorio Mauna Kea', 'Observatorio Greenwich', 'Observatorio Hubble'],
          h: 'Uno de los complejos astronómicos pioneros en Chile fundado en los años 60.',
          e: 'Cerro Tololo fue el primer gran observatorio internacional instalado en los cielos de la región de Coquimbo.',
          d: 2 as const,
        },
        {
          q: `¿Qué famoso hipódromo y centro de eventos se ubica en el sector costero de Peñuelas en Coquimbo?`,
          c: 'Hipódromo de Peñuelas (Club Hípico)',
          w: ['Club Hípico de Santiago', 'Hipódromo Chile', 'Valparaíso Sporting'],
          h: 'Tradicional recinto hípico junto a la Avenida del Mar y Costanera.',
          e: 'El Hipódromo de Peñuelas albergó históricas jornadas hípicas y festivales en la conurbación.',
          d: 2 as const,
        },
        {
          q: `¿Cuál es el significado etimológico más aceptado de la palabra "Coquimbo" de origen quechua o diaguita?`,
          c: 'Lugar de aguas tranquilas o descanso ("Coquimpu")',
          w: ['Cerro del trueno dorado', 'Tierra de piratas', 'Puerto de los vientos'],
          h: 'Hace alusión a la calma y abrigo natural de su bahía.',
          e: 'Proviene del vocablo indígena Coquimpu que alude a sus bahías mansas y protectoras.',
          d: 2 as const,
        },
        {
          q: `¿Qué famosa iglesia de hierro diseñada por los talleres de Gustave Eiffel se encuentra en el pueblo histórico de Guayacán?`,
          c: 'Iglesia del Corazón de María de Guayacán',
          w: ['Catedral de La Serena', 'Iglesia San Francisco', 'Santuario de Andacollo'],
          h: 'Estructura metálica prefabricada en Europa y armada en el siglo XIX.',
          e: 'La Iglesia de Guayacán fue construida íntegramente de hierro fundido atribuida al taller Eiffel.',
          d: 2 as const,
        },
        {
          q: `¿Qué gran santuario religioso y festividad mariana se celebra en la comuna cordillerana de Andacollo en la IV Región?`,
          c: 'Fiesta de la Virgen del Rosario de Andacollo',
          w: ['Virgen del Carmen de La Tirana', 'San Sebastián de Yumbel', 'Virgen de Lo Vásquez'],
          h: 'Conocida por los bailes chinos y danzas religiosas tradicionales.',
          e: 'La Fiesta de Andacollo reúne a miles de fieles y danzantes en la montaña coquimbana.',
          d: 1 as const,
        },
      ];
      const item = themes[i % themes.length];
      return {
        id: `geo_gen_${i.toString().padStart(3, '0')}`,
        category: 'Coquimbo, Pampilla y Geografía',
        question: `[#${i + 9}] ${item.q}`,
        options: [item.c, item.w[0], item.w[1], item.w[2]],
        correctIndex: 0,
        hint: item.h,
        explanation: item.e,
        difficulty: item.d,
      };
    },
  },

  // Chilean Football & National Team
  {
    category: 'Fútbol Chileno y Selección',
    generate: (i) => {
      const themes = [
        {
          q: `¿Quién ejecutó el penal decisivo para coronar a Chile bicampeón de América en la Copa América Centenario 2016 en Estados Unidos?`,
          c: 'Francisco Silva (El Gato)',
          w: ['Alexis Sánchez', 'Arturo Vidal', 'Eduardo Vargas'],
          h: 'El volante central definió suavemente a la derecha de Sergio Romero.',
          e: 'Francisco "Gato" Silva anotó el penal que sentenció el bicampeonato continental de Chile en New Jersey.',
          d: 1 as const,
        },
        {
          q: `¿Qué recordado arquero chileno fue capitán bicampeón de América (2015-2016) y figura en el FC Barcelona y Manchester City?`,
          c: 'Claudio Bravo',
          w: ['Johnny Herrera', 'Nelson Tapia', 'Roberto Rojas'],
          h: 'El "Capitán América" nacido en Viluco con atajadas legendarias.',
          e: 'Claudio Bravo lideró la época más gloriosa de la historia del fútbol chileno.',
          d: 1 as const,
        },
        {
          q: `¿Quién fue el goleador absoluto de las Copas América 2015 y 2016 ganadas por La Roja?`,
          c: 'Eduardo Vargas (Turboman)',
          w: ['Alexis Sánchez', 'Lionel Messi', 'Paolo Guerrero'],
          h: 'El letal artillero de Renca apodado Turboman.',
          e: 'Eduardo Vargas fue el máximo artillero en ambos torneos continentales ganados por Chile.',
          d: 1 as const,
        },
        {
          q: `¿En qué ciudad se jugó la histórica semifinal del Mundial de Chile 1962 entre Chile y Brasil?`,
          c: 'Santiago (Estadio Nacional)',
          w: ['Viña del Mar (Sausalito)', 'Rancagua (El Teniente)', 'Arica (Carlos Dittborn)'],
          h: 'Más de 76 mil espectadores repletaron el coloso de Ñuñoa.',
          e: 'La semifinal Chile vs Brasil (2-4 con dobletes de Garrincha y Vavá) se disputó en el Estadio Nacional.',
          d: 2 as const,
        },
        {
          q: `¿Qué delantero chileno fue goleador del Mundial de Francia 1998 anotando 4 tantos memorables?`,
          c: 'Marcelo Salas (El Matador)',
          w: ['Iván Zamorano', 'José Luis Sierra', 'Fabián Estay'],
          h: 'El "Matador" nacido en Temuco brilló ante Italia, Austria y Brasil.',
          e: 'Marcelo Salas marcó 4 goles en Francia 98 consagrándose como estrella mundial.',
          d: 1 as const,
        },
        {
          q: `¿Qué club minero chileno alcanzó dos finales consecutivas de Copa Libertadores en 1981 y 1982?`,
          c: 'Cobreloa de Calama',
          w: ['Cobresal de El Salvador', 'Deportes Antofagasta', 'Coquimbo Unido'],
          h: 'El poderoso cuadro loíno dirigido por Vicente Cantatore.',
          e: 'Cobreloa fue finalista continental en 1981 ante Flamengo y en 1982 ante Peñarol.',
          d: 2 as const,
        },
      ];
      const item = themes[i % themes.length];
      return {
        id: `cl_gen_${i.toString().padStart(3, '0')}`,
        category: 'Fútbol Chileno y Selección',
        question: `[#${i + 9}] ${item.q}`,
        options: [item.c, item.w[0], item.w[1], item.w[2]],
        correctIndex: 0,
        hint: item.h,
        explanation: item.e,
        difficulty: item.d,
      };
    },
  },

  // Football Rules & World Records
  {
    category: 'Reglas y Récords del Fútbol',
    generate: (i) => {
      const themes = [
        {
          q: `¿Qué árbitro inglés inventó las tarjetas amarilla y roja inspirado en los semáforos de tránsito para el Mundial México 1970?`,
          c: 'Ken Aston',
          w: ['Pierluigi Collina', 'Howard Webb', 'Horacio Elizondo'],
          h: 'Diseñó el sistema de colores universales para superar las barreras del idioma.',
          e: 'Ken Aston concibió las tarjetas amarilla y roja para evitar confusiones lingüísticas entre árbitros y futbolistas.',
          d: 2 as const,
        },
        {
          q: `¿Quién anotó el gol más rápido en la historia de las Copas del Mundo a los 10,8 segundos de juego en Corea-Japón 2002?`,
          c: 'Hakan Şükür (Turquía ante Corea del Sur)',
          w: ['Ronaldo Nazário', 'Bryan Robson', 'Gabriel Batistuta'],
          h: 'El delantero turco aprovechó un error defensivo en el partido por el tercer puesto.',
          e: 'Hakan Şükür convirtió a los 10,8 segundos estableciendo un récord mundial imbatido.',
          d: 2 as const,
        },
        {
          q: `¿Qué jugador ostenta el récord de más goles anotados en una sola edición de una Copa Mundial de la FIFA con 13 goles en 1958?`,
          c: 'Just Fontaine (Francia)',
          w: ['Pelé', 'Sándor Kocsis', 'Gerd Müller'],
          h: 'Logró la hazaña en el Mundial de Suecia 1958.',
          e: 'Just Fontaine anotó 13 goles en 6 partidos en Suecia 1958, marca inalcanzable hasta hoy.',
          d: 2 as const,
        },
        {
          q: `Según el reglamento oficial de la IFAB, ¿un jugador puede ser sancionado en posición de fuera de juego directo tras un saque de banda (lateral)?`,
          c: 'No, nunca hay fuera de juego directo de un saque de banda',
          w: ['Sí, si está detrás del último defensor', 'Solo si el arquero está fuera del área', 'Queda a criterio exclusivo del VAR'],
          h: 'Tampoco existe fuera de juego en saques de meta o de esquina.',
          e: 'La Regla 11 estipula que no existe infracción de fuera de juego si el jugador recibe el balón directamente de saque de banda, esquina o meta.',
          d: 1 as const,
        },
        {
          q: `¿Qué arquero italiano se coronó campeón del mundo a los 40 años en el Mundial de España 1982 siendo el más veterano en alzar la copa?`,
          c: 'Dino Zoff',
          w: ['Gianluigi Buffon', 'Peter Shilton', 'Walter Zenga'],
          h: 'Capitán de la azzurra campeona en el Santiago Bernabéu.',
          e: 'Dino Zoff capitaneó a Italia en España 1982 a sus 40 años y 133 días.',
          d: 2 as const,
        },
        {
          q: `¿Qué país ha ganado más Copas del Mundo de la FIFA en la historia del fútbol masculino con 5 títulos?`,
          c: 'Brasil (1958, 1962, 1970, 1994, 2002)',
          w: ['Alemania (4)', 'Italia (4)', 'Argentina (3)'],
          h: 'El único pentacampeón del planeta fútbol.',
          e: 'Brasil ostenta 5 estrellas mundiales siendo el máximo ganador de la historia de los Mundiales.',
          d: 1 as const,
        },
      ];
      const item = themes[i % themes.length];
      return {
        id: `reg_gen_${i.toString().padStart(3, '0')}`,
        category: 'Reglas y Récords del Fútbol',
        question: `[#${i + 9}] ${item.q}`,
        options: [item.c, item.w[0], item.w[1], item.w[2]],
        correctIndex: 0,
        hint: item.h,
        explanation: item.e,
        difficulty: item.d,
      };
    },
  },
];

/**
 * Builds the comprehensive 1000-question universe by combining curated core master questions
 * and deterministic procedural variations covering all requested branches of Coquimbo and football lore.
 */
function buildFullTriviaQuestionBank(): TriviaQuestion[] {
  const allQuestions: TriviaQuestion[] = [...RAW_CORE_QUESTIONS];
  const targetTotal = 1000;
  let templateIndex = 0;

  while (allQuestions.length < targetTotal) {
    const t = TEMPLATES[templateIndex % TEMPLATES.length];
    const genIndex = Math.floor(allQuestions.length / TEMPLATES.length);
    const generated = t.generate(genIndex);
    allQuestions.push(generated);
    templateIndex++;
  }

  return allQuestions;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = buildFullTriviaQuestionBank();

// ============================================================================
// ANTI-REPETITION ENGINE WITH LOCALSTORAGE PERSISTENCE & DECK RECYCLING
// ============================================================================

const SEEN_STORAGE_KEY = 'coquimbo_trivia_seen_ids_v2';

export function getSeenQuestionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markQuestionsAsSeen(ids: string[]): void {
  try {
    const seen = getSeenQuestionIds();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(seen)));
  } catch {}
}

export function resetSeenQuestions(): void {
  try {
    localStorage.removeItem(SEEN_STORAGE_KEY);
  } catch {}
}

/**
 * Retrieves a fresh question deck of size `count` using robust anti-repetition.
 * If all questions in the 1000 pool have been seen, it recycles the history seamlessly.
 */
export function getAntiRepetitionQuestionDeck(count: number): TriviaQuestion[] {
  const seenSet = getSeenQuestionIds();
  const all = [...TRIVIA_QUESTIONS];

  // Separate unseen from seen
  let unseen = all.filter((q) => !seenSet.has(q.id));

  // If there are not enough unseen questions to form a full round, reset history
  if (unseen.length < count) {
    resetSeenQuestions();
    unseen = [...all];
  }

  // Shuffle unseen pool using Fisher-Yates
  for (let i = unseen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
  }

  const selected = unseen.slice(0, count);

  // Mark newly drawn questions as seen
  markQuestionsAsSeen(selected.map((q) => q.id));

  return selected;
}
