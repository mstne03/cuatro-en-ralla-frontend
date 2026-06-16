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

  grid: string[][] = [];
  currentTurn = '';
  myRole = '';
  gameState = '';
  result = '';
  statusMessage = 'Conectando...';

  ngOnInit() {
    const roomId = this.route.snapshot.paramMap.get('id')!;
    this.ws.connect(roomId);
    this.sub = this.ws.messages$.subscribe(msg => this.handleMessage(msg));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.ws.disconnect();
  }

  handleMessage(msg: GameMessage) {
    switch (msg.type) {
      case 'state':
        this.grid = msg.board?.grid ?? [];
        this.currentTurn = msg.current_turn ?? '';
        this.gameState = msg.state ?? '';
        this.myRole = msg.your_role ?? '';
        this.statusMessage = this.gameState === 'in_progress'
          ? (this.myRole === this.currentTurn ? 'Tu turno' : 'Turno del rival')
          : 'Esperando al rival...';
        break;

      case 'start':
        this.gameState = 'in_progress';
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
        break;

      case 'error':
        this.statusMessage = `Error: ${msg.message}`;
        break;
    }
  }

  getResultMessage(): string {
    if (this.result === 'draw') return 'Empate';
    const winnerRole = this.result === 'player1_wins' ? 'player1' : 'player2';
    return winnerRole === this.myRole ? '¡Has ganado!' : 'Has perdido.';
  }

  onColumnClicked(col: number) {
    this.ws.sendMove(col);
  }

  backToLobby() {
    this.router.navigate(['/lobby']);
  }
}
