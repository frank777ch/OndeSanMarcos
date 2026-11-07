import {
  GitHubRelease,
  fetchLatestApkRelease,
  isNewerThanInstalled,
  parseVersionCode,
  pickLatestApkRelease,
} from "../appRelease";

function release(overrides: Partial<GitHubRelease> = {}): GitHubRelease {
  const tag = overrides.tag_name ?? "app-v5";
  return {
    tag_name: tag,
    name: `OndeSanMarcos ${tag}`,
    body: "notas",
    html_url: `https://github.com/x/y/releases/tag/${tag}`,
    draft: false,
    prerelease: false,
    assets: [
      {
        name: "ondesanmarcos.apk",
        browser_download_url: `https://github.com/x/y/releases/download/${tag}/ondesanmarcos.apk`,
      },
    ],
    ...overrides,
  };
}

describe("parseVersionCode", () => {
  it("lee el número de tags app-v<N>", () => {
    expect(parseVersionCode("app-v12")).toBe(12);
  });

  it("ignora otros tags", () => {
    expect(parseVersionCode("v1.0.0")).toBeNull();
    expect(parseVersionCode("app-v")).toBeNull();
    expect(parseVersionCode("backend-v3")).toBeNull();
  });
});

describe("pickLatestApkRelease", () => {
  it("elige el versionCode más alto, no el más reciente en la lista", () => {
    const latest = pickLatestApkRelease([
      release({ tag_name: "app-v3" }),
      release({ tag_name: "app-v10" }),
      release({ tag_name: "app-v7" }),
    ]);
    expect(latest?.versionCode).toBe(10);
    expect(latest?.apkUrl).toContain("app-v10");
  });

  it("descarta borradores, pre-releases, tags ajenos y releases sin APK", () => {
    const latest = pickLatestApkRelease([
      release({ tag_name: "app-v20", draft: true }),
      release({ tag_name: "app-v19", prerelease: true }),
      release({ tag_name: "v99" }),
      release({ tag_name: "app-v18", assets: [] }),
      release({ tag_name: "app-v4" }),
    ]);
    expect(latest?.versionCode).toBe(4);
  });

  it("devuelve null si no hay ninguno válido", () => {
    expect(pickLatestApkRelease([])).toBeNull();
  });
});

describe("isNewerThanInstalled", () => {
  const latest = pickLatestApkRelease([release({ tag_name: "app-v8" })]);

  it("avisa solo si el release es mayor que lo instalado", () => {
    expect(isNewerThanInstalled("7", latest)).toBe(true);
    expect(isNewerThanInstalled("8", latest)).toBe(false);
    expect(isNewerThanInstalled("9", latest)).toBe(false);
  });

  it("no avisa si no se puede leer la versión instalada", () => {
    expect(isNewerThanInstalled(null, latest)).toBe(false);
    expect(isNewerThanInstalled("abc", latest)).toBe(false);
    expect(isNewerThanInstalled("7", null)).toBe(false);
  });
});

describe("fetchLatestApkRelease", () => {
  it("consulta la API de GitHub del repo indicado", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [release({ tag_name: "app-v2" })],
    });
    const latest = await fetchLatestApkRelease("dueño/repo", fetchMock as never);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/repos/dueño/repo/releases?per_page=20",
    );
    expect(latest?.versionCode).toBe(2);
  });

  it("devuelve null si GitHub responde con error", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false });
    expect(await fetchLatestApkRelease("a/b", fetchMock as never)).toBeNull();
  });
});
