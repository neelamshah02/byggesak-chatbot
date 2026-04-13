import Chat from "@/components/Chat";
import Header from "@/components/Header";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <div className="flex-1 container mx-auto max-w-4xl px-4 py-6">
        <Chat />
      </div>
    </main>
  );
}
