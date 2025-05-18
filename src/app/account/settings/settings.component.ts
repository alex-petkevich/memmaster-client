import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {SettingsService} from "../../_services/settings.service";
import {AuthService} from "../../_services/auth.service";
import { ISettingsResponse } from "../../model/setting_response.model";
import { ISettingsInfo } from "../../model/setting.model";
import { DialogComponent } from '../../shared-components/dialog/dialog.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  @ViewChild("mailssl") mailssl!:  ElementRef;
  
  form: any = {
    mailserver: null,
    mailport: null,
    mailssl: null,
    username: null,
    password: null,
    id: null,
    user_id: null,
    period: "10"
  };
  isSuccessful = false;
  isUpdatingFailed = false;
  errorMessage = '';
  periods: string[] = ["1", "10", "30", "60", "180", "1440"];

  constructor(private settingsService: SettingsService, private auth: AuthService) { }

  async ngOnInit(): Promise<void> {
    await this.auth.isLoggedIn();

    this.settingsService.getUserSettings().subscribe({
      next: data => {
        (data as Array<ISettingsResponse>).forEach(it => {
          this.form[it.name] = it.value;
        });
      }
    });
  }

  onSubmit(valid: any): void {
    let { mailserver, mailport, username, password, period } = this.form;
    const settings: ISettingsInfo = {
      'mailserver': mailserver,
      'mailport': mailport,
      'mailssl': this.mailssl.nativeElement.checked ? "true" : "false",
      'username': username,
      'password': password,
      'period': period
    }
    this.settingsService.save(settings).subscribe({
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
