import { Injectable, inject, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  private zone = inject(NgZone);
  private socket$: WebSocketSubject<GameMessage> | null = null;
  private messagesSubject = new Subject<GameMessage>();
  private pingInterval: any = null;
  private roomId: string | null = null;

  readonly messages$ = this.messagesSubject.asObservable();

  connect(roomId: string): void {
    this.roomId = roomId;
    this.auth.getIdTokenOnce().subscribe(token => {
      this.openSocket(roomId, token);
    });
  }

  private openSocket(roomId: string, token: string): void {
    const url = `${environment.wsUrl}/ws/${roomId}?token=${token}`;
    this.socket$ = webSocket<GameMessage>({
      url,
      openObserver: {
        next: () => this.startPing(),
      },
      closeObserver: {
        next: () => this.stopPing(),
      },
    });
    this.socket$.pipe(
      catchError(() => EMPTY)
    ).subscribe(msg => {
      if (msg.type === 'pong') return;
      this.zone.run(() => this.messagesSubject.next(msg));
    });
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      try {
        this.socket$?.next({ type: 'ping' } as any);
      } catch {}
    }, 20000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  sendMove(col: number): void {
    this.socket$?.next({ type: 'move', col });
  }

  disconnect(): void {
    this.stopPing();
    this.socket$?.complete();
    this.socket$ = null;
    this.roomId = null;
  }
}
