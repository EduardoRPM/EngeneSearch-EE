import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const WEBHOOK_URL = 'https://n8n.glimpse.uaslp.mx/webhook/cc8da73d-a837-462a-89a1-4a59fe32f094';

@Injectable({ providedIn: 'root' })
export class KeywordService {
  constructor(private readonly http: HttpClient) {}

  async fetchKeywords(prompt: string): Promise<string[]> {
    if (!prompt.trim()) {
      return [];
    }

    const payload = await firstValueFrom(
      this.http.post<unknown>(
        WEBHOOK_URL,
        { prompt },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    return this.normalizePayload(payload);
  }

  private normalizePayload(payload: unknown): string[] {
    const results: string[] = [];

    const processValue = (value: unknown) => {
      if (typeof value === 'string') {
        results.push(...this.splitAndClean(value));
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => processValue(entry));
        return;
      }

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;

        const output = record['output'];
        if (typeof output === 'string') {
          results.push(...this.splitAndClean(output));
        } else if (Array.isArray(output)) {
          output.forEach((entry) => processValue(entry));
        } else {
          Object.values(record).forEach((entry) => processValue(entry));
        }
      }
    };

    processValue(payload);

    return Array.from(new Set(results.map((item) => item.trim()))).filter(Boolean);
  }

  private splitAndClean(text: string): string[] {
    return text
      .split(/[,;\n]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);
  }
}
