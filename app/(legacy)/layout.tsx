import { ThemeButton } from "@/components/almanac/ThemeButton";

// The pre-Almanac pages (dashboard, topics, chapters, tests, profile, old auth).
// They keep their shadcn look until the real data layer replaces them.
export default function LegacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex h-screen flex-col overflow-y-auto bg-background font-sans text-foreground">
      <div className="fixed bottom-4 right-4 z-50 rounded-md border bg-card">
        <ThemeButton className="text-foreground!" />
      </div>
      {children}
    </div>
  );
}
