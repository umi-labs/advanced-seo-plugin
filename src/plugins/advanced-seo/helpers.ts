export const resolveMeta = async (doc: any, { globals }: { globals?: any } = {}) => {
  const globalDefaults = globals || {};
  const meta = doc?.meta || {};

  const merged = {
    title: meta.title || globalDefaults.defaultTitle || doc.title || '',
    description: meta.description || globalDefaults.defaultDescription || doc.description || '',
    image: (meta.image && meta.image.url) || (globalDefaults.defaultImages && globalDefaults.defaultImages[0]) || null,
    jsonLd: meta.jsonLd || null,
    alternates: meta.alternates || [],
  };

  return merged;
};
