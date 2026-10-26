import { ViewTransition, type ReactNode } from "react";

/** Crossfades a tab's content when the tab bar navigates; refreshes and other navigations do not animate. */
export function TabTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={{ tab: "tab-fade", default: "none" }} exit={{ tab: "tab-fade", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}
