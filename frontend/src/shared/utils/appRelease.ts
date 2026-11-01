/**
 * Lógica pura para detectar APKs nuevos publicados como GitHub Releases.
 *
 * Convención (la crea .github/workflows/app-release.yml):
 *   - tag `app-v<versionCode>`, p. ej. `app-v7`
 *   - un asset `.apk` adjunto
 *
 * El `versionCode` de Android sube en cada build, así que comparar números
 * basta para saber si el APK publicado es más nuevo que el instalado.
 */

const TAG_PATTERN = /^app-v(\d+)$/;

/** Subconjunto de la respuesta de GET /repos/{owner}/{repo}/releases. */
export type GitHubRelease = {
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; browser_download_url: string }[];
};

export type ApkRelease = {
  versionCode: number;
  tag: string;
  name: string;
  notes: string;
  apkUrl: string;
  pageUrl: string;
};

export function parseVersionCode(tag: string): number | null {
  const match = TAG_PATTERN.exec(tag);
  return match ? Number(match[1]) : null;
}

/** El release de APK con el versionCode más alto (ignora borradores y pre-releases). */
export function pickLatestApkRelease(
  releases: GitHubRelease[],
): ApkRelease | null {
  let latest: ApkRelease | null = null;
  for (const release of releases) {
    if (release.draft || release.prerelease) continue;
    const versionCode = parseVersionCode(release.tag_name);
    if (versionCode === null) continue;
    const apk = release.assets.find((a) => a.name.toLowerCase().endsWith(".apk"));
    if (!apk) continue;
    if (latest === null || versionCode > latest.versionCode) {
      latest = {
        versionCode,
        tag: release.tag_name,
        name: release.name ?? release.tag_name,
        notes: release.body ?? "",
        apkUrl: apk.browser_download_url,
        pageUrl: release.html_url,
      };
    }
  }
  return latest;
}

/**
 * `installed` es Application.nativeBuildVersion (string en Android). Si no se
 * puede leer, no se avisa: mejor no molestar que mostrar un aviso falso.
 */
export function isNewerThanInstalled(
  installed: string | null | undefined,
  release: ApkRelease | null,
): release is ApkRelease {
  if (!release || installed == null) return false;
  const current = Number(installed);
  if (!Number.isFinite(current)) return false;
  return release.versionCode > current;
}

export async function fetchLatestApkRelease(
  repo: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ApkRelease | null> {
  const response = await fetchImpl(
    `https://api.github.com/repos/${repo}/releases?per_page=20`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!response.ok) return null;
  const releases = (await response.json()) as GitHubRelease[];
  return pickLatestApkRelease(releases);
}
