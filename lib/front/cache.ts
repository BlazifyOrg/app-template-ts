import createCache from "@emotion/cache";

export function createEmotionCache() {
  let insertionPoint;
  const isBrowser = typeof document !== "undefined";

  if (isBrowser) {
    const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]'
    );
    insertionPoint = emotionInsertionPoint ?? undefined;
  }

  return createCache({ key: "mui-style", insertionPoint });
}
