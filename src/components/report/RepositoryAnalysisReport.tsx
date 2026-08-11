"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clipboard,
  Code2,
  Database,
  FileCode2,
  Layers3,
  Search,
  ShieldCheck,
  TestTube2,
  Workflow,
  Wrench,
  X,
} from "lucide-react";
import type { AnalysisResult } from "@/types";
import type { RepoRow } from "@/lib/supabaseDb";

interface RepositoryAnalysisReportProps {
  repo: RepoRow;
  analysis: AnalysisResult;
}

const reportSections = [
  ["overview", "Overview"],
  ["architecture", "Architecture"],
  ["connections", "Connections"],
  ["files", "Files"],
  ["onboarding", "Onboarding"],
  ["review", "Review"],
] as const;

function formatCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard" }).format(value);
}

function topConnectedFiles(analysis: AnalysisResult) {
  return [...analysis.dependencyGraph.nodes]
    .map((node) => ({ ...node, score: node.inDegree + node.outDegree }))
    .sort((a, b) => b.score - a.score || b.lines - a.lines)
    .slice(0, 12);
}

function nodePosition(index: number, total: number) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 360 + Math.cos(angle) * (index % 2 === 0 ? 270 : 210),
    y: 190 + Math.sin(angle) * (index % 2 === 0 ? 135 : 112),
  };
}

function shortPath(path: string, length = 28): string {
  return path.length > length ? `…${path.slice(-(length - 1))}` : path;
}

function ArchitectureSystemMap({ analysis }: { analysis: AnalysisResult }) {
  const layers = analysis.architecture.layers.slice(0, 4);
  const entryPath = analysis.entryPoints[0]?.path ?? "Repository boundary";
  const coreModule = analysis.architecture.modules[0];
  const coreLabel = coreModule?.name ?? analysis.architecture.pattern;
  const positions =
    layers.length <= 1
      ? [{ x: 310, y: 190 }]
      : layers.length === 2
        ? [{ x: 235, y: 125 }, { x: 410, y: 250 }]
        : layers.length === 3
          ? [{ x: 205, y: 190 }, { x: 365, y: 82 }, { x: 365, y: 290 }]
          : [{ x: 195, y: 190 }, { x: 335, y: 76 }, { x: 335, y: 294 }, { x: 495, y: 190 }];
  const entry = { x: 55, y: 190 };
  const core = { x: 655, y: 190 };

  const edges: Array<[number, number]> = [];
  if (layers.length === 2) edges.push([0, 1]);
  if (layers.length === 3) edges.push([0, 1], [0, 2], [1, 2]);
  if (layers.length >= 4) edges.push([0, 1], [0, 2], [1, 2], [1, 3], [2, 3]);

  return (
    <div className="mt-5 border border-[#292721] bg-[#f2ecdf] p-3 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">System relationship map</p>
        <p className="font-mono text-[8px] text-[#6d675f]">{layers.length} detected {layers.length === 1 ? "layer" : "layers"}</p>
      </div>
      <svg
        viewBox="0 0 720 380"
        className="mt-2 w-full"
        role="img"
        aria-label={`Architecture map from ${entryPath} through ${layers.join(", ")} to ${coreLabel}`}
      >
        <g fill="none" stroke="#292721" strokeOpacity=".5" strokeWidth="1.6">
          {positions[0] ? <line x1={entry.x} y1={entry.y} x2={positions[0].x} y2={positions[0].y} /> : <line x1={entry.x} y1={entry.y} x2={core.x} y2={core.y} />}
          {edges.map(([sourceIndex, targetIndex]) => (
            <line
              key={`${sourceIndex}-${targetIndex}`}
              x1={positions[sourceIndex].x}
              y1={positions[sourceIndex].y}
              x2={positions[targetIndex].x}
              y2={positions[targetIndex].y}
            />
          ))}
          {positions.length ? (
            <>
              {layers.length === 3 ? (
                <>
                  <line x1={positions[1].x} y1={positions[1].y} x2={core.x} y2={core.y} />
                  <line x1={positions[2].x} y1={positions[2].y} x2={core.x} y2={core.y} />
                </>
              ) : (
                <line x1={positions[positions.length - 1].x} y1={positions[positions.length - 1].y} x2={core.x} y2={core.y} />
              )}
            </>
          ) : null}
        </g>

        <circle cx={entry.x} cy={entry.y} r="31" fill="#f7f2e7" stroke="#292721" strokeWidth="1.8" />
        <text x={entry.x} y={entry.y + 3} textAnchor="middle" fill="#292721" fontSize="9" fontFamily="ui-monospace, monospace">ENTRY</text>

        {layers.map((layer, index) => {
          const position = positions[index];
          const fills = ["#d75c3f", "#f7f2e7", "#8b9d82", "#f7f2e7"];
          const radius = index === 0 ? 43 : index === 2 ? 34 : 29;
          const textColor = index === 0 ? "#f7f2e7" : "#292721";
          return (
            <g key={layer}>
              <circle cx={position.x} cy={position.y} r={radius} fill={fills[index]} stroke="#292721" strokeWidth="1.8" />
              <text x={position.x} y={position.y + 3} textAnchor="middle" fill={textColor} fontSize={layer.length > 12 ? "7" : "8"} fontFamily="ui-monospace, monospace">
                {layer.toUpperCase().slice(0, 18)}
              </text>
            </g>
          );
        })}

        <circle cx={core.x} cy={core.y} r="50" fill="#292721" stroke="#292721" strokeWidth="1.8" />
        <text x={core.x} y={core.y + 3} textAnchor="middle" fill="#f7f2e7" fontSize="9" fontFamily="ui-monospace, monospace">CORE</text>
        <text x={entry.x} y={entry.y + 52} textAnchor="middle" fill="#6d675f" fontSize="8" fontFamily="ui-monospace, monospace">START</text>
        <text x={core.x} y={core.y + 72} textAnchor="middle" fill="#6d675f" fontSize="8" fontFamily="ui-monospace, monospace">{shortPath(coreLabel.toUpperCase(), 22)}</text>
      </svg>
      <div className="grid gap-px bg-[#292721]/25 sm:grid-cols-2">
        <div className="min-w-0 bg-[#e8dfcf] px-3 py-2.5">
          <p className="font-mono text-[7px] uppercase tracking-[.13em] text-[#6d675f]">Highest-ranked entry</p>
          <p className="mt-1 truncate font-mono text-[9px] text-[#292721]" title={entryPath}>{entryPath}</p>
        </div>
        <div className="min-w-0 bg-[#e8dfcf] px-3 py-2.5">
          <p className="font-mono text-[7px] uppercase tracking-[.13em] text-[#6d675f]">Primary module</p>
          <p className="mt-1 truncate font-mono text-[9px] text-[#292721]" title={coreLabel}>{coreLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function RepositoryAnalysisReport({ repo, analysis }: RepositoryAnalysisReportProps) {
  const connectedFiles = useMemo(() => topConnectedFiles(analysis), [analysis]);
  const [selectedNodeId, setSelectedNodeId] = useState(connectedFiles[0]?.id ?? "");
  const [fileQuery, setFileQuery] = useState("");
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedNode =
    analysis.dependencyGraph.nodes.find((node) => node.id === selectedNodeId) ?? connectedFiles[0];

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return analysis.dependencyGraph.edges
      .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
      .map((edge) => ({
        direction: edge.source === selectedNode.id ? "imports" : "used by",
        path: edge.source === selectedNode.id ? edge.target : edge.source,
        type: edge.type,
      }))
      .slice(0, 10);
  }, [analysis.dependencyGraph.edges, selectedNode]);

  const graphNodes = connectedFiles.slice(0, 10);
  const graphNodeIds = new Set(graphNodes.map((node) => node.id));
  const graphEdges = analysis.dependencyGraph.edges.filter(
    (edge) => graphNodeIds.has(edge.source) && graphNodeIds.has(edge.target)
  );
  const graphPositions = new Map(
    graphNodes.map((node, index) => [node.id, nodePosition(index, graphNodes.length)])
  );

  const fileEntries = useMemo(() => {
    const query = fileQuery.trim().toLowerCase();
    return Object.entries(analysis.fileSummaries).filter(
      ([path, summary]) => !query || path.toLowerCase().includes(query) || summary.toLowerCase().includes(query)
    );
  }, [analysis.fileSummaries, fileQuery]);
  const visibleFiles = showAllFiles ? fileEntries : fileEntries.slice(0, 8);

  const stackSections = [
    { label: "Languages", values: analysis.techStack.languages, icon: Code2 },
    { label: "Frameworks", values: analysis.techStack.frameworks, icon: Layers3 },
    { label: "Databases", values: analysis.techStack.databases, icon: Database },
    { label: "Testing", values: analysis.techStack.testing, icon: TestTube2 },
    { label: "CI/CD", values: analysis.techStack.cicd, icon: Workflow },
    { label: "Tooling", values: analysis.techStack.tools, icon: Wrench },
  ];

  const readiness = analysis.contributionScore;
  const readinessChecks = readiness
    ? [
        ["Contributing guide", readiness.hasContributing],
        ["Setup instructions", readiness.hasSetupInstructions],
        ["Automated delivery", readiness.hasCiCd],
        ["Good first issues", readiness.hasGoodFirstIssues],
        ["Code of conduct", readiness.hasCodeOfConduct],
        ["License", readiness.hasLicense],
      ] as const
    : [];

  async function copyReportLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-14">
      <nav
        aria-label="Report sections"
        className="report-index sticky top-0 z-30 -mx-5 flex items-center gap-1 overflow-x-auto border-y border-[#292721] bg-[#f5f0e5]/95 px-5 py-2 backdrop-blur-md sm:-mx-8 sm:px-8 lg:top-22 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12"
      >
        <p className="mr-4 hidden shrink-0 font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f] md:block">
          Report index
        </p>
        {reportSections.map(([id, label], index) => (
          <a
            key={id}
            href={`#${id}`}
            className="group flex shrink-0 items-center gap-2 px-3 py-2 text-xs text-[#5e5952] transition hover:bg-[#292721] hover:text-[#f5f0e5] focus-visible:bg-[#292721] focus-visible:text-[#f5f0e5] focus-visible:outline-none"
          >
            <span className="font-mono text-[8px] text-[#c94f34] group-hover:text-[#e89980]">{String(index + 1).padStart(2, "0")}</span>
            {label}
          </a>
        ))}
        <div className="ml-auto flex shrink-0 items-center gap-1 pl-3 print:hidden">
          <button
            type="button"
            onClick={copyReportLink}
            className="inline-flex h-9 items-center gap-2 border border-[#292721]/45 px-3 text-[10px] font-medium transition hover:bg-[#e8dfcf]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#667a60]" /> : <Clipboard className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 border border-[#292721] bg-[#292721] px-3 text-[10px] font-medium text-[#f5f0e5] transition hover:bg-[#d75c3f]"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </nav>

      <section id="overview" className="scroll-mt-36">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5 border-b border-[#292721] pb-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">01 / Repository brief</p>
            <h3 className="mt-3 font-serif text-4xl tracking-[-.045em] sm:text-5xl">The system at a glance.</h3>
          </div>
          <a
            href={repo.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 border-b border-[#292721] pb-1 text-xs font-medium transition hover:text-[#d75c3f] print:hidden"
          >
            Open on GitHub
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[1.3fr_.7fr]">
          <article className="bg-[#f7f2e7] p-6 sm:p-9">
            <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#667a60]">Executive summary</p>
            <div className="dashboard-markdown mt-5 max-w-3xl text-sm leading-7 text-[#5e5952] sm:text-base sm:leading-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.summary}</ReactMarkdown>
            </div>
          </article>

          <aside className="flex flex-col bg-[#e8dfcf] p-6 sm:p-8">
            <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#667a60]">Analysis coverage</p>
            <div className="mt-6 grid grid-cols-2 border-l border-t border-[#292721]/35">
              {[
                ["Indexed files", formatCount(analysis.dependencyGraph.stats.totalNodes)],
                ["Relationships", formatCount(analysis.dependencyGraph.stats.totalEdges)],
                ["Avg. connections", analysis.dependencyGraph.stats.avgDegree.toFixed(1)],
                ["File summaries", formatCount(Object.keys(analysis.fileSummaries).length)],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-r border-[#292721]/35 p-4">
                  <p className="font-serif text-3xl tracking-[-.045em]">{value}</p>
                  <p className="mt-1 text-[10px] text-[#6d675f]">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Detected pattern</p>
              <p className="mt-2 border-l-2 border-[#d75c3f] pl-3 font-serif text-2xl leading-tight tracking-[-.03em]">
                {analysis.architecture.pattern}
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-7 grid border-l border-t border-[#292721]/45 sm:grid-cols-2 lg:grid-cols-3">
          {stackSections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.label} className="min-h-28 border-b border-r border-[#292721]/45 bg-[#f7f2e7]/65 p-4">
                <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.13em] text-[#667a60]">
                  <Icon className="h-3.5 w-3.5" />
                  {section.label}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(section.values.length ? section.values : ["Not detected"]).map((value) => (
                    <span key={`${section.label}-${value}`} className="border border-[#292721]/25 bg-[#f5f0e5] px-2.5 py-1 text-[11px]">
                      {value}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="architecture" className="scroll-mt-36 border-t border-[#292721] pt-10">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">02 / Architecture</p>
            <h3 className="mt-3 max-w-[10ch] font-serif text-4xl leading-[.98] tracking-[-.045em] sm:text-5xl">Follow the system from edge to core.</h3>
            <p className="mt-6 text-sm leading-7 text-[#5e5952]">{analysis.architecture.dataFlow}</p>
          </div>

          <div className="border border-[#292721] bg-[#e8dfcf] p-5 sm:p-7">
            <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">Architecture model</p>
            <ArchitectureSystemMap analysis={analysis} />
            <p className="mt-6 font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">Detected layer sequence</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              {analysis.architecture.layers.length ? (
                analysis.architecture.layers.map((layer, index) => (
                  <div key={layer} className="flex flex-1 items-center gap-2 sm:min-w-0">
                    <div className="flex min-h-20 flex-1 flex-col justify-between border border-[#292721] bg-[#f7f2e7] p-3">
                      <span className="font-mono text-[8px] text-[#c94f34]">{String(index + 1).padStart(2, "0")}</span>
                      <span className="mt-3 break-words text-xs font-medium">{layer}</span>
                    </div>
                    {index < analysis.architecture.layers.length - 1 ? <ChevronRight className="h-4 w-4 shrink-0 rotate-90 text-[#6d675f] sm:rotate-0" /> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6d675f]">No explicit architecture layers were detected.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-9 border-y border-[#292721]">
          {analysis.architecture.modules.length ? (
            analysis.architecture.modules.map((module, index) => (
              <details key={`${module.name}-${module.path}`} className="group border-b border-[#292721]/35 last:border-b-0" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-4 px-1 py-5 marker:hidden sm:px-4">
                  <span className="font-mono text-[8px] text-[#c94f34]">M{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-2xl tracking-[-.03em]">{module.name}</p>
                    <p className="mt-1 truncate font-mono text-[9px] text-[#667a60]">{module.path}</p>
                  </div>
                  <span className="hidden max-w-sm text-right text-xs leading-5 text-[#6d675f] md:block">{module.responsibility}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <div className="grid gap-5 bg-[#e8dfcf] px-5 py-5 sm:grid-cols-[.85fr_1.15fr] sm:px-12">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Responsibility</p>
                    <p className="mt-2 text-sm leading-6 text-[#5e5952]">{module.responsibility}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Key files</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {module.keyFiles.length ? module.keyFiles.map((file) => (
                        <code key={file} className="border border-[#292721]/25 bg-[#f7f2e7] px-2.5 py-1.5 text-[10px]">{file}</code>
                      )) : <span className="text-xs text-[#6d675f]">No key files identified.</span>}
                    </div>
                  </div>
                </div>
              </details>
            ))
          ) : (
            <p className="py-8 text-sm text-[#6d675f]">No distinct modules were identified in this snapshot.</p>
          )}
        </div>
      </section>

      <section id="connections" className="scroll-mt-36 border-t border-[#292721] pt-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">03 / Connections</p>
            <h3 className="mt-3 font-serif text-4xl tracking-[-.045em] sm:text-5xl">Dependency explorer.</h3>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#6d675f]">Select a hotspot to inspect what it imports, what depends on it, and why it may be an important change surface.</p>
        </div>

        <div className="grid gap-px border border-[#292721] bg-[#292721] xl:grid-cols-[1.35fr_.65fr]">
          <div className="min-w-0 bg-[#e8dfcf] p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">High-connectivity subgraph</p>
              <p className="font-mono text-[8px] text-[#6d675f]">{graphNodes.length} of {analysis.dependencyGraph.stats.totalNodes} nodes</p>
            </div>
            {graphNodes.length ? (
              <>
                <svg viewBox="0 0 720 380" className="mt-3 w-full" role="img" aria-label="Dependency hotspot graph">
                  <g fill="none" stroke="#8e897f" strokeOpacity=".55" strokeWidth="1.3">
                    {graphEdges.map((edge) => {
                      const source = graphPositions.get(edge.source);
                      const target = graphPositions.get(edge.target);
                      if (!source || !target) return null;
                      const active = edge.source === selectedNode?.id || edge.target === selectedNode?.id;
                      return <line key={`${edge.source}-${edge.target}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={active ? "#d75c3f" : undefined} strokeWidth={active ? 2.4 : undefined} />;
                    })}
                  </g>
                  {graphNodes.map((node, index) => {
                    const position = graphPositions.get(node.id)!;
                    const selected = node.id === selectedNode?.id;
                    const radius = Math.min(24, 10 + (node.inDegree + node.outDegree) * 2);
                    return (
                      <g key={node.id}>
                        <circle cx={position.x} cy={position.y} r={radius + (selected ? 6 : 0)} fill={selected ? "#f0c6b9" : "transparent"} />
                        <circle cx={position.x} cy={position.y} r={radius} fill={selected ? "#d75c3f" : index < 3 ? "#667a60" : "#f7f2e7"} stroke="#292721" strokeWidth="1.5" />
                        <text x={position.x} y={position.y + radius + 17} textAnchor="middle" fill="#292721" fontSize="9" fontFamily="ui-monospace, monospace">{shortPath(node.name, 18)}</text>
                      </g>
                    );
                  })}
                </svg>
                <div className="report-node-strip flex gap-1 overflow-x-auto border-t border-[#292721]/30 pt-3 print:hidden">
                  {graphNodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`shrink-0 border px-2.5 py-1.5 font-mono text-[9px] transition ${node.id === selectedNode?.id ? "border-[#292721] bg-[#292721] text-[#f5f0e5]" : "border-[#292721]/30 bg-[#f7f2e7] hover:border-[#292721]"}`}
                    >
                      {shortPath(node.path, 24)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid min-h-80 place-items-center text-sm text-[#6d675f]">No internal dependency nodes detected.</div>
            )}
          </div>

          <aside className="bg-[#f7f2e7] p-5 sm:p-7">
            <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#c94f34]">Selected file</p>
            {selectedNode ? (
              <>
                <p className="mt-3 break-all font-mono text-xs font-semibold leading-5">{selectedNode.path}</p>
                <div className="mt-5 grid grid-cols-3 border-l border-t border-[#292721]/30">
                  {[
                    ["In", selectedNode.inDegree],
                    ["Out", selectedNode.outDegree],
                    ["Lines", selectedNode.lines],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-r border-[#292721]/30 p-3">
                      <p className="font-serif text-2xl">{value}</p>
                      <p className="text-[9px] text-[#6d675f]">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Direct relationships</p>
                  <div className="mt-2 divide-y divide-[#292721]/20 border-t border-[#292721]/20">
                    {selectedConnections.length ? selectedConnections.map((connection, index) => (
                      <button
                        key={`${connection.direction}-${connection.path}-${index}`}
                        type="button"
                        onClick={() => graphNodeIds.has(connection.path) && setSelectedNodeId(connection.path)}
                        className="flex w-full items-center gap-2 py-2.5 text-left disabled:cursor-default"
                        disabled={!graphNodeIds.has(connection.path)}
                      >
                        <span className="w-12 shrink-0 font-mono text-[8px] uppercase text-[#c94f34]">{connection.direction}</span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[9px]">{connection.path}</span>
                        {graphNodeIds.has(connection.path) ? <ChevronRight className="h-3 w-3" /> : null}
                      </button>
                    )) : <p className="py-4 text-xs text-[#6d675f]">No direct internal relationships were recorded.</p>}
                  </div>
                </div>
              </>
            ) : null}
          </aside>
        </div>
      </section>

      <section id="files" className="scroll-mt-36 border-t border-[#292721] pt-10">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr]">
          <article>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">04 / Orientation</p>
            <h3 className="mt-3 font-serif text-4xl tracking-[-.045em] sm:text-5xl">Where to begin.</h3>
            <div className="mt-7 border-t border-[#292721]">
              {analysis.entryPoints.length ? analysis.entryPoints.slice(0, 12).map((entry, index) => {
                const maxScore = Math.max(...analysis.entryPoints.map((item) => item.score), 1);
                return (
                  <div key={entry.path} className="border-b border-[#292721]/30 py-4">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-[8px] text-[#c94f34]">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-mono text-[10px] font-semibold leading-5">{entry.path}</p>
                        <p className="mt-1.5 text-xs leading-5 text-[#6d675f]">{entry.reasons.join(" · ")}</p>
                        <div className="mt-3 h-1 bg-[#ded4c3]"><div className="h-full bg-[#d75c3f]" style={{ width: `${Math.max(6, (entry.score / maxScore) * 100)}%` }} /></div>
                      </div>
                      <span className="font-mono text-[9px] text-[#667a60]">{entry.score}</span>
                    </div>
                  </div>
                );
              }) : <p className="py-6 text-sm text-[#6d675f]">No likely entry points were identified.</p>}
            </div>
          </article>

          <article>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">File intelligence</p>
                <h3 className="mt-3 font-serif text-4xl tracking-[-.045em]">Search the snapshot.</h3>
              </div>
              <span className="font-mono text-[8px] text-[#6d675f]">{fileEntries.length} matches</span>
            </div>
            <label className="mt-6 flex h-12 items-center gap-3 border border-[#292721] bg-[#f7f2e7] px-4 focus-within:ring-2 focus-within:ring-[#d75c3f]/35">
              <Search className="h-4 w-4 text-[#6d675f]" />
              <span className="sr-only">Search analyzed files</span>
              <input
                value={fileQuery}
                onChange={(event) => { setFileQuery(event.target.value); setShowAllFiles(false); }}
                placeholder="Search paths or summaries"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8a8378]"
              />
              {fileQuery ? <button type="button" onClick={() => setFileQuery("")} aria-label="Clear file search"><X className="h-4 w-4" /></button> : null}
            </label>
            <div className="mt-3 divide-y divide-[#292721]/25 border-y border-[#292721]">
              {visibleFiles.length ? visibleFiles.map(([path, summary]) => (
                <details key={path} className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 py-4 marker:hidden">
                    <FileCode2 className="h-4 w-4 shrink-0 text-[#667a60]" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold">{path}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="border-l-2 border-[#d75c3f] pb-4 pl-4 text-sm leading-6 text-[#5e5952]">{summary}</p>
                </details>
              )) : <p className="py-7 text-sm text-[#6d675f]">No analyzed files match “{fileQuery}”.</p>}
            </div>
            {fileEntries.length > 8 ? (
              <button type="button" onClick={() => setShowAllFiles((value) => !value)} className="mt-4 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4 print:hidden">
                {showAllFiles ? "Show fewer files" : `Show all ${fileEntries.length} files`}
              </button>
            ) : null}
          </article>
        </div>
      </section>

      <section id="onboarding" className="scroll-mt-36 border-t border-[#292721] pt-10">
        <div className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[.7fr_1.3fr]">
          <div className="bg-[#292721] p-7 text-[#f5f0e5] sm:p-9">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#e89980]">05 / Onboarding</p>
            <h3 className="mt-4 max-w-[9ch] font-serif text-4xl leading-[.98] tracking-[-.045em] sm:text-5xl">A practical reading route.</h3>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#bdb6aa]">Use this as an orientation sequence. Confirm assumptions against the source, tests, and runtime behavior as you move through the repository.</p>
          </div>
          <article className="bg-[#f7f2e7] p-6 sm:p-9">
            <div className="dashboard-markdown max-w-3xl text-sm leading-7 text-[#5e5952] sm:text-base sm:leading-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.startGuide}</ReactMarkdown>
            </div>
          </article>
        </div>
      </section>

      <section id="review" className="scroll-mt-36 border-t border-[#292721] pt-10">
        <div className="mb-7">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">06 / Human review</p>
          <h3 className="mt-3 font-serif text-4xl tracking-[-.045em] sm:text-5xl">What deserves a closer look.</h3>
        </div>
        <div className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-2">
          <article className="bg-[#e8dfcf] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">Architecture findings</p>
                <h4 className="mt-2 font-serif text-3xl tracking-[-.035em]">Risks and questions</h4>
              </div>
              <AlertTriangle className="h-6 w-6 text-[#b56c25]" />
            </div>
            <div className="mt-6 space-y-2">
              {analysis.architecture.issues.length ? analysis.architecture.issues.map((issue, index) => (
                <div key={`${issue}-${index}`} className="grid grid-cols-[2rem_1fr] border border-[#a9682b]/40 bg-[#ead8b8] p-3 text-sm leading-6 text-[#67441f]">
                  <span className="font-mono text-[8px] text-[#9a5c20]">R{String(index + 1).padStart(2, "0")}</span>
                  {issue}
                </div>
              )) : (
                <div className="flex items-start gap-3 border border-[#667a60]/40 bg-[#dfe5d8] p-4 text-sm leading-6 text-[#43533f]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  No major architecture risks were identified in this static snapshot.
                </div>
              )}
            </div>
          </article>

          <article className="bg-[#f7f2e7] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">Contribution readiness</p>
                <h4 className="mt-2 font-serif text-3xl tracking-[-.035em]">Project signals</h4>
              </div>
              {readiness ? (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-[#292721] bg-[#e8dfcf]">
                  <div className="text-center"><p className="font-serif text-3xl leading-none">{readiness.total}</p><p className="mt-1 font-mono text-[7px] uppercase tracking-[.12em] text-[#6d675f]">of 100</p></div>
                </div>
              ) : <ShieldCheck className="h-7 w-7 text-[#667a60]" />}
            </div>
            {readiness ? (
              <>
                <div className="mt-6 h-2 bg-[#ded4c3]" role="progressbar" aria-label="Contribution readiness score" aria-valuenow={readiness.total} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-[#667a60]" style={{ width: `${Math.max(0, Math.min(100, readiness.total))}%` }} />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {readinessChecks.map(([label, passed]) => (
                    <div key={label} className="flex items-center gap-2 border border-[#292721]/25 px-3 py-2.5 text-xs">
                      {passed ? <CheckCircle2 className="h-4 w-4 text-[#667a60]" /> : <Circle className="h-4 w-4 text-[#a59d90]" />}
                      {label}
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-px bg-[#292721]/25">
                  <div className="bg-[#e8dfcf] p-3"><p className="font-serif text-2xl">{readiness.readmeQuality}<span className="text-sm text-[#6d675f]"> / 25</span></p><p className="text-[9px] text-[#6d675f]">README quality</p></div>
                  <div className="bg-[#e8dfcf] p-3"><p className="font-serif text-2xl">{readinessChecks.filter(([, passed]) => passed).length}<span className="text-sm text-[#6d675f]"> / {readinessChecks.length}</span></p><p className="text-[9px] text-[#6d675f]">Readiness checks</p></div>
                </div>
              </>
            ) : (
              <p className="mt-6 border-l-2 border-[#667a60] pl-4 text-sm leading-6 text-[#5e5952]">Contribution-readiness signals were not available for this analysis. Review setup instructions, licensing, CI, and contribution guidance manually.</p>
            )}
          </article>
        </div>
        <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#6d675f]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          RepoMind provides static orientation signals, not runtime verification, a security audit, or a replacement for engineering judgment.
        </p>
      </section>
    </div>
  );
}
