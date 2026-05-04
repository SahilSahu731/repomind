import { useStore } from "../store";

export function Header() {
  const { currentRepo, isLoggedIn, user } = useStore();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-md) var(--space-lg)",
        borderBottom: "1px solid var(--border-primary)",
        background: "var(--bg-secondary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <span style={{ fontSize: "1.2rem" }}>🧠</span>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          RepoMind
        </span>
        {currentRepo && (
          <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", marginLeft: "var(--space-xs)" }}>
            {currentRepo.owner}/{currentRepo.repo}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        {isLoggedIn && user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <img
              src={user.image}
              alt={user.name}
              style={{ width: 22, height: 22, borderRadius: "50%" }}
            />
            <span className="pill pill--accent" style={{ fontSize: "0.7rem" }}>
              {user.plan}
            </span>
          </div>
        ) : (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => chrome.runtime.sendMessage({ type: "LOGIN", payload: null })}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
