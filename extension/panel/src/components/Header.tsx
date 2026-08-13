import { ExternalLink, LogIn, LogOut } from "lucide-react";
import { API_BASE_URL } from "../../../shared/types";
import { useStore } from "../store";
import { BrandMark } from "./BrandMark";

export function Header() {
  const { currentRepo, isLoggedIn, user } = useStore();
  const initial = (user?.name || user?.email || "R").charAt(0).toUpperCase();

  return (
    <header className="app-header">
      <div className="header-primary">
        <a
          className="brand"
          href={API_BASE_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Open RepoMind website"
        >
          <BrandMark className="brand-mark" />
          <span>RepoMind</span>
        </a>

        {isLoggedIn && user ? (
          <div className="account-summary" title={user.email}>
            {user.image ? (
              // This is a Vite-built extension, so next/image is unavailable.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="account-avatar" />
            ) : (
              <span className="account-avatar account-initial">{initial}</span>
            )}
            <span className="account-copy">
              <strong>{user.name || "Account"}</strong>
              <small>{user.creditsRemaining} credits</small>
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Disconnect RepoMind account"
              onClick={() => chrome.runtime.sendMessage({ type: "LOGOUT", payload: null })}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="button button-quiet button-small"
            onClick={() => chrome.runtime.sendMessage({ type: "LOGIN", payload: null })}
          >
            <LogIn size={14} />
            Sign in
          </button>
        )}
      </div>

      <div className="header-context">
        <span className={`status-dot ${currentRepo ? "status-dot-ready" : ""}`} />
        <div className="repo-breadcrumb">
          <span>{currentRepo ? "Repository detected" : "Waiting for GitHub"}</span>
          <strong>
            {currentRepo ? `${currentRepo.owner}/${currentRepo.repo}` : "Open a public repository"}
          </strong>
        </div>
        {currentRepo ? (
          <a
            className="header-repo-link"
            href={currentRepo.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open repository on GitHub"
          >
            <span>{currentRepo.branch}</span>
            <ExternalLink size={12} />
          </a>
        ) : null}
      </div>
    </header>
  );
}
