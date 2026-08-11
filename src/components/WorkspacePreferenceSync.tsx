"use client";

import { useEffect } from "react";
import {
  readWorkspacePreferences,
  WORKSPACE_PREFERENCES_EVENT,
  type WorkspacePreferences,
} from "@/lib/workspacePreferences";

export function WorkspacePreferenceSync() {
  useEffect(() => {
    const apply = (preferences: WorkspacePreferences) => {
      document.documentElement.classList.toggle("reduce-workspace-motion", preferences.reduceMotion);
    };
    const sync = () => apply(readWorkspacePreferences());
    const syncFromEvent = (event: Event) => {
      apply((event as CustomEvent<WorkspacePreferences>).detail ?? readWorkspacePreferences());
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(WORKSPACE_PREFERENCES_EVENT, syncFromEvent);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WORKSPACE_PREFERENCES_EVENT, syncFromEvent);
    };
  }, []);

  return null;
}
