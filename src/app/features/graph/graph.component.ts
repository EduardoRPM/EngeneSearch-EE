import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { ArticleWithId } from '../../core/models/article.model';
import { KnowledgeGraphComponent, GraphNode } from './knowledge-graph/knowledge-graph.component';
import { NodeDetailPanelComponent } from './node-detail-panel/node-detail-panel.component';

interface SelectedNodeData extends GraphNode {}

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [CommonModule, KnowledgeGraphComponent, NodeDetailPanelComponent],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css',
})
export class GraphComponent implements OnDestroy {
  savedArticles: ArticleWithId[] = [];
  selectedNode: SelectedNodeData | null = null;
  selectedArticle: ArticleWithId | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(private readonly articleService: ArticleService) {
    this.subscriptions.push(
      this.articleService.getArticles().subscribe((articles) => {
        this.savedArticles = articles.filter((article) => article.saved);
        if (this.selectedNode?.type === 'article') {
          this.selectedArticle = this.findArticleByNodeId(this.selectedNode.id);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  handleNodeClick(node: GraphNode): void {
    this.selectedNode = node;
    if (node.type === 'article') {
      this.selectedArticle = this.findArticleByNodeId(node.id);
    } else {
      this.selectedArticle = null;
    }
  }

  handleClosePanel(): void {
    this.selectedNode = null;
    this.selectedArticle = null;
  }

  private findArticleByNodeId(nodeId: string): ArticleWithId | null {
    const match = nodeId.match(/^article-(\d+)/);
    if (!match) {
      return null;
    }
    const index = Number.parseInt(match[1], 10);
    return this.savedArticles[index] ?? null;
  }
}
