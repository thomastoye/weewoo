import { Injectable, InjectionToken } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth'
import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import firebase from 'firebase/app'

export type AuthService = {
  isLoggedIn$(): Observable<boolean>
  signIn(): Promise<{ email: string; displayName: string | null }>
  signOut(): Promise<void>
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService implements AuthService {
  constructor(private auth: AngularFireAuth) {}

  isLoggedIn$(): Observable<boolean> {
    return this.auth.user.pipe(map((user) => user != null))
  }

  async signIn(): Promise<{ email: string; displayName: string | null }> {
    const loggedIn = await this.auth.signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    )

    return {
      email: loggedIn.user?.email as string,
      displayName: loggedIn.user?.displayName || null,
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut()
  }
}

export class MockAuthService implements AuthService {
  #loggedIn = new BehaviorSubject<boolean>(false)

  async signIn(): Promise<{ email: string; displayName: string | null }> {
    this.#loggedIn.next(true)

    return {
      email: 'example@example.org',
      displayName: 'John Smith',
    }
  }

  async signOut(): Promise<void> {
    this.#loggedIn.next(false)
  }

  isLoggedIn$(): Observable<boolean> {
    return this.#loggedIn.asObservable()
  }
}

export const AUTH_SERVICE = new InjectionToken<AuthService>('authservice')
