import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { ArticleWithId } from '../../../core/models/article.model';

export type GraphNodeType = 'article' | 'topic' | 'author';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: GraphNodeType;
  citations?: number;
  year?: string;
  saved?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
}

@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './knowledge-graph.component.html',
  styleUrl: './knowledge-graph.component.css',
})
export class KnowledgeGraphComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() articles: ArticleWithId[] = [];
  @Input() selectedNodeId: string | null = null;
  @Output() nodeClick = new EventEmitter<GraphNode>();

  private simulation?: d3.Simulation<GraphNode, GraphLink>;
  private nodeSelection?: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>;
  private linkSelection?: d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>;

  ngAfterViewInit(): void {
    this.renderGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['articles'] && !changes['articles'].firstChange) {
      this.renderGraph();
    } else if (changes['selectedNodeId'] && this.nodeSelection) {
      this.updateSelectedNodeStyles();
    }
  }

  ngOnDestroy(): void {
    this.simulation?.stop();
  }

  zoomIn(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
  }

  zoomOut(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
  }

  resetZoom(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    svg.transition().call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  }

  private renderGraph(): void {
    if (!this.svgRef || !this.containerRef) {
      return;
    }

    const svgElement = this.svgRef.nativeElement;
    const container = this.containerRef.nativeElement;

    d3.select(svgElement).selectAll('*').remove();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const { nodes, links } = this.buildGraphData(this.articles);
    if (nodes.length === 0) {
      return;
    }

    const svg = d3
      .select(svgElement)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height].join(' '));

    const defs = svg.append('defs');
    const glowFilter = defs
      .append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'coloredBlur');
    glowFilter.append('feMerge').selectAll('feMergeNode').data(['coloredBlur', 'SourceGraphic']).enter().append('feMergeNode');

    const linkGroup = svg.append('g').attr('class', 'links');
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        linkGroup.attr('transform', event.transform as any);
        nodeGroup.attr('transform', event.transform as any);
      });

    svg.call(zoomBehavior as any);

    this.simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d: GraphNode) => d.id)
          .distance((link: GraphLink) => (link.strength > 1 ? 100 : 60)),
      )
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((node) => this.getNodeRadius(node) + 12));

    this.linkSelection = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', 1.8)
      .attr('opacity', 0.3);

    this.nodeSelection = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'graph-node')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) =>
            this.onDragStart(event, d),
          )
          .on('drag', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) =>
            this.onDragged(event, d),
          )
          .on('end', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) =>
            this.onDragEnd(event, d),
          ),
      )
      .on('click', (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation();
        this.nodeClick.emit(d);
        this.selectedNodeId = d.id;
        this.updateSelectedNodeStyles();
      });

    this.nodeSelection
      .append('circle')
      .attr('class', 'node-glow')
      .attr('r', (d: GraphNode) => this.getNodeRadius(d) + 10)
      .attr('fill', (d: GraphNode) => this.getNodeGlowColor(d))
      .attr('opacity', (d: GraphNode) => this.getNodeGlowOpacity(d));

    this.nodeSelection
      .append('circle')
      .attr('class', 'node-base')
      .attr('r', (d: GraphNode) => this.getNodeRadius(d))
      .attr('fill', (d: GraphNode) => this.getNodeBaseColor(d))
      .attr('stroke', (d: GraphNode) => this.getNodeStrokeColor(d))
      .attr('stroke-width', 2.6);

    this.nodeSelection
      .append('text')
      .text((d: GraphNode) => d.label)
      .attr('x', 0)
      .attr('y', (d: GraphNode) => this.getNodeRadius(d) + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('pointer-events', 'none');

    this.simulation.on('tick', () => {
      this.linkSelection
        ?.attr('x1', (d: GraphLink) => (typeof d.source === 'string' ? 0 : d.source.x ?? 0))
        .attr('y1', (d: GraphLink) => (typeof d.source === 'string' ? 0 : d.source.y ?? 0))
        .attr('x2', (d: GraphLink) => (typeof d.target === 'string' ? 0 : d.target.x ?? 0))
        .attr('y2', (d: GraphLink) => (typeof d.target === 'string' ? 0 : d.target.y ?? 0));

      this.nodeSelection?.attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`);
    });

    svg.on('click', () => {
      this.selectedNodeId = null;
      this.updateSelectedNodeStyles();
    });

    this.updateSelectedNodeStyles();
  }

  private buildGraphData(articles: ArticleWithId[]): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const topicMap = new Map<string, GraphNode>();
    const authorMap = new Map<string, GraphNode>();

    articles.forEach((article, index) => {
      const articleNode: GraphNode = {
        id: `article-${index}`,
        label: `${article.title.substring(0, 50)}${article.title.length > 50 ? '…' : ''}`,
        type: 'article',
        citations: article.citations?.citation_count ?? 0,
        year: article.year,
        saved: article.saved,
      };

      nodes.push(articleNode);

      article.topics?.slice(0, 3).forEach((topic) => {
        const topicId = `topic-${topic.replace(/\s+/g, '-')}`;
        let topicNode = topicMap.get(topicId);
        if (!topicNode) {
          topicNode = {
            id: topicId,
            label: topic,
            type: 'topic',
          };
          topicMap.set(topicId, topicNode);
          nodes.push(topicNode);
        }
        links.push({ source: articleNode.id, target: topicId, strength: 2 });
      });

      article.authors?.slice(0, 2).forEach((author) => {
        const authorId = `author-${author.replace(/\s+/g, '-')}`;
        let authorNode = authorMap.get(authorId);
        if (!authorNode) {
          authorNode = {
            id: authorId,
            label: author,
            type: 'author',
          };
          authorMap.set(authorId, authorNode);
          nodes.push(authorNode);
        }
        links.push({ source: articleNode.id, target: authorId, strength: 0.3 });
      });
    });

    return { nodes, links };
  }

  private getNodeRadius(node: GraphNode): number {
    switch (node.type) {
      case 'article':
        return 14;
      case 'topic':
        return 10;
      case 'author':
        return 8;
      default:
        return 10;
    }
  }

  private getNodeBaseColor(node: GraphNode, isSelected = false): string {
    if (isSelected) {
      return '#15D4C8';
    }
    switch (node.type) {
      case 'article':
        return '#384CBF';
      case 'topic':
        return '#1FBAD6';
      case 'author':
        return '#F97316';
      default:
        return '#64748b';
    }
  }

  private getNodeStrokeColor(node: GraphNode, isSelected = false): string {
    if (isSelected) {
      return '#FFFFFF';
    }
    switch (node.type) {
      case 'article':
        return '#CAD3FF';
      case 'topic':
        return '#A1F0FF';
      case 'author':
        return '#FDD6B3';
      default:
        return 'rgba(255,255,255,0.85)';
    }
  }

  private getNodeGlowColor(node: GraphNode, isSelected = false): string {
    const base = d3.color(this.getNodeBaseColor(node, isSelected));
    if (!base) {
      return isSelected ? 'rgba(21,212,200,0.75)' : 'rgba(100,116,139,0.4)';
    }
    const glow = base.brighter(isSelected ? 2 : 1.4);
    glow.opacity = isSelected ? 0.75 : this.getNodeGlowOpacity(node);
    return glow.formatRgb();
  }

  private getNodeGlowOpacity(node: GraphNode): number {
    switch (node.type) {
      case 'article':
        return 0.55;
      case 'topic':
        return 0.45;
      case 'author':
        return 0.4;
      default:
        return 0.4;
    }
  }

  private onDragStart(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, node: GraphNode): void {
    if (!event.active) {
      this.simulation?.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
  }

  private onDragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, node: GraphNode): void {
    node.fx = event.x;
    node.fy = event.y;
  }

  private onDragEnd(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, node: GraphNode): void {
    if (!event.active) {
      this.simulation?.alphaTarget(0);
    }
    node.fx = null;
    node.fy = null;
  }

  private updateSelectedNodeStyles(): void {
    if (!this.nodeSelection) {
      return;
    }

    this.nodeSelection
      .selectAll<SVGCircleElement, GraphNode>('circle.node-base')
      .attr('fill', (d: GraphNode) => this.getNodeBaseColor(d, d.id === this.selectedNodeId))
      .attr('stroke', (d: GraphNode) => this.getNodeStrokeColor(d, d.id === this.selectedNodeId))
      .attr('stroke-width', (d: GraphNode) => (d.id === this.selectedNodeId ? 3.4 : 2.6));

    this.nodeSelection
      .selectAll<SVGCircleElement, GraphNode>('circle.node-glow')
      .attr('fill', (d: GraphNode) => this.getNodeGlowColor(d, d.id === this.selectedNodeId))
      .attr('opacity', (d: GraphNode) => (d.id === this.selectedNodeId ? 0.75 : this.getNodeGlowOpacity(d)));
  }
}
