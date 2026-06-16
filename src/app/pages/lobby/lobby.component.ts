import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

interface Room {
  room_id: string;
  state: string;
  players: number;
  joinable: boolean;
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [],
  templateUrl: './lobby.component.html',
})
export class LobbyComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private pollSub?: Subscription;

  userEmail = '';
  rooms: Room[] = [];
  error = '';

  ngOnInit() {
    this.auth.user$.pipe(filter(u => u !== null), first()).subscribe(u => {
      this.userEmail = u?.email ?? '';
    });
    this.fetchRooms();
    this.pollSub = interval(3000).subscribe(() => this.fetchRooms());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  private async fetchRooms() {
    try {
      const token = await this.auth.getIdTokenOnce().toPromise();
      const res = await fetch(`${environment.apiUrl}/lobby/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      this.rooms = data.rooms;
    } catch (e) {
      console.error('fetchRooms error:', e);
    }
  }

  createRoom() {
    const roomId = crypto.randomUUID();
    this.router.navigate(['/game', roomId]);
  }

  joinRoom(roomId: string) {
    this.router.navigate(['/game', roomId]);
  }

  async signOut() {
    await this.auth.signOut().toPromise();
    this.router.navigate(['/login']);
  }

  stateLabel(room: Room): string {
    if (room.state === 'waiting') return `Esperando (${room.players}/2)`;
    if (room.state === 'in_progress') return 'En curso';
    return 'Terminada';
  }
}
