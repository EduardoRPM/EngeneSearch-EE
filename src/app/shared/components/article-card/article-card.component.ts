import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ArticleCardData {
  id: string;
  title: string;
  year?: string;
  author?: string;
  tags?: string[];
  description?: string;
  likes?: number;
  comments?: number;
  image?: string | null;
  link?: string | null;
  badge?: string;
}

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.css',
})
export class ArticleCardComponent {
  @Input({ required: true }) article!: ArticleCardData;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() isBookmarked = false;
  @Input() disableBookmark = false;

  @Output() bookmarkToggle = new EventEmitter<ArticleCardData>();
  @Output() tagClick = new EventEmitter<string>();
  @Output() open = new EventEmitter<ArticleCardData>();

  readonly fallbackImage = '/assets/logo.png';

  handleBookmark(): void {
    if (this.disableBookmark) {
      return;
    }
    this.bookmarkToggle.emit(this.article);
  }

  handleTagClick(tag: string): void {
    this.tagClick.emit(tag);
  }

  handleOpen(): void {
    this.open.emit(this.article);
  }

  trackByIndex(_index: number, item: string): string {
    return item;
  }
}
