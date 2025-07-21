import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ConfigService } from './config.service';
import {
  Note,
  NotesResponse,
  MyNotesResponse,
  NoteCreateRequest,
  NoteUpdateRequest,
  NoteReplyRequest,
  NoteReplyResponse
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get all notes with optional filtering
   */
  getAllNotes(filters?: {
    case_id?: number;
    author_id?: number;
    approval_record_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Observable<Note[]> {
    const url = this.buildUrl('/case/notes/');
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Note[]>(url, { params }).pipe(
      map(response => {
        console.log('✅ NotesService: Notes loaded', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get notes for a specific case
   */
  getNotesByCase(caseId: number): Observable<NotesResponse> {
    const url = this.buildUrl(`/case/notes/by_case/${caseId}/`);

    console.log('📋 NotesService: Getting notes for case:', caseId);

    return this.http.get<NotesResponse>(url).pipe(
      map(response => {
        console.log('✅ NotesService: Notes loaded for case', caseId, ':', response.total_notes, 'notes');
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new note
   */
  createNote(noteData: NoteCreateRequest): Observable<Note> {
    const url = this.buildUrl('/case/notes/');

    console.log('📝 NotesService: Creating note:', noteData);

    return this.http.post<Note>(url, noteData).pipe(
      map(response => {
        console.log('✅ NotesService: Note created successfully:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing note
   */
  updateNote(noteId: number, noteData: NoteUpdateRequest): Observable<Note> {
    const url = this.buildUrl(`/case/notes/${noteId}/`);

    console.log('🔄 NotesService: Updating note:', noteId, noteData);

    return this.http.patch<Note>(url, noteData).pipe(
      map(response => {
        console.log('✅ NotesService: Note updated successfully:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a note
   */
  deleteNote(noteId: number): Observable<void> {
    const url = this.buildUrl(`/case/notes/${noteId}/`);

    console.log('🗑️ NotesService: Deleting note:', noteId);

    return this.http.delete<void>(url).pipe(
      map(() => {
        console.log('✅ NotesService: Note deleted successfully');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get notes created by the authenticated user
   */
  getMyNotes(): Observable<MyNotesResponse> {
    const url = this.buildUrl('/case/notes/my_notes/');

    return this.http.get<MyNotesResponse>(url).pipe(
      map(response => {
        console.log('✅ NotesService: My notes loaded:', response.total_notes, 'notes');
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Reply to a note
   */
  replyToNote(noteId: number, replyData: NoteReplyRequest): Observable<NoteReplyResponse> {
    const url = this.buildUrl(`/case/notes/${noteId}/add_reply/`);

    console.log('💬 NotesService: Replying to note:', noteId, replyData);

    return this.http.post<NoteReplyResponse>(url, replyData).pipe(
      map(response => {
        console.log('✅ NotesService: Reply created successfully:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    const baseUrl = this.configService.getBaseUrl();
    if (!baseUrl) {
      throw new Error('Base URL not configured');
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return `${baseUrl}${cleanEndpoint}`;
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('❌ NotesService Error:', error);
    let errorMessage = 'An error occurred';

    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  };
}
