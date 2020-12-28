import { BrowserModule, DomSanitizer } from '@angular/platform-browser'
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
import { MatIconModule, MatIconRegistry } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { DashboardComponent } from './dashboard/dashboard.component'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatCardModule } from '@angular/material/card'
import { MatMenuModule } from '@angular/material/menu'
import { MatTableModule } from '@angular/material/table'
import { VehicleLocationMapComponent } from './vehicle-location-map/vehicle-location-map.component'
import { GoogleMapsModule } from '@angular/google-maps'
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard'
import { AngularFireAuthModule } from '@angular/fire/auth'
import { LoginComponent } from './login/login.component'
import { environment } from 'src/environments/environment'
import { AngularFireModule } from '@angular/fire'
import { AngularFirestoreModule } from '@angular/fire/firestore'
import { AUTH_SERVICE, FirebaseAuthService } from './services/auth.service'
import {
  FakeVehicleLocationService,
  VEHICLE_LOCATION_SERVICE,
} from './services/live-vehicle-location.service'
import { LoraDeviceListComponent } from './lora-device-list/lora-device-list.component'
import {
  FormatPurePipeModule,
  FormatDistanceStrictPurePipeModule,
  DateFnsConfigurationService,
} from 'ngx-date-fns'
import { nlBE } from 'date-fns/locale'
import { HttpClientModule } from '@angular/common/http'
import {
  CurrentDateServiceImpl,
  CURRENT_DATE_SERVICE,
} from './services/current-date.service'
import { MatTooltipModule } from '@angular/material/tooltip'
import {
  FirestoreLoraDeviceInformationService,
  LORA_DEVICE_INFORMATION_SERVICE,
} from './services/lora-device-information.service'

const belgianConfig = new DateFnsConfigurationService()
belgianConfig.setLocale(nlBE)

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    DashboardComponent,
    VehicleLocationMapComponent,
    LoginComponent,
    LoraDeviceListComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    GoogleMapsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireAuthGuardModule,
    AngularFirestoreModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatTableModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatTooltipModule,
    MatMenuModule,
    FormatDistanceStrictPurePipeModule,
    FormatPurePipeModule,
  ],
  providers: [
    { provide: AUTH_SERVICE, useClass: FirebaseAuthService },
    { provide: VEHICLE_LOCATION_SERVICE, useClass: FakeVehicleLocationService },
    { provide: CURRENT_DATE_SERVICE, useClass: CurrentDateServiceImpl },
    {
      provide: LORA_DEVICE_INFORMATION_SERVICE,
      useClass: FirestoreLoraDeviceInformationService,
    },
    { provide: DateFnsConfigurationService, useValue: belgianConfig },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(iconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
    iconRegistry.addSvgIconSet(
      domSanitizer.bypassSecurityTrustResourceUrl('./assets/mdi.svg')
    )
  }
}
