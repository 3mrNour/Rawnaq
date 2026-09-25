const BASE = import.meta.env.BASE_URL;

/**
 * Resolve a path inside `public/` against the deploy base.
 *
 * Vite's `base` is './', so BASE_URL is './' and this yields './images/1.png'.
 * That resolves correctly both when the site is served from a domain root
 * ('/images/1.png') and from a GitHub Pages project subpath
 * ('/repo/images/1.png'). Hardcoding a leading slash would break the subpath
 * case, which is why every public asset goes through here.
 */
export function asset(path: string): string {
  return `${BASE}${path.replace(/^\/+/, '')}`;
}
