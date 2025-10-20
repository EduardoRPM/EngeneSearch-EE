import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { KeywordService } from '../../../core/services/keyword.service';

@Component({
  selector: 'app-search-assist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-assist.component.html',
  styleUrl: './search-assist.component.css',
})
export class SearchAssistComponent implements OnChanges, OnDestroy {
  @Input() sourceText = '';
  @Input() debounceMs = 500;
  @Input() freezeMs = 5000;
  @Input() showManualTrigger = true;

  @Output() selectKeyword = new EventEmitter<string>();
  @Output() suggestionsChange = new EventEmitter<string[]>();

  loading = false;
  keywords: string[] = [];
  error: string | null = null;
  showRaw = false;
  rawJson: string | null = null;

  private autoTimeout: ReturnType<typeof setTimeout> | null = null;
  private cooldownUntil = 0;
  private lastPrompt = '';
  private destroyed = false;

  constructor(private readonly keywordService: KeywordService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('sourceText' in changes) {
      this.handleSourceChange();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.autoTimeout) {
      clearTimeout(this.autoTimeout);
      this.autoTimeout = null;
    }
  }

  async handleManualFetch(): Promise<void> {
    await this.fetchKeywords({ force: true });
  }

  handleSelect(keyword: string): void {
    this.selectKeyword.emit(keyword);
  }

  toggleRaw(): void {
    this.showRaw = !this.showRaw;
  }

  private handleSourceChange(): void {
    if (this.autoTimeout) {
      clearTimeout(this.autoTimeout);
      this.autoTimeout = null;
    }

    const trimmed = this.sourceText.trim();

    if (!trimmed) {
      this.resetState();
      return;
    }

    if (!/\s$/.test(this.sourceText)) {
      return;
    }

    const now = Date.now();
    const earliest = now + this.debounceMs;
    const targetTime = Math.max(earliest, this.cooldownUntil);

    this.autoTimeout = setTimeout(async () => {
      this.autoTimeout = null;
      await this.fetchKeywords({});
      this.cooldownUntil = Date.now() + this.freezeMs;
    }, targetTime - now);
  }

  private resetState(): void {
    this.keywords = [];
    this.error = null;
    this.rawJson = null;
    this.suggestionsChange.emit([]);
    this.lastPrompt = '';
    this.cooldownUntil = 0;
  }

  private async fetchKeywords(options: { force?: boolean }): Promise<void> {
    const prompt = this.sourceText.trim();
    const force = options.force ?? false;

    if (!prompt) {
      if (force) {
        this.error = 'Please write something in the main textarea first.';
      }
      return;
    }

    if (!force && prompt === this.lastPrompt) {
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const keywords = await this.keywordService.fetchKeywords(prompt);
      this.keywords = keywords;
      this.rawJson = JSON.stringify(keywords, null, 2);
      this.suggestionsChange.emit(keywords);
      this.lastPrompt = prompt;
    } catch (error) {
      console.error('Keyword fetch error', error);
      this.error = error instanceof Error ? error.message : 'Unknown error';
      this.keywords = [];
      this.rawJson = null;
      this.suggestionsChange.emit([]);
      this.lastPrompt = '';
    } finally {
      if (!this.destroyed) {
        this.loading = false;
      }
    }
  }
}
