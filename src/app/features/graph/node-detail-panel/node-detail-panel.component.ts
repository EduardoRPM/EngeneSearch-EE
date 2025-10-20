import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ArticleWithId } from '../../../core/models/article.model';
import { GraphNode } from '../knowledge-graph/knowledge-graph.component';
import { ArticleChatModalComponent } from '../../../shared/article-chat-modal/article-chat-modal.component';

@Component({
  selector: 'app-node-detail-panel',
  standalone: true,
  imports: [CommonModule, ArticleChatModalComponent],
  templateUrl: './node-detail-panel.component.html',
  styleUrl: './node-detail-panel.component.css',
})
export class NodeDetailPanelComponent {
  @Input({ required: true }) node!: GraphNode;
  @Input() article: ArticleWithId | null = null;
  @Output() close = new EventEmitter<void>();

  showFullAbstract = false;
  showFullResults = false;

  toggleAbstract(): void {
    this.showFullAbstract = !this.showFullAbstract;
  }

  toggleResults(): void {
    this.showFullResults = !this.showFullResults;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getCitationCount(article: ArticleWithId): number {
    const value = article.citations?.citation_count;
    return typeof value === 'number' ? value : 0;
  }

  getAbstractFull(sections: string[]): string {
    return sections.join(' ');
  }

  getAbstractPreview(sections: string[]): string {
    const text = this.getAbstractFull(sections);
    if (text.length <= 200) {
      return text;
    }
    return `${text.slice(0, 200)}…`;
  }
}
