import { Component, Inject } from '@angular/core'
import { Observable } from 'rxjs'
import { MatSnackBar } from '@angular/material/snack-bar'
import { AuthService, AUTH_SERVICE } from '../services/auth.service'

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
  isLoggedIn$: Observable<boolean>

  constructor(
    @Inject(AUTH_SERVICE) private auth: AuthService,
    private snack: MatSnackBar
  ) {
    this.isLoggedIn$ = this.auth.isLoggedIn$()
  }

  async logout(): Promise<void> {
    await this.auth.signOut()
    this.snack.open(`You're now logged out.`, undefined, { duration: 3000 })
  }

  async login(): Promise<void> {
    try {
      const loggedIn = await this.auth.signIn()
      this.snack.open(`Logged in as ${loggedIn.email}!`, undefined, {
        duration: 3000,
      })
    } catch (err) {
      console.error('Could not log user in', err)
      this.snack.open('Could not log in...', undefined, {
        duration: 5000,
      })
    }
  }
}
