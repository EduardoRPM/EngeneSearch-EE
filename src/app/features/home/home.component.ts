import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchAssistComponent } from '../../shared/components/search-assist/search-assist.component';
import { SearchService } from '../../core/services/search.service';
import { SearchArticleResult } from '../../core/models/article.model';
import { ArticleCardComponent, ArticleCardData } from '../../shared/components/article-card/article-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchAssistComponent, ArticleCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  isLoaded = false;
  isExiting = false;
  homeSearchInput = '';
  homeSelectedKeywords: string[] = [];
  homeResults: HomeSearchArticle[] = [];
  homeSearchError: string | null = null;
  homeIsSearching = false;
  hasPerformedSearch = false;
  homeLockedCount = 0;

  constructor(
    private readonly router: Router,
    private readonly searchService: SearchService,
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.isLoaded = true;
    }, 100);
  }

  handleAssistKeywordSelect(keyword: string): void {
    const trimmed = keyword.trim();
    if (!trimmed) {
      return;
    }

    this.homeSearchError = null;

    if (!this.homeSelectedKeywords.includes(trimmed)) {
      this.homeSelectedKeywords = [...this.homeSelectedKeywords, trimmed];
    }

    const tokens = new Set(this.homeSearchInput.split(/\s+/).filter(Boolean));
    if (!tokens.has(trimmed)) {
      this.homeSearchInput = this.homeSearchInput ? `${this.homeSearchInput} ${trimmed}` : trimmed;
    }
  }

  removeSelectedKeyword(keyword: string): void {
    this.homeSelectedKeywords = this.homeSelectedKeywords.filter((item) => item !== keyword);
    if (!this.homeSelectedKeywords.length && !this.homeSearchInput.trim()) {
      this.homeSearchError = null;
    }
  }

  handleSearchInputChange(value: string): void {
    if (value.trim()) {
      this.homeSearchError = null;
    }
  }

  handleViewMore(): void {
    if (this.isExiting) {
      return;
    }
    this.isExiting = true;
    setTimeout(() => {
      void this.router.navigate(['/dashboard']);
    }, 500);
  }

  handleLogin(): void {
    if (this.isExiting) {
      return;
    }
    void this.router.navigate(['/login']);
  }

  handleRegister(): void {
    if (this.isExiting) {
      return;
    }
    void this.router.navigate(['/register']);
  }

  async handleSearchSubmit(): Promise<void> {
    await this.performHomeSearch();
  }

  handleResultTagClick(tag: string): void {
    this.handleAssistKeywordSelect(tag);
  }

  handleHomeKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void this.performHomeSearch();
    }
  }

  trackByHomeArticle(_index: number, article: HomeSearchArticle): string {
    return article.id;
  }

  private async performHomeSearch(): Promise<void> {
    const prompt = this.homeSearchInput.trim();
    if (!prompt && this.homeSelectedKeywords.length === 0) {
      this.homeSearchError = 'Escribe un prompt o selecciona palabras clave primero.';
      return;
    }

    this.homeIsSearching = true;
    this.homeSearchError = null;
    this.hasPerformedSearch = false;

    try {
      const results = await this.searchService.search({
        text: prompt,
        keywords: this.homeSelectedKeywords,
      });
      this.homeResults = results.map((article) => this.mapToHomeArticle(article));
      this.homeLockedCount = Math.max(results.length - 3, 0);
      this.hasPerformedSearch = true;
    } catch (error) {
      console.error('Home search error', error);
      this.homeSearchError = 'No pudimos realizar la búsqueda. Intenta nuevamente.';
      this.homeResults = [];
      this.homeLockedCount = 0;
    } finally {
      this.homeIsSearching = false;
    }
  }

  private mapToHomeArticle(article: SearchArticleResult): HomeSearchArticle {
    const authorDisplay = article.authors.length > 0
      ? `${article.authors.slice(0, 3).join(', ')}${article.authors.length > 3 ? '…' : ''}`
      : undefined;

    const badgeLabel = article.score === 1 ? '1 coincidencia' : `${article.score} coincidencias`;
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
      keywordsFull: article.keywords,
      abstractSnippet: article.abstractSnippet,
    };
  }
}

interface HomeSearchArticle extends ArticleCardData {
  score: number;
  keywordsFull: string[];
  abstractSnippet?: string | null;
}
