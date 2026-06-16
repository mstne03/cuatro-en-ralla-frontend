import { Injectable, inject, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Subscription, Observable } from 'rxjs';
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
  players?: number;
}

@Injectable({ providedIn: 'root' })
export class GameWsService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);

  private socket$: WebSocketSubject<GameMessage> | null = null;
  private socketSub: Subscription | null = null;
  private tokenSub: Subscription | null = null;
  private pingInterval: any = null;

  // Single permanent Subject — never replaced, only cleared on disconnect
  private readonly messagesSubject = new Subject<GameMessage>();
  readonly messages$: Observable<GameMessage> = this.messagesSubject.asObservable();

  connect(roomId: string): void {
    // Tear down any previous connection first
    this.closeAll();

    this.tokenSub = this.auth.getIdTokenOnce().subscribe(token => {
      // Guard: disconnect() called while token was resolving
      if (this.tokenSub === null) return;

      const url = `${environment.wsUrl}/ws/${roomId}?token=${token}`;
      this.socket$ = webSocket<GameMessage>({
        url,
        openObserver: { next: () => this.startPing() },
        closeObserver: { next: () => this.stopPing() },
      });

      this.socketSub = this.socket$.subscribe({
        next: msg => {
          if (msg.type === 'pong') return;
          this.zone.run(() => this.messagesSubject.next(msg));
        },
        error: err => {
          console.error('[WS error]', err);
          this.zone.run(() =>
            this.messagesSubject.next({ type: 'error', message: 'Conexión perdida' })
          );
        },
        complete: () => console.warn('[WS closed]'),
      });
    });
  }

  sendMove(col: number): void {
    this.socket$?.next({ type: 'move', col });
  }

  disconnect(): void {
    this.closeAll();
  }

  private closeAll(): void {
    this.stopPing();
    this.tokenSub?.unsubscribe();
    this.tokenSub = null;
    this.socketSub?.unsubscribe();
    this.socketSub = null;
    this.socket$?.complete();
    this.socket$ = null;
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      try { this.socket$?.next({ type: 'ping' } as any); } catch {}
    }, 20000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
