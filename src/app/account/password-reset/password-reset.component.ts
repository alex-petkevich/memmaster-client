import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {

  form: any = {
    username: null,
    password: null
  };
  isSentSucessfully = false;
  isSentFailed = false;
  errorMessage = '';
  incorrectToken = false;
  key = '';

  constructor(private authService: AuthService, private tokenStorage: TokenStorageService, private router: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.router.queryParams.subscribe(res=>{
      if (!res['key']) {
        this.incorrectToken = true;
      } else {
        this.authService.checkKey(res['key']).subscribe({
          next: data => {
            if (data['message'] == '')
              this.incorrectToken = true;
            this.key = res['key'];
          } ,
          error: err => {
            this.errorMessage = err.error.message;
            this.incorrectToken = true;
          }
        });
      }
    })
  }

  onSubmit() : void {
    const {password} = this.form;
    this.authService.passwordReset(this.key, password).subscribe({
      next: data => {
        if (data['message'] != '') {
          this.isSentSucessfully = true;
          this.isSentFailed = false;
          this.form.password = "";
          this.form.submitted = false;
        } else {
          this.isSentFailed = true;
        }
      } ,
      error: err => {
        this.errorMessage = err.error.message;
        this.isSentFailed = true;
      }
    });
  }

}
