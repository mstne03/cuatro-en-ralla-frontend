import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [],
  templateUrl: './board.component.html',
})
export class BoardComponent {
  @Input() grid: string[][] = [];
  @Input() myRole: string = '';
  @Input() currentTurn: string = '';
  @Input() gameOver: boolean = false;
  @Output() columnClicked = new EventEmitter<number>();

  get isMyTurn(): boolean {
    return this.myRole === this.currentTurn && !this.gameOver;
  }

  onColumnClick(colIndex: number): void {
    if (this.isMyTurn) {
      this.columnClicked.emit(colIndex);
    }
  }

  cellColor(cell: string): string {
    if (cell === 'player1') return '#ef4444';
    if (cell === 'player2') return '#eab308';
    return '#e5e7eb';
  }

  cols(): number[] {
    return Array.from({ length: 7 }, (_, i) => i);
  }
}
