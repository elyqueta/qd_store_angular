import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { Highlight, HighlightListResponse, HighlightPlacement } from '../models/highlight.model';

@Injectable({ providedIn: 'root' })
export class HighlightApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private readonly endpoint = `${this.apiUrl}/api/v1/highlights`;

  listHighlights(placement: HighlightPlacement): Observable<Highlight[]> {
    const params = new HttpParams().set('placement', placement);

    return this.http
      .get<HighlightListResponse>(this.endpoint, { params })
      .pipe(map((response) => response.data));
  }

  listPublicHighlights(): Observable<{
    hero: Highlight[];
    showcase: Highlight[];
    categoryBlock: Highlight[];
  }> {
    return forkJoin({
      hero: this.listHighlights('hero'),
      showcase: this.listHighlights('showcase'),
      categoryBlock: this.listHighlights('category_block'),
    });
  }
}
