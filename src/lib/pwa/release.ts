// Values are injected once by next.config.ts, shared by client and static routes.
export const appRelease = {
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "",
  build: process.env.NEXT_PUBLIC_APP_BUILD ?? "",
};
export function releaseLabel(release: {version:string;build:string}) {
  return release.version && release.build ? `v${release.version} · ${release.build.slice(0, 12)}` : "Versão não identificada";
}
