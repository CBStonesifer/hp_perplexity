"use client";

import { useState, FormEvent } from "react";
import ReactMarkdown from "react-markdown";

interface Source {
  description: string;
  link: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [answer, setAnswer] = useState("");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"idle" | "sources" | "analyzing">("idle");
  const [error, setError] = useState("");

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoadingStage("sources");
    setError("");
    setSources([]);
    setAnswer("");

    try {
      const sourcesResponse = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const sourcesData = await sourcesResponse.json();

      if (!sourcesResponse.ok) {
        throw new Error(sourcesData.error || "Failed to find sources");
      }

      if (!sourcesData.sources || sourcesData.sources.length === 0) {
        setError(sourcesData.message || "No sources found");
        setLoadingStage("idle");
        return;
      }

      setSources(sourcesData.sources);
      setLoadingStage("analyzing");

      const analyzeResponse = await fetch("/api/search/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          sources: sourcesData.sources
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(analyzeData.error || "Failed to analyze sources");
      }

      setAnswer(analyzeData.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingStage("idle");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <main className="relative w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            PERPLEXITY CLONE
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <div className="h-1 w-1 rounded-full bg-cyan-500" />
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          </div>
          <p className="text-xl text-cyan-100/70 font-light tracking-wide">
            Search anything and AI will return a well-researched response.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-6 mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-30 group-hover:opacity-50 blur transition duration-300" />
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                disabled={loadingStage !== "idle"}
                className="w-full rounded-2xl border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl px-8 py-5 text-lg text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300 disabled:opacity-50"
              />
              {loadingStage !== "idle" && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm text-cyan-400/70">
                    {loadingStage === "sources" ? "Finding sources..." : "Analyzing sources..."}
                  </span>
                  <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              type="submit"
              disabled={loadingStage !== "idle" || !query.trim()}
              className="relative px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:hover:shadow-none"
            >
              <span className="relative z-10">
                {loadingStage === "sources" ? "Finding Sources..." : loadingStage === "analyzing" ? "Analyzing..." : "Execute Search"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-8 p-5 rounded-xl bg-red-950/40 backdrop-blur-xl border border-red-500/30 text-red-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {(sources.length > 0 || answer) && (
          <div className="mt-12 space-y-6 animate-in fade-in duration-500">
            {answer && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur" />
                <div className="relative p-6 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-1 rounded-full bg-cyan-400" />
                    <h2 className="text-lg font-semibold text-cyan-400 tracking-wide uppercase text-sm">
                      Analysis Result
                    </h2>
                  </div>
                  <div className="text-cyan-50/90 leading-relaxed prose prose-invert prose-cyan max-w-none prose-headings:text-cyan-300 prose-strong:text-cyan-200 prose-a:text-cyan-400 prose-code:text-cyan-300">
                    <ReactMarkdown>{answer}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {sources.length > 0 && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur" />
                <div className="relative rounded-xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20">
                  <button
                    onClick={() => setSourcesOpen(!sourcesOpen)}
                    className="w-full p-5 flex items-center justify-between hover:bg-cyan-500/5 transition-colors rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-cyan-400" />
                      <h3 className="text-lg font-semibold text-cyan-400 tracking-wide uppercase text-sm">
                        Sources ({sources.length})
                      </h3>
                    </div>
                    <div className={`transform transition-transform duration-300 ${sourcesOpen ? "rotate-180" : ""}`}>
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {sourcesOpen && (
                    <div className="px-5 pb-5 space-y-4 animate-in fade-in duration-300">
                      {sources.map((source, index) => (
                        <div
                          key={index}
                          id={`source-${index + 1}`}
                          className="group relative"
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 rounded-lg blur transition duration-300" />
                          <div className="relative p-4 rounded-lg bg-slate-900/60 border border-cyan-500/20 group-hover:border-cyan-400/40 transition-all duration-300">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-cyan-50/90 mb-2 leading-relaxed">
                                  {source.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
                                  <a
                                    href={source.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400/70 hover:text-cyan-400 truncate font-mono transition-colors"
                                  >
                                    {source.link}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
