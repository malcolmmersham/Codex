// ─── Knowledge graph (React Flow) ────────────────────────────────────────────
// Not decorative. Clicking a node navigates to that idea — the graph is a way
// to traverse the notebook rather than browse pages.
import { html, useMemo, useCallback } from './h.js';
import ReactFlow, {
  Background,
  Controls,
  Position,
} from 'https://esm.sh/reactflow@11.11.4?deps=react@18.3.1,react-dom@18.3.1';
import { buildGraph } from './data.js';

const COLUMN = { thought: 0, theme: 1, framework: 2, offer: 3 };
const COLUMN_X = { thought: 0, theme: 300, framework: 620, offer: 960 };

// Deterministic layered layout: thoughts → themes → frameworks → offers,
// reading left to right like a flow of ideas.
function layout(nodes) {
  const byCol = { thought: [], theme: [], framework: [], offer: [] };
  for (const n of nodes) byCol[n.kind].push(n);
  const SPACING = 84;
  const positioned = {};
  for (const kind of Object.keys(byCol)) {
    const col = byCol[kind];
    const height = (col.length - 1) * SPACING;
    col.forEach((n, i) => {
      positioned[n.id] = { x: COLUMN_X[kind], y: i * SPACING - height / 2 };
    });
  }
  return positioned;
}

export function KnowledgeGraph({ onOpen, focusId }) {
  const { nodes: gNodes, edges: gEdges } = useMemo(buildGraph, []);
  const pos = useMemo(() => layout(gNodes), [gNodes]);

  // Which nodes/edges are connected to the focused node, for dimming the rest.
  const neighbours = useMemo(() => {
    if (!focusId) return null;
    const set = new Set([focusId]);
    for (const e of gEdges) {
      if (e.source === focusId) set.add(e.target);
      if (e.target === focusId) set.add(e.source);
    }
    return set;
  }, [focusId, gEdges]);

  const rfNodes = useMemo(
    () =>
      gNodes.map((n) => {
        const dimmed = neighbours && !neighbours.has(n.id);
        return {
          id: n.id,
          position: pos[n.id],
          data: { label: n.label },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          className: `kg-node kg-${n.kind}${focusId === n.id ? ' kg-focus' : ''}${dimmed ? ' kg-dim' : ''}`,
          connectable: false,
        };
      }),
    [gNodes, pos, neighbours, focusId]
  );

  const rfEdges = useMemo(
    () =>
      gEdges.map((e) => {
        const active = neighbours && (e.source === focusId || e.target === focusId);
        const dimmed = neighbours && !active;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          animated: !!active,
          className: `kg-edge${dimmed ? ' kg-edge-dim' : ''}`,
        };
      }),
    [gEdges, neighbours, focusId]
  );

  const handleNodeClick = useCallback(
    (_evt, node) => {
      const [kind, id] = node.id.split(':');
      onOpen(kind, id);
    },
    [onOpen]
  );

  return html`
    <div className="kg-wrap">
      <${ReactFlow}
        nodes=${rfNodes}
        edges=${rfEdges}
        onNodeClick=${handleNodeClick}
        fitView
        fitViewOptions=${{ padding: 0.2 }}
        proOptions=${{ hideAttribution: true }}
        nodesDraggable=${false}
        nodesConnectable=${false}
        elementsSelectable=${true}
        minZoom=${0.3}
        maxZoom=${1.6}
      >
        <${Background} gap=${28} size=${1} color="#e7e3da" />
        <${Controls} showInteractive=${false} />
      <//>
      <div className="kg-legend">
        <span className="kg-key kg-key-thought">Thought</span>
        <span className="kg-key kg-key-theme">Theme</span>
        <span className="kg-key kg-key-framework">Framework</span>
        <span className="kg-key kg-key-offer">Offer</span>
      </div>
    </div>
  `;
}
