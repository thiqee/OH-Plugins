export function appendTokenParam(url, token) {
  const value = String(token || "");
  if (!value) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${new URLSearchParams({ token: value })}`;
}
