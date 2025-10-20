import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ArticleService } from '../../../core/services/article.service';
import { ArticleCardComponent, ArticleCardData } from '../../../shared/components/article-card/article-card.component';

export interface SavedArticleCard extends ArticleCardData {
  year?: string;
}

@Component({
  selector: 'app-saved-articles',
  standalone: true,
  imports: [CommonModule, ArticleCardComponent],
  templateUrl: './saved-articles.component.html',
  styleUrl: './saved-articles.component.css',
})
export class SavedArticlesComponent implements OnChanges {
  @Input() articles: SavedArticleCard[] = [];

  viewMode: 'grid' | 'list' = 'grid';
  displayedArticles: SavedArticleCard[] = [];
  error: string | null = null;
  private readonly pending = new Set<string>();

  constructor(
    private readonly articleService: ArticleService,
    private readonly router: Router,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('articles' in changes) {
      this.displayedArticles = [...this.articles];
      if (this.displayedArticles.length === 0) {
        this.error = null;
      }
    }
  }

  toggleView(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  async handleBookmarkToggle(article: SavedArticleCard): Promise<void> {
    if (this.pending.has(article.id)) {
      return;
    }

    this.pending.add(article.id);
    this.error = null;

    try {
      this.articleService.setSavedState(article.id, false);
      this.displayedArticles = this.displayedArticles.filter((item) => item.id !== article.id);
    } catch (error) {
      console.error('Error removing saved article', error);
      this.error = 'Could not update favorite state. Try again.';
    } finally {
      this.pending.delete(article.id);
    }
  }

  goToGraph(): void {
    void this.router.navigate(['/graph']);
  }

  trackByArticleId(_index: number, article: SavedArticleCard): string {
    return article.id;
  }
}
