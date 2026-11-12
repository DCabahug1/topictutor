// Where this tab first opened the app. Imported by the page frame, so it is read
// once on the first page. A later page in the same tab was reached from inside the app.

export const entryPath: string | null =
  typeof window === "undefined" ? null : `${window.location.pathname}${window.location.search}`;
