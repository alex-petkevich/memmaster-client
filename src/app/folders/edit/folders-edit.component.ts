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
  templateUrl: './folders-edit.component.html',
  styleUrls: ['./folders-edit.component.scss']
})
export class FoldersEditComponent implements OnInit {
  currentFolder: IFolder | undefined = undefined;
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
          if (res['id'] && res['action'] !== 'new') {
            this.foldersService.get(res['id'])
                .subscribe({
                  next: data => {
                    if (data) {
                      this.currentFolder = data;
                      this.form = this.currentFolder as IFolder;
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
    savedFolder.children = undefined;

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

}
