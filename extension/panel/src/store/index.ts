import { create } from "zustand";
import type {
  AnalysisProgress,
  AnalysisResult,
  ChatMessage,
  RepoInfo,
  UserInfo,
} from "../../../shared/types";
import { repoIdentityKey } from "../../../shared/github";

export type Tab =
  | "overview"
  | "architecture"
  | "graph"
  | "guide"
  | "chat"
  | "files"
  | "compare";

interface AppState {
  currentRepo: RepoInfo | null;
  analysis: AnalysisResult | null;
  progress: AnalysisProgress | null;
  isAnalyzing: boolean;
  error: string | null;
  activeTab: Tab;
  user: UserInfo | null;
  isLoggedIn: boolean;
  authPending: boolean;
  chatMessages: ChatMessage[];
  setContext: (repo: RepoInfo | null, analysis?: AnalysisResult | null) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setProgress: (progress: AnalysisProgress | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: Tab) => void;
  setUser: (user: UserInfo | null) => void;
  setIsLoggedIn: (value: boolean) => void;
  setAuthPending: (value: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentRepo: null,
  analysis: null,
  progress: null,
  isAnalyzing: false,
  error: null,
  activeTab: "overview",
  user: null,
  isLoggedIn: false,
  authPending: false,
  chatMessages: [],

  setContext: (repo, analysis = null) =>
    set((state) => {
      const previousKey = state.currentRepo ? repoIdentityKey(state.currentRepo) : null;
      const nextKey = repo ? repoIdentityKey(repo) : null;
      const changed = previousKey !== nextKey;

      return {
        currentRepo: repo,
        analysis,
        progress: changed ? null : state.progress,
        isAnalyzing: changed ? false : state.isAnalyzing,
        error: changed ? null : state.error,
        activeTab: changed ? "overview" : state.activeTab,
        chatMessages: changed ? [] : state.chatMessages,
      };
    }),
  setAnalysis: (analysis) => set({ analysis, isAnalyzing: false, error: null, progress: null }),
  setProgress: (progress) => set({ progress, isAnalyzing: Boolean(progress), error: null }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setError: (error) => set({ error, isAnalyzing: false }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setUser: (user) => set((state) => ({
    user,
    isLoggedIn: Boolean(user),
    authPending: false,
    error: user ? null : state.error,
  })),
  setIsLoggedIn: (isLoggedIn) => set((state) => ({
    isLoggedIn,
    user: isLoggedIn ? state.user : null,
    authPending: false,
  })),
  setAuthPending: (authPending) => set({ authPending }),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChat: () => set({ chatMessages: [] }),
  reset: () => set({
    analysis: null,
    progress: null,
    isAnalyzing: false,
    error: null,
    activeTab: "overview",
    chatMessages: [],
  }),
}));
