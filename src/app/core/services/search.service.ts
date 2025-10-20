import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SearchArticleResult } from '../models/article.model';

const DATA_URL = 'data/Final_dataset_merged.json';
const DEFAULT_LIMIT = 12;

interface RawArticle {
  title?: string;
  title_pubmed?: string;
  year?: string;
  authors?: string[];
  link?: string | null;
  pmid?: string | null;
  pmcid?: string | null;
  doi?: string | null;
  keywords?: string[];
  mesh_terms?: string[];
  topics?: string[];
  abstract?: string[];
  results?: string[];
}

interface SearchInput {
  keywords?: string[];
  text?: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private datasetPromise: Promise<RawArticle[]> | null = null;

  constructor(private readonly http: HttpClient) {}

  async search(input: SearchInput): Promise<SearchArticleResult[]> {
    const articles = await this.loadDataset();
    const keywordTokens = this.tokenizeArray(input.keywords ?? []);
    const textTokens = this.tokenizeText(input.text ?? '');
    const terms = Array.from(new Set([...keywordTokens, ...textTokens]));

    if (terms.length === 0) {
      return [];
    }

    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 40) : DEFAULT_LIMIT;

    const scored = articles
      .map((article) => {
        const haystack = this.collectKeywords(article);
        const matchCount = terms.reduce((count, term) => {
          if (haystack.some((field) => field.includes(term))) {
            return count + 1;
          }
          return count;
        }, 0);
        return { article, matchCount };
      })
      .filter(({ matchCount }) => matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, limit)
      .map(({ article, matchCount }) => this.toResult(article, matchCount));

    return scored;
  }

  private async loadDataset(): Promise<RawArticle[]> {
    if (!this.datasetPromise) {
      this.datasetPromise = firstValueFrom(this.http.get<RawArticle[]>(DATA_URL));
    }
    return this.datasetPromise;
  }

  private tokenizeArray(values: string[]): string[] {
    return values
      .flatMap((value) => value.split(/[\s,;\n]+/))
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length > 1);
  }

  private tokenizeText(text: string): string[] {
    if (!text) {
      return [];
    }
    return this.tokenizeArray([text]);
  }

  private safeArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    return [];
  }

  private collectKeywords(article: RawArticle): string[] {
    const keywords = new Set<string>();

    this.safeArray(article.keywords).forEach((kw) => keywords.add(kw.toLowerCase()));
    this.safeArray(article.mesh_terms).forEach((kw) => keywords.add(kw.toLowerCase()));
    this.safeArray(article.topics).forEach((kw) => keywords.add(kw.toLowerCase()));

    if (article.title) keywords.add(String(article.title).toLowerCase());
    if (article.title_pubmed) keywords.add(String(article.title_pubmed).toLowerCase());

    this.safeArray(article.abstract).forEach((section) => keywords.add(section.toLowerCase()));
    this.safeArray(article.results).forEach((section) => keywords.add(section.toLowerCase()));

    return Array.from(keywords);
  }

  private createSnippet(article: RawArticle): string | null {
    const sections = [...this.safeArray(article.abstract), ...this.safeArray(article.results)];
    const text = sections.find((section) => section && section.trim().length > 0);
    if (!text) {
      return null;
    }
    return text.length > 320 ? `${text.slice(0, 317)}…` : text;
  }

  private toResult(article: RawArticle, score: number): SearchArticleResult {
    const id = article.pmid || article.pmcid || article.doi || article.title || crypto.randomUUID();
    const authors = this.safeArray(article.authors);
    return {
      id: String(id),
      title: article.title ?? 'Título desconocido',
      year: article.year ?? undefined,
      authors,
      link: typeof article.link === 'string' ? article.link : null,
      abstractSnippet: this.createSnippet(article),
      keywords: this.safeArray(article.keywords).slice(0, 8),
      score,
    };
  }
}
