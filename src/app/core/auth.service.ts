import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  user,
} from '@angular/fire/auth';
import { from, Observable, switchMap, of, filter, first } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  readonly user$ = user(this.auth);

  getIdToken(): Observable<string | null> {
    return this.user$.pipe(
      switchMap(u => (u ? from(u.getIdToken()) : of(null)))
    );
  }

  /** Waits for Firebase Auth to resolve, then returns the token. Never emits null. */
  getIdTokenOnce(): Observable<string> {
    return this.user$.pipe(
      filter(u => u !== null),
      first(),
      switchMap(u => from(u!.getIdToken()))
    );
  }

  signInWithEmail(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  registerWithEmail(email: string, password: string) {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  signOut() {
    return from(signOut(this.auth));
  }
}
