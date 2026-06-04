const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop";

export const resolveEventImage = (_eventType, imageUrl) => {
  if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("data:"))) {
    return imageUrl;
  }

  return DEFAULT_EVENT_IMAGE;
};
