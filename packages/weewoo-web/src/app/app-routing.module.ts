import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import {
  AngularFireAuthGuard,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard'
import { DashboardComponent } from './dashboard/dashboard.component'
import { VehicleLocationMapComponent } from './vehicle-location-map/vehicle-location-map.component'
import { LoginComponent } from './login/login.component'

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login'])

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'map',
    component: VehicleLocationMapComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'login',
    component: LoginComponent,
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
