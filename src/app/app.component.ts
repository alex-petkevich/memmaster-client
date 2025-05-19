import { Component } from '@angular/core';
import {TokenStorageService} from "./_services/token-storage.service";
import {FileService} from "./_services/file.service";
import {TranslateService} from "@ngx-translate/core";
import {environment} from "./environments/environment";
import {UserService} from "./_services/user.service";

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  private roles: string[] = [];
  isLoggedIn = false;
  showAdminBoard = false;
  username?: string;
  avatar?:any;

  languageList = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ];
  currentLanguage?: string = this.getLanguageLabel(environment.defaultLanguage);

  private getLanguageLabel(lang: string) {
    return this.languageList.find( it => it.code == lang)?.label.toString();
  }

  constructor(private tokenStorageService: TokenStorageService,
              private fileService: FileService,
              private translate: TranslateService,
              private userService: UserService) {

  }

  ngOnInit(): void {
    this.changeSiteLanguage(this.tokenStorageService.getLang());

    this.isLoggedIn = !!this.tokenStorageService.getToken();
    if (this.isLoggedIn) {
      const user = this.tokenStorageService.getUser();
      this.roles = user.roles;
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
      this.username = user.username;
      this.fileService.getUserImage(this.username as string).subscribe({
        next: data => {
          this.loadImage(data);
        }
      })
    }
  }
  logout(): void {
    this.tokenStorageService.signOut();
    window.location.reload();
  }

  private loadImage(image: Blob) {
    if (image && image.size > 0) {
      let reader = new FileReader();
      reader.addEventListener("load", () => {
        this.avatar = reader.result;
      }, false);
      reader.readAsDataURL(image);
    }
  }

  changeSiteLanguage(localeCode: string): void {
    const selectedLanguage = this.getLanguageLabel(localeCode);
    if (selectedLanguage) {
      this.translate.use(localeCode);
      this.currentLanguage = selectedLanguage;
      if (this.tokenStorageService.getToken()) {
        this.userService.saveUserLanguage(localeCode).subscribe({
          next: data => {
            this.tokenStorageService.saveLang(localeCode);
          }
        });
      }
    }
  }

}
