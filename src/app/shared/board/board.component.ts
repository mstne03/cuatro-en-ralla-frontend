import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
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
    if (this.isMyTurn) this.columnClicked.emit(colIndex);
  }

  cols(): number[] {
    return Array.from({ length: 7 }, (_, i) => i);
  }
}
