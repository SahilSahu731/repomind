import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { AnalysisResult } from "../../../shared/types";

type GraphData = AnalysisResult["dependencyGraph"];

interface Props {
  graph: GraphData;
}

export function DependencyGraph({ graph }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || graph.nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 480;

    // Clear previous render
    d3.select(container).selectAll("svg").remove();

    // Cap nodes for performance
    const maxNodes = 200;
    const nodes = graph.nodes
      .sort((a, b) => b.inDegree + b.outDegree - (a.inDegree + a.outDegree))
      .slice(0, maxNodes)
      .map((n) => ({ ...n }));

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graph.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({ ...e }));

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border-radius", "var(--radius-lg)")
      .style("background", "var(--bg-tertiary)");

    const g = svg.append("g");

    // Color scale by directory
    const directories = [...new Set(nodes.map((n) => n.directory))];
    const colorScale = d3.scaleOrdinal<string>()
      .domain(directories)
      .range([
        "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
        "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
      ]);

    const simulation = d3
      .forceSimulation<any>(nodes)
      .force(
        "link",
        d3.forceLink<any, any>(edges).id((d: any) => d.id).distance(60)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(12));

    // Edges
    const link = g
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("stroke", "rgba(99,102,241,0.15)")
      .attr("stroke-width", 1);

    // Nodes
    const node = g
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d: any) => Math.max(4, Math.min(16, Math.sqrt(d.lines) / 4)))
      .attr("fill", (d: any) => colorScale(d.directory))
      .attr("stroke", "var(--bg-primary)")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (_event: any, d: any) => {
        setSelectedNode(d.id === selectedNode ? null : d.id);
      })
      .call(
        d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Tooltip on hover
    node.append("title").text((d: any) => `${d.path}\n${d.lines} lines | ${d.inDegree} imports`);

    // Zoom
    svg.call(
      d3.zoom<any, any>().scaleExtent([0.3, 5]).on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
    );

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <span className="pill">{graph.stats.totalNodes} nodes</span>
        <span className="pill">{graph.stats.totalEdges} edges</span>
        <span className="pill">{graph.stats.components} components</span>
        <span className="pill">Avg degree: {graph.stats.avgDegree.toFixed(1)}</span>
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 480,
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          overflow: "hidden",
        }}
      />

      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textAlign: "center" }}>
        Drag to move nodes • Scroll to zoom • Click for details
      </p>
    </div>
  );
}
