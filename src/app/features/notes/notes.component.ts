import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotesService } from '../../core/services/notes.service';
import { AuthService } from '../../core/services/auth.service';
import { Note, NotesResponse } from '../../core/models/interfaces';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="notes-container">
      <mat-card class="notes-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="notes-icon">comment</mat-icon>
            Notes & Comments
            <span class="notes-count" *ngIf="notes.length > 0">({{ notes.length }})</span>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Add Note Form -->
          <form [formGroup]="noteForm" (ngSubmit)="submitNote()" class="note-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Add a note</mat-label>
              <textarea matInput
                        formControlName="content"
                        placeholder="Type your note here..."
                        rows="3"
                        [disabled]="isSubmitting"></textarea>
              <mat-error *ngIf="noteForm.get('content')?.hasError('required')">
                Note content is required
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelNote()" [disabled]="isSubmitting">
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="!noteForm.valid || isSubmitting">
                <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
                <span *ngIf="!isSubmitting">
                  {{ editingNote ? 'Update Note' : 'Add Note' }}
                </span>
              </button>
            </div>
          </form>

          <mat-divider class="notes-divider"></mat-divider>

          <!-- Loading State -->
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading notes...</p>
          </div>

          <!-- Notes List -->
          <div class="notes-list" *ngIf="!isLoading">
            <div class="empty-state" *ngIf="notes.length === 0">
              <mat-icon class="empty-icon">chat_bubble_outline</mat-icon>
              <p>No notes yet. Be the first to add a note!</p>
            </div>

            <div class="note-item" *ngFor="let note of notes">
              <div class="note-header">
                <div class="note-author">
                  <mat-icon class="author-icon">account_circle</mat-icon>
                  <div class="author-info">
                    <span class="author-name">{{ note.author_full_name }}</span>
                    <span class="author-username">&#64;{{ note.author_username }}</span>
                  </div>
                </div>

                <div class="note-actions" *ngIf="canEditNote(note)">
                  <button mat-icon-button [matMenuTriggerFor]="noteMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #noteMenu="matMenu">
                    <button mat-menu-item (click)="editNote(note)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="deleteNote(note)">
                      <mat-icon>delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </div>
              </div>

              <div class="note-content">
                {{ note.content }}
              </div>

              <div class="note-footer">
                <span class="note-date">
                  {{ formatDate(note.created_at) }}
                  <span *ngIf="note.updated_at !== note.created_at" class="edited-label">
                    (edited {{ formatDate(note.updated_at) }})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .notes-container {
      width: 100%;
      margin-top: 24px;
    }

    .notes-card {
      border-radius: 16px;
    }

    .notes-icon {
      margin-right: 8px;
      vertical-align: middle;
    }

    .notes-count {
      font-size: 16px;
      color: #666;
      font-weight: normal;
      margin-left: 8px;
    }

    .note-form {
      margin-top: 16px;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }

    .notes-divider {
      margin: 24px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }

    .loading-container p {
      color: #666;
      margin: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: #999;
    }

    .empty-icon {
      font-size: 48px;
      color: #ddd;
      margin-bottom: 16px;
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .note-item {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #3498db;
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .note-author {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .author-icon {
      font-size: 32px;
      color: #666;
    }

    .author-info {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-weight: 600;
      color: #333;
    }

    .author-username {
      font-size: 12px;
      color: #666;
    }

    .note-content {
      padding: 0 0 12px 40px;
      color: #333;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .note-footer {
      padding: 0 0 0 40px;
    }

    .note-date {
      font-size: 12px;
      color: #999;
    }

    .edited-label {
      font-style: italic;
    }

    @media (max-width: 768px) {
      .note-content,
      .note-footer {
        padding-left: 0;
      }
    }
  `]
})
export class NotesComponent implements OnInit, OnDestroy {
  @Input() caseId!: number;

  noteForm: FormGroup;
  notes: Note[] = [];
  isLoading = false;
  isSubmitting = false;
  editingNote: Note | null = null;
  currentUserId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private notesService: NotesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.noteForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    // Get current user info
    const userInfo = this.authService.getUserInfo();
    this.currentUserId = userInfo?.userId || null;

    // Load notes for the case
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotes(): void {
    if (!this.caseId) return;

    this.isLoading = true;

    this.notesService.getNotesByCase(this.caseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NotesResponse) => {
          this.notes = response.notes || [];
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading notes:', error);
          this.isLoading = false;
          this.snackBar.open('Failed to load notes', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  submitNote(): void {
    if (!this.noteForm.valid) return;

    this.isSubmitting = true;
    const content = this.noteForm.value.content.trim();

    if (this.editingNote) {
      // Update existing note
      this.notesService.updateNote(this.editingNote.id, { content })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedNote: Note) => {
            const index = this.notes.findIndex(n => n.id === updatedNote.id);
            if (index !== -1) {
              this.notes[index] = updatedNote;
            }
            this.resetForm();
            this.snackBar.open('Note updated successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error: any) => {
            console.error('Error updating note:', error);
            this.isSubmitting = false;
            this.snackBar.open('Failed to update note', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Create new note
      this.notesService.createNote({ case: this.caseId, content })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newNote: Note) => {
            this.notes.unshift(newNote); // Add to beginning of list
            this.resetForm();
            this.snackBar.open('Note added successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error: any) => {
            console.error('Error creating note:', error);
            this.isSubmitting = false;
            this.snackBar.open('Failed to add note', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  editNote(note: Note): void {
    this.editingNote = note;
    this.noteForm.patchValue({ content: note.content });
  }

  deleteNote(note: Note): void {
    if (!confirm('Are you sure you want to delete this note?')) return;

    this.notesService.deleteNote(note.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notes = this.notes.filter(n => n.id !== note.id);
          this.snackBar.open('Note deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error: any) => {
          console.error('Error deleting note:', error);
          this.snackBar.open('Failed to delete note', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  cancelNote(): void {
    this.resetForm();
  }

  canEditNote(note: Note): boolean {
    return this.currentUserId !== null && note.author === this.currentUserId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private resetForm(): void {
    this.noteForm.reset();
    this.editingNote = null;
    this.isSubmitting = false;
  }
}
