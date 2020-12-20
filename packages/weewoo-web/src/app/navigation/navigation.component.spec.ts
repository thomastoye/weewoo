import { LayoutModule } from '@angular/cdk/layout'
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatToolbarModule } from '@angular/material/toolbar'
import { NavigationComponent } from './navigation.component'
import { AUTH_SERVICE, MockAuthService } from '../services/auth.service'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { RouterTestingModule } from '@angular/router/testing'

describe('NavigationComponent', () => {
  let component: NavigationComponent
  let fixture: ComponentFixture<NavigationComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [NavigationComponent],
        imports: [
          NoopAnimationsModule,
          RouterTestingModule,
          LayoutModule,
          MatButtonModule,
          MatIconModule,
          MatListModule,
          MatSidenavModule,
          MatToolbarModule,
          MatSnackBarModule,
        ],
        providers: [{ provide: AUTH_SERVICE, useClass: MockAuthService }],
      }).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should compile', () => {
    expect(component).toBeTruthy()
  })

  it('should show login and hide logout button', async () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('#loginButton')).not.toBe(null)
    expect(fixture.nativeElement.querySelector('#logoutButton')).toBe(null)
  })

  it('should show logout and hide login button when logged in', async () => {
    await component.login()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('#loginButton')).toBe(null)
    expect(fixture.nativeElement.querySelector('#logoutButton')).not.toBe(null)
  })

  it('should show login and hide logout button when logging out', async () => {
    await component.logout()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('#logoutButton')).toBe(null)
    expect(fixture.nativeElement.querySelector('#loginButton')).not.toBe(null)
  })
})
