import { Component, OnInit, ViewChild } from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import { ToastComponent } from "../../shared-components/toast/toast.component";
import { TranslateService } from "@ngx-translate/core";
import { FoldersService } from 'src/app/_services/folders.service';
import { IFolder } from 'src/app/model/folder.model';
import {NgForm} from "@angular/forms";

type PairType = 'text' | 'file';

interface NameValuePair {
    // name holds the actual key used for FormData (kept in sync below)
    name: string;
    nameType: PairType;
    nameFile?: File | null;

    type: PairType;
    valueText?: string;
    valueFile?: File | null;
}

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
    pairs: NameValuePair[] = [
        { name: 'key1', nameType: 'text', type: 'text', valueText: '' }
    ];


  errorMessage: string = "";
  @ViewChild("finalDialog") toastComponent: ToastComponent | undefined;

  constructor(private readonly auth: AuthService,
              private readonly foldersService: FoldersService,
              private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly translate: TranslateService) { }

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

    addPair(): void {
        this.pairs.push({ name: '', nameType: 'text', type: 'text', valueText: '' });
    }

    removePair(index: number): void {
        this.pairs.splice(index, 1);
    }

    onNameFileChange(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length) {
            const file = input.files[0];
            this.pairs[index].nameFile = file;
            // use filename as key
            this.pairs[index].name = file.name;
        } else {
            this.pairs[index].nameFile = null;
            this.pairs[index].name = '';
        }
    }

    onFileChange(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length) {
            this.pairs[index].valueFile = input.files[0];
        } else {
            this.pairs[index].valueFile = null;
        }
    }

    onSubmit(form: NgForm): void {
        // Validate that every pair has a name (text or selected file)
        for (let i = 0; i < this.pairs.length; i++) {
            const p = this.pairs[i];
            if (!p.name || p.name.trim() === '') {
                this.errorMessage = `Pair ${i + 1}: name is required.`;
                this.isSuccessful = false;
                return;
            }
            if (p.nameType === 'file' && !p.nameFile) {
                this.errorMessage = `Pair ${i + 1}: name file must be selected.`;
                this.isSuccessful = false;
                return;
            }
            if (p.type === 'file' && !p.valueFile) {
                // allow empty value file? currently require selection
                this.errorMessage = `Pair ${i + 1}: value file must be selected.`;
                this.isSuccessful = false;
                return;
            }
        }

        const payload = new FormData();
        this.pairs.forEach((p, i) => {
            const key = p.name;

            // If value is file -> append the file under the key
            if (p.type === 'file') {
                if (p.valueFile) {
                    payload.append(key, p.valueFile, p.valueFile.name);
                } else {
                    payload.append(key, '');
                }
            } else {
                payload.append(key, p.valueText ?? '');
            }

            // If name was provided as a file, also include the name file for server use
            if (p.nameType === 'file' && p.nameFile) {
                payload.append(`_namefile_${i}`, p.nameFile, p.nameFile.name);
            }
        });

        // TODO: send payload to backend via service
        this.isSuccessful = true;
        this.errorMessage = '';
        console.log('FormData ready to send', payload);
    }

}
