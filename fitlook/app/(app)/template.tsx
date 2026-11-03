// Re-mounts on every navigation inside the app, so each page fades up gently (220 ms; off with reduced motion).
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
