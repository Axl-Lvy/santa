export type TrollGift = { id: string; title: string; roast: string };

/** Les 20 cadeaux les plus horribles — purement comique. */
export const TROLL_GIFTS: TrollGift[] = [
  {
    id: "patate",
    title: "Une pomme de terre emballée dans du papier cadeau",
    roast: "Avec un petit mot : « Pour que tu gardes la patate. » Budget : 0,30 €. Humiliation : maximale.",
  },
  {
    id: "brosse-chiottes",
    title: "Une brosse à chiottes d'occasion",
    roast: "Avec l'étiquette « Comme neuve ». Impossible de faire pire sur le plan sanitaire et affectif.",
  },
  {
    id: "chaussette-seule",
    title: "Une seule chaussette",
    roast: "Pas la paire. Une seule. Et en taille 46 alors que la personne fait du 39.",
  },
  {
    id: "photo-axel",
    title: "Une photo encadrée d'Axel",
    roast: "Format XXL, dédicacée, avec écrit : « Tu as de la chance de me connaître. »",
  },
  {
    id: "derouleur-pq",
    title: "Un dérouleur de papier toilette",
    roast: "En plastique beige, particulièrement laid. À offrir avec beaucoup de sérieux.",
  },
  {
    id: "clown-porcelaine",
    title: "Une figurine de clown en porcelaine",
    roast: "Avec un regard inquiétant. Le genre de cadeau que tu n'oses pas jeter mais que tu ne veux surtout pas regarder.",
  },
  {
    id: "peigne-wilfried",
    title: "Un peigne si c'est pour Wilfried",
    roast: "Emballé dans une boîte luxueuse pour créer un maximum de faux espoir.",
  },
  {
    id: "gravier",
    title: "Un sachet de gravier",
    roast: "Avec une étiquette « Collection de pierres rares ». Ramassé sur le parking avant le réveillon.",
  },
  {
    id: "pull-trop-petit",
    title: "Un pull de Noël atroce, trois tailles trop petit",
    roast: "Avec des grelots qui tintent à chaque mouvement et un renne qui louche.",
  },
  {
    id: "savon-premier-prix",
    title: "Un savon premier prix",
    roast: "Accompagné du message « Je pense que ça te sera utile ». Ambiance garantie à table.",
  },
  {
    id: "boite-vide",
    title: "Une boîte vide",
    roast: "Avec une carte : « L'essentiel est invisible pour les yeux. » Aucun autre cadeau ne suit.",
  },
  {
    id: "cd-raye",
    title: "Un CD rayé d'un chanteur inconnu",
    roast: "Sans boîtier. Et la personne n'a évidemment plus de lecteur CD.",
  },
  {
    id: "abattant",
    title: "Un abattant de toilettes",
    roast: "Ni la bonne taille, ni la bonne couleur. Absolument aucune raison d'offrir ça.",
  },
  {
    id: "stylo-pub",
    title: "Un stylo publicitaire gratuit",
    roast: "Celui d'une banque ou d'un garage automobile. Avec encore le logo dessus.",
  },
  {
    id: "piece-puzzle",
    title: "Une seule pièce de puzzle",
    roast: "« Il faut savoir apprécier les petites choses. » Les 999 autres pièces ne sont pas incluses.",
  },
  {
    id: "magnet-limoges",
    title: "Un magnet de frigo de Limoges",
    roast: "« Souvenir de Limoges » alors que tu l'as trouvé à 20 centimes dans un vide-grenier.",
  },
  {
    id: "eponge",
    title: "Une éponge de cuisine",
    roast: "Présentée comme « l'accessoire indispensable pour 2027 ». Même pas un lot de trois.",
  },
  {
    id: "manuel-compta",
    title: "Un manuel de comptabilité de 1998",
    roast: "D'occasion, avec des pages surlignées et des exercices déjà corrigés.",
  },
  {
    id: "confiture-vide",
    title: "Un pot de confiture vide",
    roast: "Avec écrit « Air frais des Alpes » sur un bout de papier collé dessus.",
  },
  {
    id: "ticket-caisse",
    title: "Un ticket de caisse de tes propres courses",
    roast: "Dans une enveloppe, avec ce mot : « Cette année, je t'offre le souvenir d'un moment partagé. »",
  },
];

/** Fisher–Yates copy of the deck. */
export function shuffleDeck(gifts: TrollGift[] = TROLL_GIFTS): TrollGift[] {
  const deck = [...gifts];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
