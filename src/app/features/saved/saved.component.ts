import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SavedArticlesComponent, SavedArticleCard } from './saved-articles/saved-articles.component';
import { buildDescription, formatAuthor } from '../../core/utils/article-utils';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SavedArticlesComponent],
  templateUrl: './saved.component.html',
})
export class SavedComponent {
  readonly savedArticles$: Observable<SavedArticleCard[]>;

  constructor(private readonly articleService: ArticleService) {
    this.savedArticles$ = this.articleService.getArticles().pipe(
      map((articles) =>
        articles
          .filter((article) => article.saved)
          .map<SavedArticleCard>((article) => ({
            id: article.id,
            title: article.title ?? article.title_pubmed ?? 'Doc without title',
            year: article.year ?? undefined,
            author: formatAuthor(article.authors ?? []),
            tags: (article.keywords ?? []).slice(0, 6),
            description: buildDescription(article),
            likes: article.citations?.citation_count,
            comments: article.topics?.length,
            image: '/assets/logoN.png',
            link: article.link ?? undefined,
            badge: 'Saved',
          })),
      ),
    );
  }
}
