import { Component, Inject, OnDestroy, ViewChild } from '@angular/core'
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps'
import { Observable, Subject } from 'rxjs'
import { UntilDestroy } from '@ngneat/until-destroy'
import {
  VehicleLocation,
  VehicleLocationService,
  VEHICLE_LOCATION_SERVICE,
} from '../services/live-vehicle-location.service'
import { takeUntil } from 'rxjs/operators'

const AMBULANCE_ICON = {
  url: '/assets/icons/ambulance.svg',
  scaledSize: new google.maps.Size(25, 25),
}

const LOGISTICS_ICON = {
  url: '/assets/icons/delivery.svg',
  scaledSize: new google.maps.Size(25, 25),
}

@UntilDestroy()
@Component({
  selector: 'app-vehicle-location-map',
  templateUrl: './vehicle-location-map.component.html',
  styleUrls: ['./vehicle-location-map.component.scss'],
})
export class VehicleLocationMapComponent implements OnDestroy {
  @ViewChild(GoogleMap) googleMap: GoogleMap | undefined
  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined

  center: google.maps.LatLngLiteral = { lat: 51, lng: 3 }
  zoom = 8

  vehicleLocations$: Observable<readonly VehicleLocation[]>
  destroy$ = new Subject()

  selectedVehicle: {
    marker: MapMarker
    vehicleId: string
    vehicleFriendlyName: string
  } | null = null

  constructor(
    @Inject(VEHICLE_LOCATION_SERVICE)
    private locationService: VehicleLocationService
  ) {
    this.vehicleLocations$ = this.locationService
      .getLocations$()
      .pipe(takeUntil(this.destroy$))
  }

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
      case 'logistics':
        return LOGISTICS_ICON
      default:
        return undefined
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
  }
}
