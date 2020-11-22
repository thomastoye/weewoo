import { Component, OnInit, ViewChild } from '@angular/core'
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps'
import { Observable } from 'rxjs'
import { UntilDestroy } from '@ngneat/until-destroy'
import {
  FakeVehicleLocationService,
  VehicleLocation,
} from './live-vehicle-location.service'

const AMBULANCE_ICON = {
  url: '/assets/icons/ambulance.svg',
  scaledSize: new google.maps.Size(25, 25),
}

@UntilDestroy()
@Component({
  selector: 'app-vehicle-location-map',
  templateUrl: './vehicle-location-map.component.html',
  styleUrls: ['./vehicle-location-map.component.scss'],
})
export class VehicleLocationMapComponent implements OnInit {
  @ViewChild(GoogleMap) googleMap: GoogleMap | undefined
  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined

  center: google.maps.LatLngLiteral = { lat: 51, lng: 3 }
  zoom = 8

  vehicleLocations$: Observable<readonly VehicleLocation[]>

  selectedVehicle: {
    marker: MapMarker
    vehicleId: string
    vehicleFriendlyName: string
  } | null = null

  constructor(private locationService: FakeVehicleLocationService) {
    this.vehicleLocations$ = locationService.getLocations()
  }

  ngOnInit(): void {}

  openInfoWindow(marker: MapMarker, vehicleLocation: VehicleLocation): void {
    this.infoWindow?.open(marker)
    this.selectedVehicle = {
      marker,
      vehicleId: vehicleLocation.vehicleId,
      vehicleFriendlyName: vehicleLocation.vehicleFriendlyName,
    }
  }

  vehicleLocationTrackBy(
    index: number,
    vehicleLocation: VehicleLocation
  ): string {
    return vehicleLocation.vehicleId
  }

  iconUrlForVehicle(
    vehicle: VehicleLocation
  ): { url: string; scaledSize: google.maps.Size } | undefined {
    switch (vehicle.kind) {
      case 'ambulance':
        return AMBULANCE_ICON
      default:
        return undefined
    }
  }
}
