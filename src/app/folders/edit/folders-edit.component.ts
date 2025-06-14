import { Component, OnInit, ViewChild } from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import { ToastComponent } from "../../shared-components/toast/toast.component";
import { TranslateService } from "@ngx-translate/core";
import { FoldersService } from 'src/app/_services/folders.service';
import { IFolder } from 'src/app/model/folder.model';
import {ILanguage} from "../../model/language.model";

@Component({
  standalone: false,
  selector: 'app-folders-edit',
  templateUrl: './folders-edit.component.html',
  styleUrls: ['./folders-edit.component.scss']
})
export class FoldersEditComponent implements OnInit {
  currentFolder: IFolder | undefined = undefined;
  rootFolder: IFolder | undefined = undefined;
  isSuccessful: boolean = false;
  languages: ILanguage[] | undefined = [];
  form: IFolder = {
    name: "",
    uuid: "",
    lng_src: "",
    lng_dest: "",
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
                      if (res['action'] == 'new') {
                        this.rootFolder = data;
                        this.currentFolder = this.form = {name: ""};
                      } else
                      {
                        this.currentFolder = data;
                        this.form = this.currentFolder as IFolder;
                      }
                    }
                  }
                });
          } else if (res['action'] === 'new') {
            this.form.parent_id = res['id'] ? parseInt(res['id'], 10) : 0;
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
