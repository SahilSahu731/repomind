import { useEffect } from "react";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { LoadingState } from "./components/LoadingState";
import { OverviewCard } from "./components/OverviewCard";
import { ArchitectureView } from "./components/ArchitectureView";
import { DependencyGraph } from "./components/DependencyGraph";
import { OnboardingGuide } from "./components/OnboardingGuide";
import { ChatInterface } from "./components/ChatInterface";
import { FileExplorer } from "./components/FileExplorer";
import { CompareView } from "./components/CompareView";
import { Search, BrainCircuit, GitFork, Star, Code2, AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import type { Message } from "../../shared/types";

const TABS = [
  { id: "overview" as const, label: "Overview", icon: "📊" },
  { id: "architecture" as const, label: "Architecture", icon: "🏗️" },
  { id: "graph" as const, label: "Graph", icon: "🕸️" },
  { id: "guide" as const, label: "Guide", icon: "📖" },
  { id: "chat" as const, label: "Chat", icon: "💬" },
  { id: "files" as const, label: "Files", icon: "📁" },
  { id: "compare" as const, label: "Compare", icon: "🔀" },
];

export default function App() {
  const {
    currentRepo,
    setCurrentRepo,
    analysis,
    setAnalysis,
    progress,
    setProgress,
    isAnalyzing,
    setIsAnalyzing,
    error,
    setError,
    activeTab,
    setActiveTab,
    setUser,
    isLoggedIn,
    setIsLoggedIn,
  } = useStore();

  /* ─── Bootstrap: get current repo + auth from background ─── */
  useEffect(() => {
    // Get cached state
    chrome.runtime.sendMessage(
      { type: "GET_CACHED_ANALYSIS", payload: null },
      (response) => {
        if (response?.repo) setCurrentRepo(response.repo);
        if (response?.analysis) setAnalysis(response.analysis);
      }
    );

    // Get auth
    chrome.runtime.sendMessage(
      { type: "GET_AUTH", payload: null },
      (response) => {
        if (response?.isLoggedIn) {
          setIsLoggedIn(true);
          if (response.user) setUser(response.user);
        }
      }
    );
  }, []);

  /* ─── Listen for messages from background ─── */
  useEffect(() => {
    const handler = (message: Message) => {
      switch (message.type) {
        case "REPO_DETECTED":
          setCurrentRepo(message.payload as typeof currentRepo);
          break;

        case "ANALYSIS_PROGRESS":
          setIsAnalyzing(true);
          setProgress(message.payload as typeof progress);
          break;

        case "ANALYSIS_COMPLETE":
          setAnalysis(message.payload as typeof analysis);
          setIsAnalyzing(false);
          break;

        case "ANALYSIS_ERROR":
          setError((message.payload as { error: string }).error);
          setIsAnalyzing(false);
          break;

        case "AUTH_STATUS": {
          const auth = message.payload as { isLoggedIn: boolean; user?: typeof useStore.getState extends () => infer S ? S extends { user: infer U } ? U : never : never };
          setIsLoggedIn(auth.isLoggedIn);
          if (auth.user) setUser(auth.user);
          break;
        }
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  /* ─── Render ─── */

  // No repo detected
  if (!currentRepo) {
    return (
      <div className="app-empty">
        <Header />
        <div style={{ padding: "var(--space-xl)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)" }}>
          <div className="animate-float" style={{ padding: "var(--space-xl)", background: "var(--bg-card)", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-glow)", marginBottom: "var(--space-lg)", border: "1px solid var(--border-accent)" }}>
            <Search size={48} color="var(--accent-primary)" />
          </div>
          <h2 className="text-gradient">No Repository Found</h2>
          <p style={{ marginTop: "var(--space-sm)", maxWidth: "250px" }}>
            Navigate to any GitHub repository and RepoMind will automatically detect it.
          </p>
        </div>
      </div>
    );
  }

  // Currently analyzing
  if (isAnalyzing && progress) {
    return (
      <div className="app-loading">
        <Header />
        <LoadingState progress={progress} repo={currentRepo} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app-error">
        <Header />
        <div style={{ padding: "var(--space-xl)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)" }}>
          <div className="glass" style={{ padding: "var(--space-xl)", width: "100%", maxWidth: "300px" }}>
            <div className="animate-pulse-glow" style={{ width: "64px", height: "64px", borderRadius: "var(--radius-full)", background: "rgba(248, 81, 73, 0.1)", border: "1px solid rgba(248, 81, 73, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-lg)", animation: "pulse-glow-danger 3s ease-in-out infinite" }}>
              <AlertTriangle size={32} color="var(--danger)" />
            </div>
            <h2>Analysis Failed</h2>
            <p style={{ marginTop: "var(--space-sm)", color: "var(--text-secondary)", fontSize: "0.9rem", wordBreak: "break-word" }}>{error}</p>
            <button
              className="btn btn--primary"
              style={{ marginTop: "var(--space-lg)", width: "100%" }}
              onClick={() => {
                if (!isLoggedIn) {
                  chrome.runtime.sendMessage({ type: "LOGIN" });
                  return;
                }
                setError(null);
                setIsAnalyzing(true);
                chrome.runtime.sendMessage({
                  type: "START_ANALYSIS",
                  payload: currentRepo,
                });
              }}
            >
              {!isLoggedIn ? <><LogIn size={16} /> Login to Continue</> : <><RefreshCw size={16} /> Retry Analysis</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No analysis yet — show scan prompt
  if (!analysis) {
    return (
      <div className="app-prompt">
        <Header />
        <div style={{ padding: "var(--space-xl)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)" }}>
          <div className="animate-float" style={{ padding: "var(--space-lg)", background: "var(--accent-light)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-glow)", marginBottom: "var(--space-lg)", border: "1px solid var(--border-accent)" }}>
            <BrainCircuit size={56} color="var(--accent-primary)" />
          </div>
          <h2 style={{ wordBreak: "break-word" }}>
            {currentRepo.owner}/<span className="text-gradient">{currentRepo.repo}</span>
          </h2>
          {currentRepo.description && (
            <p style={{ marginTop: "var(--space-sm)", maxWidth: "280px", margin: "var(--space-sm) auto 0", fontSize: "0.9rem" }}>
              {currentRepo.description}
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "center", marginTop: "var(--space-md)", flexWrap: "wrap" }}>
            {currentRepo.stars !== undefined && <span className="pill glass"><Star size={12} color="var(--warning)" /> {currentRepo.stars?.toLocaleString()}</span>}
            {currentRepo.forks !== undefined && <span className="pill glass"><GitFork size={12} color="var(--text-secondary)" /> {currentRepo.forks?.toLocaleString()}</span>}
            {currentRepo.language && <span className="pill pill--accent glass"><Code2 size={12} /> {currentRepo.language}</span>}
          </div>
          <button
            className="btn btn--primary"
            style={{ marginTop: "var(--space-xl)", padding: "12px 24px", fontSize: "1rem" }}
            onClick={() => {
              if (!isLoggedIn) {
                chrome.runtime.sendMessage({ type: "LOGIN" });
                return;
              }
              setIsAnalyzing(true);
              chrome.runtime.sendMessage({
                type: "START_ANALYSIS",
                payload: currentRepo,
              });
            }}
          >
            {!isLoggedIn ? <><LogIn size={18} /> Login to Scan</> : <><Search size={18} /> Scan Repository</>}
          </button>
        </div>
      </div>
    );
  }

  // Full results view
  return (
    <div className="app-results">
      <Header />

      {/* Tab Bar */}
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "var(--space-lg)" }}>
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "overview" && <OverviewCard analysis={analysis} repo={currentRepo} />}
          {activeTab === "architecture" && <ArchitectureView analysis={analysis} />}
          {activeTab === "graph" && <DependencyGraph graph={analysis.dependencyGraph} />}
          {activeTab === "guide" && <OnboardingGuide guide={analysis.startGuide} />}
          {activeTab === "chat" && <ChatInterface repoId={analysis.repoId} />}
          {activeTab === "files" && <FileExplorer analysis={analysis} />}
          {activeTab === "compare" && <CompareView />}
        </div>
      </div>
    </div>
  );
}
