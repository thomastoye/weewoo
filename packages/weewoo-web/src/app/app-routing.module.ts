import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { DashboardComponent } from './dashboard/dashboard.component'
import { VehicleLocationMapComponent } from './vehicle-location-map/vehicle-location-map.component'

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'map',
    component: VehicleLocationMapComponent,
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
