/**
 * URL for a file in /public that respects the deployment base path — "/" in
 * development, "/SENSAN-INDIA-PVT-LMD/" on GitHub Pages (set via BASE_PATH at build).
 */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/** Same, for every URL in a srcset string ("a.avif 800w, b.avif 1200w"). */
export const assetSrcSet = (srcset: string) =>
  srcset
    .split(',')
    .map((entry) => {
      const [url, descriptor] = entry.trim().split(/\s+/);
      return descriptor ? `${asset(url)} ${descriptor}` : asset(url);
    })
    .join(', ');
