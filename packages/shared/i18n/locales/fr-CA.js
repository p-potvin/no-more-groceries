/**
 * French — Québec (fr-CA) translations
 * Tone: informal/direct, Canadian French conventions
 * Currency symbols stay in English format ($) as per QC convention.
 */
export const frCA = {
  app: {
    name:    'Plus d\'épicerie',
    tagline: 'Intelligence épicerie PC Express — mis à jour quotidiennement',
    eyebrow: 'PC Express · Données du jour',
  },
  nav: {
    deals:   '🏷️ Meilleures offres',
    cart:    '🧺 Panier moyen',
    weekly:  '📅 Panier 7 jours',
    compare: '🗺️ Comparer',
    settings: '⚙️ Paramètres',
  },
  controls: {
    postalCode:     'Code postal',
    store:          'Magasin',
    householdSize:  'Taille du ménage',
    searchStores:   'Chercher des magasins',
    searching:      '…',
    customSize:     'Autre',
    noStoresLoaded: 'Aucun magasin chargé',
  },
  deals: {
    title:      '🏷️ Meilleures offres du jour',
    empty:      'Choisissez un magasin pour voir les offres.',
    noneFound:  'Aucune offre trouvée pour ce magasin aujourd\'hui.',
    loading:    'Analyse des offres du jour…',
    tierLabel:  'Niveau {{tier}}',
  },
  cart: {
    title:          '🧺 Panier hebdomadaire moyen',
    loading:        'Calcul du panier de référence…',
    empty:          'Choisissez un magasin et la taille du ménage.',
    perWeek:        'est. par semaine',
    matched:        '{{pct}}% trouvé',
    substitute:     '↩ substitut',
    unavailable:    'Non disponible',
    household:      '{{n}} personne',
    householdPlural: '{{n}} personnes',
  },
  weekly: {
    title:        '📅 Panier recommandé — 7 jours',
    loading:      'Préparation de votre panier de 7 jours…',
    empty:        'Choisissez un magasin et la taille du ménage.',
    confidence:   'fiabilité {{level}}',
    unavailable:  'Non disponible cette semaine',
    pax:          '{{n}} pers.',
    qty:          'Qté : {{n}}',
  },
  compare: {
    title:      '🗺️ Comparaison des magasins à proximité',
    loading:    'Comparaison des magasins…',
    empty:      'Effectuez une recherche par code postal pour comparer.',
    noneFound:  'Aucun magasin trouvé.',
    perWeek:    'sem.',
    dealScore:  'Score offre',
  },
  refresh: {
    updatedOn: 'Mis à jour le {{date}}',
    stale:     'Données périmées',
  },
  coverage: {
    high:   'élevée',
    medium: 'moyenne',
    low:    'faible',
  },
  error: {
    generic: 'Une erreur s\'est produite. Veuillez réessayer.',
  },
  status: {
    loading: 'Chargement…',
  },
  store: {
    noStore:   '—',
    noBanner:  '—',
    location:  '📍 {{address}}',
  },
};
