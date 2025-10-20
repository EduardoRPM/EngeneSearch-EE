import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { SearchService } from '../../core/services/search.service';
import { SearchArticleResult } from '../../core/models/article.model';
import { SearchAssistComponent } from '../../shared/components/search-assist/search-assist.component';
import { ArticleCardComponent, ArticleCardData } from '../../shared/components/article-card/article-card.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ActivatedRoute } from '@angular/router';

interface SearchArticle extends ArticleCardData {
  score: number;
  authors: string[];
  keywordsFull: string[];
  abstractSnippet?: string | null;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SearchAssistComponent, ArticleCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit, OnDestroy {
  input = '';
  suggestions: string[] = [];
  selectedKeywords: string[] = [];
  results: SearchArticle[] = [];
  isSearching = false;
  searchError: string | null = null;
  favoriteError: string | null = null;

  private favorites = new Map<string, SearchArticle>();
  private pendingFavorites = new Set<string>();
  private savedIds = new Set<string>();
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly searchService: SearchService,
    private readonly articleService: ArticleService,
    private readonly route: ActivatedRoute,
  ) {
    this.subscriptions.push(
      this.articleService.getSavedIds().subscribe((ids) => {
        this.savedIds = ids;
        this.syncFavoritesWithSavedIds();
      }),
    );
  }

  ngOnInit(): void {
    const routeSub = this.route.queryParamMap.subscribe((params) => {
      const query = params.get('q')?.trim() ?? '';
      const current = this.input.trim();

      if (query && query !== current) {
        this.input = query;
        this.selectedKeywords = [];
        void this.handleSearch();
      } else if (!query && current) {
        this.input = '';
        this.selectedKeywords = [];
        this.results = [];
        this.searchError = null;
      }
    });

    this.subscriptions.push(routeSub);
  }

  get hasResults(): boolean {
    return this.results.length > 0;
  }

  get favoriteList(): SearchArticle[] {
    return Array.from(this.favorites.values());
  }

  get combinedKeywords(): string[] {
    const base = new Set<string>();
    [...this.selectedKeywords, ...this.suggestions].forEach((kw) => {
      if (kw) {
        base.add(kw.trim());
      }
    });
    return Array.from(base).filter(Boolean);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  handleKeywordSelect(keyword: string): void {
    if (!this.selectedKeywords.includes(keyword)) {
      this.selectedKeywords = [...this.selectedKeywords, keyword];
      this.input = this.input ? `${this.input} ${keyword}` : keyword;
    }
  }

  handleSuggestionsChange(suggestions: string[]): void {
    this.suggestions = suggestions;
  }

  async handleSearch(): Promise<void> {
    if (!this.input.trim() && this.selectedKeywords.length === 0) {
      this.searchError = 'Write a prompt or select keywords first.';
      return;
    }

    this.isSearching = true;
    this.searchError = null;

    try {
      const results = await this.searchService.search({ keywords: this.selectedKeywords, text: this.input });
      this.results = results.map((result) => this.mapToSearchArticle(result));
      this.syncFavoritesWithSavedIds();
    } catch (error) {
      console.error('Search error', error);
      this.searchError = 'Error searching articles. Please try again.';
    } finally {
      this.isSearching = false;
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void this.handleSearch();
    }
  }

  isFavoriteArticle(article: SearchArticle): boolean {
    return this.savedIds.has(article.id);
  }

  async toggleFavorite(article: SearchArticle): Promise<void> {
    if (this.pendingFavorites.has(article.id)) {
      return;
    }

    const desiredSaved = !this.savedIds.has(article.id);
    this.pendingFavorites.add(article.id);
    this.favoriteError = null;

    try {
      this.articleService.setSavedState(article.id, desiredSaved);
      if (desiredSaved) {
        this.favorites.set(article.id, article);
      } else {
        this.favorites.delete(article.id);
      }
    } catch (error) {
      console.error('Favorite toggle error', error);
      this.favoriteError = 'Could not update favorite state. Try again.';
    } finally {
      this.pendingFavorites.delete(article.id);
    }
  }

  trackByArticleId(_index: number, article: SearchArticle): string {
    return article.id;
  }

  private syncFavoritesWithSavedIds(): void {
    for (const id of Array.from(this.favorites.keys())) {
      if (!this.savedIds.has(id)) {
        this.favorites.delete(id);
      }
    }

    for (const article of this.results) {
      if (this.savedIds.has(article.id)) {
        this.favorites.set(article.id, article);
      }
    }
  }

  private mapToSearchArticle(article: SearchArticleResult): SearchArticle {
    const authorDisplay = article.authors.length > 0
      ? `${article.authors.slice(0, 3).join(', ')}${article.authors.length > 3 ? '…' : ''}`
      : undefined;

    const badgeLabel = article.score === 1 ? '1 coincidence' : `${article.score} coincidences`;
    const tags = article.keywords.slice(0, 6);

    return {
      id: article.id,
      title: article.title,
      year: article.year,
      author: authorDisplay,
      tags,
      description: article.abstractSnippet ?? undefined,
      likes: article.score,
      comments: article.keywords.length,
      image: '/assets/logoN.png',
      link: article.link ?? null,
      badge: badgeLabel,
      score: article.score,
      authors: article.authors,
      keywordsFull: article.keywords,
      abstractSnippet: article.abstractSnippet,
    };
  }
}
