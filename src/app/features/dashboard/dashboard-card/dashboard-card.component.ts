import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArticleService } from '../../../core/services/article.service';
import { ArticleWithId } from '../../../core/models/article.model';

interface ArticleCarouselItem extends ArticleWithId {
  firstAuthor?: string;
}

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.css',
})
export class DashboardCardComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private welcomeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private welcomeRemoveTimeoutId: ReturnType<typeof setTimeout> | null = null;

  trendIndex = 0;
  topicIndex = 0;
  recentIndex = 0;
  showWelcome = true;
  hideWelcome = false;
  @Input() welcomeMessage = 'Bienvenido Usuario';
  @Input() heroEyebrow = 'Dashboard';
  @Input() heroTitle = 'Research intelligence overview';
  @Input() heroSubtitle = 'Visualise where your library is gaining impact, track emerging topics, and spot the freshest publications at a glance.';
  @Input() primaryActionLabel = 'Open article';
  @Input() topicActionLabel = 'View topic';
  @Input() recentActionLabel = 'Read summary';

  topByCitationsDesc: ArticleCarouselItem[] = [];
  topByCitationsAsc: ArticleCarouselItem[] = [];
  topByDate: ArticleCarouselItem[] = [];
  totalArticles = 0;
  savedArticles = 0;
  uniqueTopics = 0;
  latestPublicationYear = '';

  constructor(private readonly articleService: ArticleService) {}

  ngOnInit(): void {
    this.welcomeTimeoutId = setTimeout(() => {
      this.hideWelcome = true;

      this.welcomeRemoveTimeoutId = setTimeout(() => {
        this.showWelcome = false;
      }, 650);
    }, 6000);

    this.subscription = this.articleService.getArticles().subscribe((articles) => {
      this.populateCarousels(articles);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.welcomeTimeoutId !== null) {
      clearTimeout(this.welcomeTimeoutId);
    }
    if (this.welcomeRemoveTimeoutId !== null) {
      clearTimeout(this.welcomeRemoveTimeoutId);
    }
  }

  prevTrend(): void {
    this.trendIndex = this.modulo(this.trendIndex - 1, this.topByCitationsDesc.length);
  }

  nextTrend(): void {
    this.trendIndex = this.modulo(this.trendIndex + 1, this.topByCitationsDesc.length);
  }

  goToTrend(index: number): void {
    this.trendIndex = index;
  }

  prevTopic(): void {
    this.topicIndex = this.modulo(this.topicIndex - 1, this.topByCitationsAsc.length);
  }

  nextTopic(): void {
    this.topicIndex = this.modulo(this.topicIndex + 1, this.topByCitationsAsc.length);
  }

  goToTopic(index: number): void {
    this.topicIndex = index;
  }

  prevRecent(): void {
    this.recentIndex = this.modulo(this.recentIndex - 1, this.topByDate.length);
  }

  nextRecent(): void {
    this.recentIndex = this.modulo(this.recentIndex + 1, this.topByDate.length);
  }

  goToRecent(index: number): void {
    this.recentIndex = index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatTopic(label: string): string {
    if (!label || label === 'not_indexed') {
      return 'No topics';
    }
    const firstWord = label.split(/[ /]/)[0];
    return (firstWord ?? label).replace(',', '');
  }

  getCitationCount(article: ArticleCarouselItem): number {
    const value = article.citations?.citation_count;
    return typeof value === 'number' ? value : 0;
  }

  getInfluentialCount(article: ArticleCarouselItem): number {
    const value = article.citations?.influential_citation_count;
    return typeof value === 'number' ? value : 0;
  }

  private populateCarousels(articles: ArticleWithId[]): void {
    this.totalArticles = articles.length;
    this.savedArticles = articles.filter((article) => article.saved).length;

    const topicSet = new Set<string>();
    articles.forEach((article) => {
      (article.topics ?? []).forEach((topic) => topicSet.add(topic));
    });
    this.uniqueTopics = topicSet.size;

    const years = articles
      .map((article) => Number.parseInt(article.year, 10))
      .filter((year) => !Number.isNaN(year));
    const mostRecentYear = years.length ? Math.max(...years) : null;
    this.latestPublicationYear = mostRecentYear ? String(mostRecentYear) : '—';

    if (!articles.length) {
      this.topByCitationsDesc = [];
      this.topByCitationsAsc = [];
      this.topByDate = [];
      return;
    }

    const withAuthor = articles.map((article) => ({
      ...article,
      firstAuthor: article.authors?.[0],
    }));

    this.topByCitationsDesc = [...withAuthor]
      .sort((a, b) => (b.citations?.citation_count ?? 0) - (a.citations?.citation_count ?? 0))
      .slice(0, 5);

    this.topByCitationsAsc = [...withAuthor]
      .sort((a, b) => (a.citations?.citation_count ?? 0) - (b.citations?.citation_count ?? 0))
      .slice(0, 5);

    this.topByDate = [...withAuthor]
      .sort((a, b) => Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10))
      .slice(0, 5);

    this.trendIndex = 0;
    this.topicIndex = 0;
    this.recentIndex = 0;
  }

  private modulo(value: number, length: number): number {
    if (length === 0) {
      return 0;
    }
    return ((value % length) + length) % length;
  }
}
