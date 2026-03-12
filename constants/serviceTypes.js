/**
 * Service types with optional keywords for suggestion matching (e.g. "cleaning" → Domestic Assistance).
 */
export const SERVICE_TYPES = [
  'Personal Care',
  'Domestic Assistance',
  'Community Access',
  'Respite Care',
  'Assistance with Daily Life',
  'Transport',
  'Improved Health and Wellbeing',
  'Improved Daily Living',
];

/** Keywords per service type for search/suggestions (lowercase). */
const SERVICE_KEYWORDS = {
  'Personal Care': ['personal', 'care', 'hygiene', 'showering', 'dressing', 'mobility'],
  'Domestic Assistance': ['domestic', 'cleaning', 'housekeeping', 'house', 'housework', 'laundry', 'meal'],
  'Community Access': ['community', 'access', 'social', 'outings', 'shopping', 'appointments'],
  'Respite Care': ['respite', 'break', 'carer', 'caregiver'],
  'Assistance with Daily Life': ['daily', 'life', 'living', 'routine', 'support'],
  'Transport': ['transport', 'travel', 'drive', 'driving', 'lift', 'taxi'],
  'Improved Health and Wellbeing': ['health', 'wellbeing', 'exercise', 'fitness', 'therapy'],
  'Improved Daily Living': ['daily living', 'skills', 'independence'],
};

/**
 * Returns service types that match the query (label or keywords, case-insensitive).
 */
export function getServiceTypeSuggestions(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [...SERVICE_TYPES];
  return SERVICE_TYPES.filter((label) => {
    if (label.toLowerCase().includes(q)) return true;
    const keywords = SERVICE_KEYWORDS[label];
    return keywords && keywords.some((k) => k.includes(q) || q.includes(k));
  });
}
