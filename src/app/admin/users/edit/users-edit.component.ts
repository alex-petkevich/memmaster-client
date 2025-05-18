import { Component, OnInit, ViewChild } from '@angular/core';
import {AuthService} from "../../../_services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import { UsersService } from "../../../_services/users.service";
import { IUser } from "../../../model/user.model";
import { IRole } from "../../../model/role.model";
import { tap } from "rxjs";
import { ToastComponent } from "../../../shared-components/toast/toast.component";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'app-users-edit',
  templateUrl: './users-edit.component.html',
  styleUrls: ['./users-edit.component.scss']
})
export class UsersEditComponent implements OnInit {
  currentUser: IUser | undefined = undefined;
  isSuccessful: boolean = false;
  form: IUser = {
    email: "",
    username: "",
    firstname: "",
    lastname: "",
    lang: "",
    last_modified_at: undefined,
    created_at: undefined,
    roles: [],
    active: true
  };
  errorMessage: String = "";
  roles: IRole[] = [];
  @ViewChild("finalDialog") toastComponent: ToastComponent | undefined;

  constructor(private auth: AuthService,
              private usersService: UsersService,
              private route: ActivatedRoute,
              private router: Router,
              private translate: TranslateService) { }

  async ngOnInit(): Promise<void> {
   await this.auth.isLoggedIn();

    this.route.params.subscribe(res=>{
      if (res['id']) {
        this.usersService.get(res['id'])
            .pipe(
                tap(() => this.getRoles())
            )
            .subscribe({
              next: data => {
                if (data) {
                  this.currentUser = data;
                  this.form = this.currentUser as IUser;
                }
              }
        });
      } else {
        this.getRoles();
      }
    })
  }

  onSubmit(valid: any) {
    this.isSuccessful = false;
    if (!valid) {
      return false;
    }
    const savedUser = this.form;

    this.usersService.save(this.form).subscribe({
      next: data => {
        this.router.navigate(['/admin/users']).then(() => {
          window.location.reload();
        });
      },
      error: err => {
        this.errorMessage = err?.error?.message || err?.message;
      }
    });
    return true;
  }

  initiateResetPassword() {

    if (this.currentUser && this.currentUser.username) {
      this.auth.forgotPassword(this.currentUser.username).subscribe({
        next: (data) => {
          this.translate.get('users.edit.reset-link-sent').subscribe({
            next: (data) => {
              this.toastComponent?.success(data);
            }
          });
        }
      });
    }

    return false;
  }

  hasRole(role: IRole) {
      return this.form.roles?.find(rl => rl.id === role.id);
  }

  private getRoles() {
    this.usersService.getRoles().subscribe({
      next: data => {
        this.roles = data;
      }
    });
  }

  changeRole(role: IRole) {
    const arrRole = this.hasRole(role);
    if (arrRole) {
      const idxRole = this.form.roles?.indexOf(arrRole);
      if (idxRole !== undefined && idxRole > -1) {
        this.form.roles?.splice(idxRole, 1);
      }
    } else {
      this.form.roles?.push(role);
    }
  }
}
