import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NavigationComponent } from './navigation/navigation.component'
import { LayoutModule } from '@angular/cdk/layout'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { DashboardComponent } from './dashboard/dashboard.component'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatCardModule } from '@angular/material/card'
import { MatMenuModule } from '@angular/material/menu'
import { VehicleLocationMapComponent } from './vehicle-location-map/vehicle-location-map.component'
import { GoogleMapsModule } from '@angular/google-maps'
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard'
import { AngularFireAuthModule } from '@angular/fire/auth'
import { LoginComponent } from './login/login.component'
import { environment } from 'src/environments/environment'
import { AngularFireModule } from '@angular/fire'
import { AUTH_SERVICE, FirebaseAuthService } from './services/auth.service'
import {
  FakeVehicleLocationService,
  VEHICLE_LOCATION_SERVICE,
} from './services/live-vehicle-location.service'

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    DashboardComponent,
    VehicleLocationMapComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    GoogleMapsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireAuthGuardModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
  ],
  providers: [
    { provide: AUTH_SERVICE, useClass: FirebaseAuthService },
    { provide: VEHICLE_LOCATION_SERVICE, useClass: FakeVehicleLocationService },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
