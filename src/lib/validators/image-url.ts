const IMAGE_EXTENSION_RE =
  /\.(jpe?g|png|gif|webp|svg|bmp|avif|ico)(\?.*)?$/i;

const PROBE_TIMEOUT_MS = 8_000;

export const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/** URLs that look like images by path (works when browser probe is blocked). */
export const isLikelyImageUrl = (value: string): boolean => {
  if (!isHttpUrl(value)) {
    return false;
  }

  try {
    const { pathname, hostname } = new URL(value);
    if (IMAGE_EXTENSION_RE.test(pathname)) {
      return true;
    }
    if (/media-amazon\.com$/i.test(hostname) && /\/images\//i.test(pathname)) {
      return true;
    }
    if (/\.supabase\.co$/i.test(hostname) && /\/storage\/v1\/object\//i.test(pathname)) {
      return true;
    }
    return /\/images?\//i.test(pathname);
  } catch {
    return false;
  }
};

export const probeImageUrl = (
  url: string,
  timeoutMs = PROBE_TIMEOUT_MS,
): Promise<boolean> => {
  if (!isHttpUrl(url)) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      image.src = "";
      resolve(result);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);
    const image = new window.Image();
    image.referrerPolicy = "no-referrer";
    image.onload = (): void => finish(true);
    image.onerror = (): void => finish(false);
    image.src = url;
  });
};

/** Accepts probe success or a well-formed image URL when probe is blocked (CDN hotlinking). */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  const trimmed = url.trim();
  if (!isHttpUrl(trimmed)) {
    return false;
  }

  const likely = isLikelyImageUrl(trimmed);
  const probed = await probeImageUrl(trimmed);

  if (probed) {
    return true;
  }

  return likely;
};

export const IMAGE_URL_VALIDATION_MESSAGE =
  "Enter a valid URL that loads an image (jpg, png, gif, webp, etc.)";
