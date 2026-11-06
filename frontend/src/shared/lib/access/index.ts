export function accessRedirect(status: number | undefined, authenticated: boolean, pathname: string): "/" | "/login" | null {
  if (status !== 401 && status !== 403) return null;

  if (status === 403 && authenticated) return pathname === "/" ? null : "/";

  const protectedPage = /^\/(admin|profile|games\/ai)(\/|$)/.test(pathname);

  return protectedPage ? "/login" : null;
}
