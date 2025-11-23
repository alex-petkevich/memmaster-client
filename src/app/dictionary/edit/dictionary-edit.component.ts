import {Component, OnInit, ViewChild} from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ToastComponent} from "../../shared-components/toast/toast.component";
import {TranslateService} from "@ngx-translate/core";
import {FoldersService} from 'src/app/_services/folders.service';
import {IFolder} from 'src/app/model/folder.model';
import {NgForm} from "@angular/forms";
import {DictionaryService} from "../../_services/dictionary.service";
import {IDictionaryPair} from "../../model/name_value.model";
import {catchError, delay, of} from "rxjs";
import {ExtTranslatorService} from "../../_services/ext-translator.service";
import {IDirectory} from "../../model/directory.model";
import {DirectoryService} from "../../_services/directory.service";
import {DIRECTORY_TYPES} from "../../shared-components/general.constants";

@Component({
  standalone: false,
  selector: 'app-folders-edit',
  templateUrl: './dictionary-edit.component.html',
  styleUrls: ['./dictionary-edit.component.scss']
})
export class DictionaryEditComponent implements OnInit {
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
  pairs: IDictionaryPair[] = [
  ];
  languages: IDirectory[] | undefined = [];

  errorMessage: string = "";
  @ViewChild("finalDialog") toastComponent: ToastComponent | undefined;

  constructor(private readonly auth: AuthService,
              private readonly foldersService: FoldersService,
              private readonly dictionaryService: DictionaryService,
              private readonly extTranslatorService: ExtTranslatorService,
              private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly translate: TranslateService,
              private readonly directory: DirectoryService) {
  }

  ngOnInit(): void {
    this.auth.isLoggedIn();

    this.findFolder();

    this.directory.list(DIRECTORY_TYPES.LANGUAGE).subscribe({
      next: data => {
        if (data) {
          this.languages = data;
        }
      },
      error: err => {
        this.errorMessage = err?.error?.message || err?.message;
      }
    });
  }

  private findFolder() {
    this.route.params.subscribe(res => {
        if (res['id']) {
          this.rootFolder = {id: res['id'], name: ""};
          this.loadPairs();
          this.foldersService.get(res['id'])
            .subscribe({
              next: data => {
                if (data) {
                  this.rootFolder = data;
                }
              }
            });
        } else {
          this.router.navigate(['/dictionary']).then(() => {
            globalThis.location.reload();
          });
        }
      }
    )
  }

  addPair(): void {
    this.pairs.push({name: '', name_type: 'TEXT', value_type: 'TEXT', value: ''});
  }

  removePair(index: number): void {
    this.pairs.splice(index, 1);
  }

  onNameFileChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      this.pairs[index].name_file = file;
      // use filename as key
      this.pairs[index].name = file.name;
    } else {
      this.pairs[index].name_file = null;
      this.pairs[index].name = '';
    }
  }

  onFileChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.pairs[index].value_file = input.files[0];
    } else {
      this.pairs[index].value_file = null;
    }
  }

  onSubmit(form: NgForm): void {
    // Validate that every pair has a name (text or selected file)
    const transCardTitle = this.translate.instant('dictionary.edit.cardTitle');
    for (let i = 0; i < this.pairs.length; i++) {
      const p = this.pairs[i];
      if (!p.name || p.name.trim() === '') {
        this.errorMessage = transCardTitle + ` ${i + 1}: ` + this.translate.instant('dictionary.edit.errorNameRequired');
        this.isSuccessful = false;
        return;
      }
      if (p.name_type === 'FILE' && !p.name_file) {
        this.errorMessage = transCardTitle + ` ${i + 1}: ` + this.translate.instant('dictionary.edit.errorNameFileRequired');
        this.isSuccessful = false;
        return;
      }
      if (p.value_type === 'FILE' && !p.value_file) {
        // allow empty value file? currently require selection
        this.errorMessage = transCardTitle + ` ${i + 1}: ` + this.translate.instant('dictionary.edit.errorValueFileRequired');
        this.isSuccessful = false;
        return;
      }
    }

    this.dictionaryService.save(this.rootFolder?.id as number, this.pairs)
      .subscribe({
        next: data => {
          this.isSuccessful = true;
        },
        error: err => {
          this.errorMessage = err.error.message || this.translate.instant('dictionary.edit.errorMessage');
          this.isSuccessful = false;
        }
      });
  }

  exchangePair(i: number) {
    const val = this.pairs[i].value;
    const valType = this.pairs[i].value_type;
    const valFile = this.pairs[i].value_file;
    this.pairs[i].value = this.pairs[i].name;
    this.pairs[i].value_file = this.pairs[i].name_file;
    this.pairs[i].value_type = this.pairs[i].name_type;
    this.pairs[i].name = val as string;
    this.pairs[i].name_type = valType;
    this.pairs[i].name_file = valFile;
  }

  private loadPairs() {
    if (!this.rootFolder) {
      return;
    }
    this.dictionaryService.list(this.rootFolder.id as number)
      .subscribe({
        next: data => {
          this.pairs = data as IDictionaryPair[];
        }
      });
  }

  protected translateName(i: number) {
    if (this.pairs[i].name !== '' && !this.pairs[i].value) {
      this.lookupWord(i, true);
    }
  }

  protected translateValue(i: number) {
    if (this.pairs[i].value !== '' && !this.pairs[i].name) {
      this.lookupWord(i, false);
    }
  }

  private lookupWord(i: number, isName: boolean) {
    let name = isName ? this.pairs[i].name : this.pairs[i].value;
    let lngSrc = (isName ? this.rootFolder?.lng_src : this.rootFolder?.lng_dest) as string;
    let lngDest = (isName ? this.rootFolder?.lng_dest : this.rootFolder?.lng_src ) as string;
    this.extTranslatorService.lookup(name as string, lngSrc, lngDest)
      .subscribe({
        next: data => {
          if (data?.length > 0) {
            if (isName) {
              this.pairs[i].value = data[0].translation as string;
            } else {
              this.pairs[i].name = data[0].translation as string;
            }
          }
        },
        error: err => {
          console.error("Translation error");
        }
      });
  }

  protected lngName(lngCode: string | undefined) {
    return this.languages?.find(l => l.key === lngCode)?.value || lngCode || '';
  }

}
