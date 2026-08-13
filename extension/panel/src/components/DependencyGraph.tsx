import { useEffect, useMemo, useRef } from "react";
import { Boxes, Network } from "lucide-react";
import * as d3 from "d3";
import type { AnalysisResult } from "../../../shared/types";

type GraphData = AnalysisResult["dependencyGraph"];
type GraphNode = GraphData["nodes"][number] & d3.SimulationNodeDatum;

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface Props {
  graph: GraphData;
}

const DIRECTORY_COLORS = [
  "#a33f2b",
  "#74806a",
  "#292721",
  "#bd7c5d",
  "#556d69",
  "#9b754c",
  "#6f6257",
  "#8e9a7d",
  "#c2573d",
  "#4c5552",
];

export function DependencyGraph({ graph }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendDirectories = useMemo(
    () => [...new Set(graph.nodes.map((node) => node.directory))].slice(0, 6),
    [graph.nodes]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || graph.nodes.length === 0) return;

    let simulation: d3.Simulation<GraphNode, undefined> | null = null;
    let lastWidth = 0;
    let animationFrame: number | null = null;

    const draw = (requestedWidth: number) => {
      const width = Math.floor(requestedWidth);
      if (width <= 0 || width === lastWidth) return;
      lastWidth = width;

      simulation?.stop();
      d3.select(container).selectAll("svg").remove();

      const height = Math.round(Math.max(360, Math.min(520, width * 1.08)));
      container.style.height = `${height}px`;

      const maxNodes = 180;
      const nodes = [...graph.nodes]
        .sort(
          (left, right) =>
            right.inDegree + right.outDegree - (left.inDegree + left.outDegree)
        )
        .slice(0, maxNodes)
        .map((node): GraphNode => ({ ...node }));

      const nodeIds = new Set(nodes.map((node) => node.id));
      const edges = graph.edges
        .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
        .map((edge): GraphLink => ({ ...edge }));

      const directories = [...new Set(nodes.map((node) => node.directory))];
      const colorScale = d3
        .scaleOrdinal<string>()
        .domain(directories)
        .range(DIRECTORY_COLORS);

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr(
          "aria-label",
          `Repository dependency graph with ${nodes.length} visible files and ${edges.length} visible connections`
        )
        .style("display", "block")
        .style("background", "var(--bg-secondary)");

      const viewport = svg.append("g");

      simulation = d3
        .forceSimulation<GraphNode>(nodes)
        .force(
          "link",
          d3
            .forceLink<GraphNode, GraphLink>(edges)
            .id((node) => node.id)
            .distance(width < 420 ? 46 : 62)
            .strength(0.42)
        )
        .force("charge", d3.forceManyBody<GraphNode>().strength(width < 420 ? -115 : -165))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide<GraphNode>().radius(12))
        .alphaDecay(0.035);

      const links = viewport
        .append("g")
        .attr("aria-hidden", "true")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", "#c9bea9")
        .attr("stroke-opacity", 0.55)
        .attr("stroke-width", 0.8);

      const circles = viewport
        .append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", (node) => {
          const connectionWeight = node.inDegree + node.outDegree;
          return Math.max(
            4,
            Math.min(13, Math.sqrt(Math.max(1, node.lines)) / 4 + connectionWeight * 0.3)
          );
        })
        .attr("fill", (node) => colorScale(node.directory))
        .attr("stroke", "#f5f0e5")
        .attr("stroke-width", 1.2)
        .style("cursor", "grab")
        .call(
          d3
            .drag<SVGCircleElement, GraphNode>()
            .on("start", (event, node) => {
              if (!event.active) simulation?.alphaTarget(0.3).restart();
              node.fx = node.x;
              node.fy = node.y;
            })
            .on("drag", (event, node) => {
              node.fx = event.x;
              node.fy = event.y;
            })
            .on("end", (event, node) => {
              if (!event.active) simulation?.alphaTarget(0);
              node.fx = null;
              node.fy = null;
            })
        );

      circles
        .append("title")
        .text(
          (node) =>
            `${node.path}\n${node.lines} lines · ${node.inDegree} incoming · ${node.outDegree} outgoing`
        );

      const labelledNodes = nodes.slice(0, width < 420 ? 8 : 14);
      const labels = viewport
        .append("g")
        .attr("aria-hidden", "true")
        .selectAll("text")
        .data(labelledNodes)
        .enter()
        .append("text")
        .text((node) => node.name)
        .attr("fill", "#5f5a51")
        .attr("font-family", "ui-monospace, SFMono-Regular, Menlo, monospace")
        .attr("font-size", 8)
        .attr("dx", 9)
        .attr("dy", 3)
        .style("pointer-events", "none");

      svg.call(
        d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.35, 4])
          .on("zoom", (event) => viewport.attr("transform", event.transform))
      );

      simulation.on("tick", () => {
        links
          .attr("x1", (edge) => (edge.source as GraphNode).x ?? 0)
          .attr("y1", (edge) => (edge.source as GraphNode).y ?? 0)
          .attr("x2", (edge) => (edge.target as GraphNode).x ?? 0)
          .attr("y2", (edge) => (edge.target as GraphNode).y ?? 0);

        circles
          .attr("cx", (node) => node.x ?? 0)
          .attr("cy", (node) => node.y ?? 0);

        labels
          .attr("x", (node) => node.x ?? 0)
          .attr("y", (node) => node.y ?? 0);
      });
    };

    const scheduleDraw = (width: number) => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        draw(width);
      });
    };

    scheduleDraw(container.getBoundingClientRect().width);

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined) scheduleDraw(width);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      simulation?.stop();
      d3.select(container).selectAll("svg").remove();
    };
  }, [graph]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Network size={17} aria-hidden="true" />
          <div>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.64rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                lineHeight: 1.2,
                textTransform: "uppercase",
              }}
            >
              Structural connections
            </p>
            <h2
              style={{
                marginTop: 2,
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "1.05rem",
                fontWeight: 500,
              }}
            >
              Dependency graph
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
          <span className="pill">{graph.stats.totalNodes} files</span>
          <span className="pill">{graph.stats.totalEdges} links</span>
          <span className="pill">{graph.stats.components} components</span>
          <span className="pill">{graph.stats.avgDegree.toFixed(1)} avg. degree</span>
        </div>
      </section>

      {graph.nodes.length > 0 ? (
        <>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: 420,
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              background: "var(--bg-secondary)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              flexWrap: "wrap",
              padding: "0 var(--space-xs)",
            }}
          >
            {legendDirectories.map((directory, index) => (
              <span
                key={directory}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.64rem",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: DIRECTORY_COLORS[index % DIRECTORY_COLORS.length],
                  }}
                />
                {directory || "root"}
              </span>
            ))}
          </div>

          <p style={{ fontSize: "0.7rem", textAlign: "center" }}>
            Drag files to inspect clusters. Scroll to zoom and hover for connection details.
          </p>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-sm)",
            minHeight: 240,
            border: "1px dashed var(--border-primary)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-tertiary)",
            fontSize: "0.8rem",
          }}
        >
          <Boxes size={18} aria-hidden="true" />
          No dependency nodes were detected.
        </div>
      )}
    </div>
  );
}
