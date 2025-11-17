import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {SettingsService} from "../../_services/settings.service";
import {AuthService} from "../../_services/auth.service";
import { ISettingsResponse } from "../../model/setting_response.model";
import { ISettingsInfo } from "../../model/setting.model";

@Component({
  standalone: false,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  form: any = {
    api_key: null
  };
  isSuccessful = false;
  isUpdatingFailed = false;
  errorMessage = '';

  constructor(private readonly settingsService: SettingsService,
              private readonly auth: AuthService) { }

  ngOnInit(): void {
    this.auth.isLoggedIn();

    this.settingsService.getGlobalSettings().subscribe({
      next: data => {
        (data as Array<ISettingsResponse>).forEach(it => {
          this.form[it.name] = it.value;
        });
      }
    });
  }

  onSubmit(valid: any): void {
    let { api_key } = this.form;
    const settings: ISettingsInfo = {
      'api_key': api_key
    }
    this.settingsService.saveGlobalSettings(settings).subscribe({
      next: data => {
        console.log(data);
        this.isSuccessful = true;
        this.isUpdatingFailed = false;
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isUpdatingFailed = true;
      }
    });
  }
}
