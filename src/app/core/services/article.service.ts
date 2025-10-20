import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, map } from 'rxjs';
import { Article, ArticleWithId } from '../models/article.model';
import { deriveArticleId } from '../utils/article-utils';

const DATA_URL = 'data/09_dataset_complete.json';
const SAVED_STORAGE_KEY = 'engenesearch.savedArticles';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly savedIds = this.readSavedIds();
  private readonly articlesSubject = new BehaviorSubject<ArticleWithId[]>([]);
  private readonly savedIdsSubject = new BehaviorSubject<Set<string>>(new Set(this.savedIds));
  private loadingPromise: Promise<ArticleWithId[]> | null = null;

  constructor(private readonly http: HttpClient) {}

  private async loadArticles(): Promise<ArticleWithId[]> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = firstValueFrom(
      this.http.get<Article[]>(DATA_URL).pipe(map((articles) => this.hydrateArticles(articles))),
    );

    try {
      const loaded = await this.loadingPromise;
      this.articlesSubject.next(loaded);
      this.savedIdsSubject.next(new Set(this.savedIds));
      return loaded;
    } finally {
      this.loadingPromise = null;
    }
  }

  private hydrateArticles(articles: Article[]): ArticleWithId[] {
    return articles.map((article, index) => {
      const id = deriveArticleId(article, index);
      const saved = this.savedIds.has(id) || article.saved;
      return {
        ...article,
        id,
        saved,
      };
    });
  }

  getArticles(): Observable<ArticleWithId[]> {
    if (!this.loadingPromise && this.articlesSubject.value.length === 0) {
      void this.loadArticles();
    }
    return this.articlesSubject.asObservable();
  }

  async refreshArticles(): Promise<ArticleWithId[]> {
    const articles = await this.loadArticles();
    return articles;
  }

  getArticlesSnapshot(): ArticleWithId[] {
    return this.articlesSubject.value;
  }

  getSavedArticles(): Observable<ArticleWithId[]> {
    return this.getArticles().pipe(map((articles) => articles.filter((article) => article.saved)));
  }

  setSavedState(articleId: string, saved: boolean): void {
    const articles = this.articlesSubject.value;
    const isKnownArticle = articles.some((article) => article.id === articleId);

    if (saved) {
      this.savedIds.add(articleId);
    } else {
      this.savedIds.delete(articleId);
    }

    if (isKnownArticle) {
      const next = articles.map((article) =>
        article.id === articleId
          ? {
              ...article,
              saved,
            }
          : article,
      );
      this.articlesSubject.next(next);
    }

    this.persistSavedIds(Array.from(this.savedIds));
    this.savedIdsSubject.next(new Set(this.savedIds));
  }

  toggleSaved(articleId: string): void {
    const article = this.articlesSubject.value.find((item) => item.id === articleId);
    if (!article) {
      const shouldSave = !this.savedIds.has(articleId);
      this.setSavedState(articleId, shouldSave);
      return;
    }
    this.setSavedState(articleId, !article.saved);
  }

  findById(articleId: string): ArticleWithId | undefined {
    return this.articlesSubject.value.find((article) => article.id === articleId);
  }

  getSavedIds(): Observable<Set<string>> {
    return this.savedIdsSubject.asObservable();
  }

  isSaved(articleId: string): boolean {
    return this.savedIds.has(articleId);
  }

  private readSavedIds(): Set<string> {
    try {
      const raw = localStorage.getItem(SAVED_STORAGE_KEY);
      if (!raw) {
        return new Set<string>();
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set<string>(parsed.filter((value): value is string => typeof value === 'string'));
      }
    } catch (error) {
      console.error('Failed to parse saved articles storage', error);
    }
    return new Set<string>();
  }

  private persistSavedIds(ids: string[]): void {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Failed to persist saved articles', error);
    }
  }
}
