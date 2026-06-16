import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameWsService, GameMessage } from '../../core/game-ws.service';
import { BoardComponent } from '../../shared/board/board.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [BoardComponent],
  templateUrl: './game.component.html',
})
export class GameComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ws = inject(GameWsService);
  private sub?: Subscription;

  roomId = '';
  grid: string[][] = Array.from({ length: 6 }, () => Array(7).fill('empty'));
  currentTurn = '';
  myRole = '';
  gameState = '';
  result = '';
  statusMessage = 'Conectando...';
  waitingForOpponent = true;

  get gameUrl(): string {
    return window.location.href;
  }

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id')!;
    // connect() resets the internal Subject, so subscribe AFTER connect()
    this.ws.connect(this.roomId);
    this.sub = this.ws.messages$.subscribe(msg => this.handleMessage(msg));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.ws.disconnect();
  }

  handleMessage(msg: GameMessage) {
    console.log('[WS received]', msg);
    switch (msg.type) {
      case 'state':
        this.grid = msg.board?.grid ?? this.grid;
        this.currentTurn = msg.current_turn ?? '';
        this.gameState = msg.state ?? '';
        this.myRole = msg.your_role ?? '';
        this.waitingForOpponent = msg.state !== 'in_progress';
        this.statusMessage = this.waitingForOpponent
          ? 'Esperando al rival...'
          : (this.myRole === this.currentTurn ? 'Tu turno' : 'Turno del rival');
        break;

      case 'start':
        this.gameState = 'in_progress';
        this.waitingForOpponent = false;
        if (msg.your_role) this.myRole = msg.your_role;
        if (msg.current_turn) this.currentTurn = msg.current_turn;
        this.statusMessage = this.myRole === this.currentTurn ? 'Tu turno' : 'Turno del rival';
        break;

      case 'move':
        this.grid = msg.board?.grid ?? this.grid;
        this.currentTurn = msg.current_turn ?? this.currentTurn;
        this.result = msg.result ?? '';
        if (this.result && this.result !== 'ongoing') {
          this.statusMessage = this.getResultMessage();
          this.gameState = 'finished';
        } else {
          this.statusMessage = this.myRole === this.currentTurn ? 'Tu turno' : 'Turno del rival';
        }
        break;

      case 'opponent_disconnected':
        this.statusMessage = 'El rival se ha desconectado.';
        this.gameState = 'finished';
        this.waitingForOpponent = false;
        break;

      case 'error':
        this.statusMessage = `Error: ${msg.message}`;
        break;
    }
  }

  getResultMessage(): string {
    if (this.result === 'draw') return '¡Empate!';
    const winnerRole = this.result === 'player1_wins' ? 'player1' : 'player2';
    return winnerRole === this.myRole ? '¡Has ganado!' : 'Has perdido.';
  }

  onColumnClicked(col: number) {
    this.ws.sendMove(col);
  }

  copyLink() {
    navigator.clipboard.writeText(this.gameUrl);
  }

  backToLobby() {
    this.router.navigate(['/lobby']);
  }
}
