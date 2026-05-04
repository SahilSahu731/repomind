import { create } from "zustand";
import type {
  RepoInfo,
  AnalysisResult,
  AnalysisProgress,
  ChatMessage,
  UserInfo,
} from "../../../shared/types";

type Tab = "overview" | "architecture" | "graph" | "guide" | "chat" | "files" | "compare";

interface AppState {
  /* ─── Current Repo ─── */
  currentRepo: RepoInfo | null;
  setCurrentRepo: (repo: RepoInfo | null) => void;

  /* ─── Analysis ─── */
  analysis: AnalysisResult | null;
  setAnalysis: (analysis: AnalysisResult | null) => void;

  progress: AnalysisProgress | null;
  setProgress: (progress: AnalysisProgress | null) => void;

  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;

  /* ─── UI ─── */
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  /* ─── Auth ─── */
  user: UserInfo | null;
  isLoggedIn: boolean;
  setUser: (user: UserInfo | null) => void;
  setIsLoggedIn: (v: boolean) => void;

  /* ─── Chat ─── */
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  /* ─── Actions ─── */
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentRepo: null,
  setCurrentRepo: (repo) => set({ currentRepo: repo }),

  analysis: null,
  setAnalysis: (analysis) => set({ analysis, isAnalyzing: false, error: null }),

  progress: null,
  setProgress: (progress) => set({ progress }),

  isAnalyzing: false,
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),

  error: null,
  setError: (error) => set({ error, isAnalyzing: false }),

  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),

  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setIsLoggedIn: (v) => set({ isLoggedIn: v }),

  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  reset: () =>
    set({
      analysis: null,
      progress: null,
      isAnalyzing: false,
      error: null,
      activeTab: "overview",
      chatMessages: [],
    }),
}));
