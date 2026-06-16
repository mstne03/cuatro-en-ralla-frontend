import { Injectable, inject } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, EMPTY } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface GameMessage {
  type: string;
  board?: { grid: string[][] };
  current_turn?: string;
  state?: string;
  result?: string;
  col?: number;
  message?: string;
  your_role?: string;
}

@Injectable({ providedIn: 'root' })
export class GameWsService {
  private auth = inject(AuthService);
  private socket$: WebSocketSubject<GameMessage> | null = null;
  private messagesSubject = new Subject<GameMessage>();

  readonly messages$ = this.messagesSubject.asObservable();

  connect(roomId: string): void {
    this.auth.getIdToken().pipe(take(1)).subscribe(token => {
      if (!token) return;
      const url = `${environment.wsUrl}/ws/${roomId}?token=${token}`;
      this.socket$ = webSocket<GameMessage>(url);
      this.socket$.pipe(
        catchError(() => EMPTY)
      ).subscribe(msg => this.messagesSubject.next(msg));
    });
  }

  sendMove(col: number): void {
    this.socket$?.next({ type: 'move', col });
  }

  disconnect(): void {
    this.socket$?.complete();
    this.socket$ = null;
  }
}
