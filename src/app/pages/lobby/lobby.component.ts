import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { take } from 'rxjs/operators';

interface Room {
  room_id: string;
  state: string;
  player1: string | null;
  player2: string | null;
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
  busy = false;

  ngOnInit() {
    this.auth.user$.pipe(take(1)).subscribe(u => {
      this.userEmail = u?.email ?? '';
    });
    this.startPolling();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  private startPolling() {
    this.fetchRooms();
    this.pollSub = interval(3000).subscribe(() => this.fetchRooms());
  }

  private async fetchRooms() {
    try {
      const token = await this.auth.getIdToken().pipe(take(1)).toPromise();
      const res = await fetch(`${environment.apiUrl}/lobby/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      this.rooms = data.rooms;
    } catch {}
  }

  async createRoom() {
    this.busy = true;
    this.error = '';
    try {
      const token = await this.auth.getIdToken().pipe(take(1)).toPromise();
      const res = await fetch(`${environment.apiUrl}/lobby/rooms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      this.router.navigate(['/game', data.room_id]);
    } catch (e: any) {
      this.error = e.message ?? 'No se pudo crear la sala';
    } finally {
      this.busy = false;
    }
  }

  async joinRoom(roomId: string) {
    this.busy = true;
    this.error = '';
    try {
      const token = await this.auth.getIdToken().pipe(take(1)).toPromise();
      const res = await fetch(`${environment.apiUrl}/lobby/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Error: ${res.status}`);
      }
      this.router.navigate(['/game', roomId]);
    } catch (e: any) {
      this.error = e.message ?? 'No se pudo unirse a la sala';
    } finally {
      this.busy = false;
    }
  }

  async signOut() {
    await this.auth.signOut().toPromise();
    this.router.navigate(['/login']);
  }

  stateLabel(room: Room): string {
    if (room.state === 'waiting') return room.joinable ? 'Esperando jugador' : 'Llena';
    if (room.state === 'in_progress') return 'En curso';
    return 'Terminada';
  }
}
