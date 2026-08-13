import { useEffect } from "react";
import {
  AlertTriangle,
  Blocks,
  BookOpenText,
  Files,
  GitCompareArrows,
  GitFork,
  GitGraph,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import type {
  AnalysisProgress,
  AnalysisResult,
  Message,
  RepoInfo,
  UserInfo,
} from "../../shared/types";
import { useStore, type Tab } from "./store";
import { Header } from "./components/Header";
import { LoadingState } from "./components/LoadingState";
import { OverviewCard } from "./components/OverviewCard";
import { ArchitectureView } from "./components/ArchitectureView";
import { DependencyGraph } from "./components/DependencyGraph";
import { OnboardingGuide } from "./components/OnboardingGuide";
import { ChatInterface } from "./components/ChatInterface";
import { FileExplorer } from "./components/FileExplorer";
import { CompareView } from "./components/CompareView";

const TABS: Array<{
  id: Tab;
  label: string;
  number: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Overview", number: "01", icon: LayoutDashboard },
  { id: "architecture", label: "Architecture", number: "02", icon: Blocks },
  { id: "graph", label: "Connections", number: "03", icon: GitGraph },
  { id: "files", label: "Files", number: "04", icon: Files },
  { id: "guide", label: "Onboarding", number: "05", icon: BookOpenText },
  { id: "chat", label: "Ask", number: "06", icon: MessageSquareText },
  { id: "compare", label: "Compare", number: "07", icon: GitCompareArrows },
];

interface ContextPayload {
  repo: RepoInfo | null;
  analysis?: AnalysisResult | null;
  progress?: AnalysisProgress | null;
}

export default function App() {
  const {
    currentRepo,
    analysis,
    progress,
    isAnalyzing,
    error,
    activeTab,
    isLoggedIn,
    authPending,
    setContext,
    setAnalysis,
    setProgress,
    setIsAnalyzing,
    setError,
    setActiveTab,
    setUser,
    setIsLoggedIn,
    setAuthPending,
  } = useStore();

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_CONTEXT", payload: null }, (response) => {
      if (chrome.runtime.lastError) return;
      setContext(response?.repo ?? null, response?.analysis ?? null);
      if (response?.progress) setProgress(response.progress);
      else if (response?.analysis) setAnalysis(response.analysis);
    });

    chrome.runtime.sendMessage({ type: "GET_AUTH", payload: null }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.isLoggedIn && response.user) setUser(response.user as UserInfo);
      else setIsLoggedIn(false);
    });
  }, [setAnalysis, setContext, setIsLoggedIn, setProgress, setUser]);

  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = window.setInterval(() => {
      chrome.runtime.sendMessage({ type: "POLL_ANALYSIS", payload: null });
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    const handler = (message: Message) => {
      switch (message.type) {
        case "CONTEXT_UPDATED": {
          const payload = message.payload as ContextPayload;
          setContext(payload.repo, payload.analysis ?? null);
          if (payload.progress) setProgress(payload.progress);
          else if (payload.analysis) setAnalysis(payload.analysis);
          break;
        }
        case "REPO_DETECTED":
          setContext(message.payload as RepoInfo);
          break;
        case "ANALYSIS_PROGRESS":
          setProgress(message.payload as typeof progress);
          break;
        case "ANALYSIS_COMPLETE":
          setAnalysis(message.payload as AnalysisResult);
          break;
        case "ANALYSIS_ERROR":
        case "AUTH_ERROR":
          setError((message.payload as { error: string }).error);
          setAuthPending(false);
          break;
        case "AUTH_STATUS": {
          const payload = message.payload as { isLoggedIn: boolean; user?: UserInfo };
          if (payload.user) setUser(payload.user);
          else {
            setIsLoggedIn(payload.isLoggedIn);
            if (!payload.isLoggedIn) {
              const repo = useStore.getState().currentRepo;
              setContext(repo, null);
            }
          }
          setAuthPending(false);
          break;
        }
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [progress, setAnalysis, setAuthPending, setContext, setError, setIsLoggedIn, setProgress, setUser]);

  function signIn(): void {
    setAuthPending(true);
    setError(null);
    chrome.runtime.sendMessage({ type: "LOGIN", payload: null }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        setAuthPending(false);
        setError(response?.error ?? "Sign-in could not be started");
      }
    });
  }

  function analyze(): void {
    if (!currentRepo) return;
    if (!isLoggedIn) {
      signIn();
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    chrome.runtime.sendMessage(
      { type: "START_ANALYSIS", payload: currentRepo },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          setError(response?.error ?? "Analysis could not be started");
        }
      }
    );
  }

  return (
    <div className="app-shell">
      <Header />

      {!currentRepo ? (
        <main className="state-page state-page-empty">
          <p className="eyebrow">Waiting for a repository</p>
          <h1>Open a GitHub repository to begin.</h1>
          <p className="state-lede">
            RepoMind works with public repositories and never changes your code.
          </p>
          <div className="state-route" aria-label="How RepoMind works">
            <span><b>01</b> Open</span>
            <span><b>02</b> Review</span>
            <span><b>03</b> Analyze</span>
          </div>
          <a className="button button-primary" href="https://github.com/explore" target="_blank" rel="noreferrer">
            <Search size={16} /> Browse GitHub
          </a>
        </main>
      ) : isAnalyzing && progress ? (
        <LoadingState progress={progress} repo={currentRepo} />
      ) : error ? (
        <main className="state-page state-page-error">
          <div className="state-icon state-icon-error"><AlertTriangle size={25} /></div>
          <p className="eyebrow">Analysis interrupted</p>
          <h1>RepoMind couldn’t complete that request.</h1>
          <p className="state-lede">{error}</p>
          <button className="button button-primary" type="button" onClick={isLoggedIn ? analyze : signIn} disabled={authPending}>
            {isLoggedIn ? <RefreshCw size={16} /> : <LockKeyhole size={16} />}
            {authPending ? "Opening sign in…" : isLoggedIn ? "Try again" : "Sign in to continue"}
          </button>
        </main>
      ) : !analysis ? (
        <main className="ready-page">
          <section className="ready-hero">
            <p className="eyebrow">Ready to analyze</p>
            <h1>{currentRepo.owner}/<span>{currentRepo.repo}</span></h1>
            <p className="state-lede">
              {currentRepo.description || "Build a legible map of this repository before you change it."}
            </p>
          </section>

          <section className="repo-stat-grid" aria-label="Repository details">
            <div><Star size={15} /><strong>{currentRepo.stars?.toLocaleString() ?? "—"}</strong><span>Stars</span></div>
            <div><GitFork size={15} /><strong>{currentRepo.forks?.toLocaleString() ?? "—"}</strong><span>Forks</span></div>
            <div><Blocks size={15} /><strong>{currentRepo.language ?? "Mixed"}</strong><span>Primary stack</span></div>
          </section>

          <section className="ready-action">
            <button className="button button-primary button-large" type="button" onClick={analyze} disabled={authPending}>
              {isLoggedIn ? <Search size={17} /> : <LockKeyhole size={17} />}
              {authPending ? "Opening sign in…" : isLoggedIn ? "Analyze repository" : "Sign in to analyze"}
            </button>
            <p><ShieldCheck size={13} /> Public repositories · Read-only analysis</p>
          </section>
        </main>
      ) : (
        <main className="results-shell">
          <nav className="report-index" aria-label="Report sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-number">{tab.number}</span>
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <section className="report-content" key={activeTab}>
            {activeTab === "overview" && <OverviewCard analysis={analysis} repo={currentRepo} />}
            {activeTab === "architecture" && <ArchitectureView analysis={analysis} />}
            {activeTab === "graph" && <DependencyGraph graph={analysis.dependencyGraph} />}
            {activeTab === "guide" && <OnboardingGuide guide={analysis.startGuide} />}
            {activeTab === "chat" && <ChatInterface repoId={analysis.repoId} />}
            {activeTab === "files" && <FileExplorer analysis={analysis} />}
            {activeTab === "compare" && <CompareView />}
          </section>
        </main>
      )}
    </div>
  );
}
