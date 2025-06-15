import { Component, OnInit, ViewChild } from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import { ToastComponent } from "../../shared-components/toast/toast.component";
import { TranslateService } from "@ngx-translate/core";
import { FoldersService } from 'src/app/_services/folders.service';
import { IFolder } from 'src/app/model/folder.model';

@Component({
  standalone: false,
  selector: 'app-folders-edit',
  templateUrl: './dictionary-edit.component.html',
  styleUrls: ['./dictionary-edit.component.scss']
})
export class DictionaryEditComponent implements OnInit {
  currentFolder: IFolder | undefined = undefined;
  rootFolder: IFolder | undefined = undefined;
  isSuccessful: boolean = false;
  form: IFolder = {
    name: "",
    uuid: "",
    parent_id: 0,
    last_modified_at: undefined,
    created_at: undefined,
    active: true,
    is_public: false,
    icon: ""
  };
  errorMessage: String = "";
  @ViewChild("finalDialog") toastComponent: ToastComponent | undefined;

  constructor(private auth: AuthService,
              private foldersService: FoldersService,
              private route: ActivatedRoute,
              private router: Router,
              private translate: TranslateService) { }

  async ngOnInit(): Promise<void> {
   await this.auth.isLoggedIn();

    this.route.params.subscribe(res=> {
          if (res['id']) {
            this.foldersService.get(res['id'])
                .subscribe({
                  next: data => {
                    if (data) {
                        this.rootFolder = data;
                        this.currentFolder = this.form = {name: ""};
                    }
                  }
                });
          } else {
            this.router.navigate(['/dictionary']).then(() => {
              window.location.reload();
            });
          }
        }
    )
  }

  onSubmit(valid: any) {
    this.isSuccessful = false;
    if (!valid) {
      return false;
    }
    const savedFolder = this.form;
    savedFolder.parent_id = this.rootFolder?.id || this.currentFolder?.parent_id || 0;
    savedFolder.active = this.form.active !== undefined ? this.form.active : true;

    this.foldersService.save(savedFolder).subscribe({
      next: data => {
        this.router.navigate(['/folders']).then(() => {
          window.location.reload();
        });
      },
      error: err => {
        this.errorMessage = err?.error?.message || err?.message;
      }
    });
    return true;
  }

  onIconPickerSelect(icon: string) {
    this.form.icon = icon;
  }
}
