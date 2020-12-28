/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { MatIconModule } from '@angular/material/icon'
import { MatTableModule } from '@angular/material/table'
import { MatTooltipModule } from '@angular/material/tooltip'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { nlBE } from 'date-fns/locale'
import {
  DateFnsConfigurationService,
  FormatDistanceStrictPurePipeModule,
  FormatPurePipeModule,
} from 'ngx-date-fns'
import {
  CURRENT_DATE_SERVICE,
  FakeCurrentDateService,
} from '../services/current-date.service'
import {
  FakeLoraDeviceInformationService,
  LORA_DEVICE_INFORMATION_SERVICE,
} from '../services/lora-device-information.service'
import { LoraDeviceListComponent } from './lora-device-list.component'

const belgianConfig = new DateFnsConfigurationService()
belgianConfig.setLocale(nlBE)

describe('LoraDeviceListComponent', () => {
  let component: LoraDeviceListComponent
  let fixture: ComponentFixture<LoraDeviceListComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoraDeviceListComponent],
      imports: [
        MatTableModule,
        MatIconModule,
        MatTooltipModule,
        FormatDistanceStrictPurePipeModule,
        FormatPurePipeModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: CURRENT_DATE_SERVICE, useClass: FakeCurrentDateService },
        {
          provide: LORA_DEVICE_INFORMATION_SERVICE,
          useClass: FakeLoraDeviceInformationService,
        },
        { provide: DateFnsConfigurationService, useValue: belgianConfig },
      ],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(LoraDeviceListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create table with two rows, which can be expanded on click', () => {
    expect(component).toBeTruthy()
    expect(fixture.debugElement.queryAll(By.css('.device-row')).length).toBe(2)
    expect(fixture.debugElement.queryAll(By.css('.detail-row')).length).toBe(2)
    expect(component.expandedDeviceEUI).toBe(null)

    const firstRow = fixture.debugElement.queryAll(By.css('.device-row'))[0]
    const firstRowEl = firstRow.nativeElement as HTMLElement

    firstRowEl.click()

    expect(component.expandedDeviceEUI).not.toBe(null)
    expect(component.expandedDeviceEUI).toBe(
      firstRowEl.querySelector('code')!.innerText
    )
  })
})
