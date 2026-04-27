import {Component, OnDestroy, OnInit, ViewChild, ChangeDetectorRef} from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ToastComponent} from "../../shared-components/toast/toast.component";
import {TranslateService} from "@ngx-translate/core";
import {FoldersService} from 'src/app/_services/folders.service';
import {IFolder} from 'src/app/model/folder.model';
import {NgForm} from "@angular/forms";
import {DictionaryService} from "../../_services/dictionary.service";
import {IDictionaryPair} from "../../model/name_value.model";
import {ExtTranslatorService} from "../../_services/ext-translator.service";
import {IDirectory} from "../../model/directory.model";
import {DirectoryService} from "../../_services/directory.service";
import {DIRECTORY_TYPES} from "../../shared-components/general.constants";
import {HttpClient} from "@angular/common/http";

type UiDictionaryPair = IDictionaryPair & { uiId: number; name_img?: string; value_img?: string };

@Component({
  standalone: false,
  selector: 'app-folders-edit',
  templateUrl: './dictionary-edit.component.html',
  styleUrls: ['./dictionary-edit.component.scss']
})
export class DictionaryEditComponent implements OnInit, OnDestroy {
  rootFolder: IFolder | undefined = undefined;
  isSuccessful: boolean = false;
  private nextPairUiId = 1;
  blobUrlCache = new Map<string, string>();
  private failedBlobPaths = new Set<string>();

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
  pairs: UiDictionaryPair[] = [
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
              private readonly directory: DirectoryService,
              private readonly http: HttpClient,
              private readonly cdr: ChangeDetectorRef) {
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
    this.pairs.unshift(this.newEmptyPair());
  }

  removePair(index: number): void {
    this.pairs.splice(index, 1);
  }

  onNameFileChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      this.pairs[index].name_file = file;
      this.pairs[index].name = file.name;
      this.dictionaryService.uploadAttachment(file).subscribe({
        next: data => {
          this.pairs[index].name_img = this.normalizeStoredPath(data.filename);
          this.pairs[index].name_file = null;
          // Pre-fetch blob URL for the uploaded image
          if (this.isImagePath(this.pairs[index].name_img)) {
            this.fetchBlobUrl(this.pairs[index].name_img as string);
          }
        },
        error: () => {
          this.errorMessage = this.translate.instant('dictionary.edit.errorFileUpload');
        }
      });
    } else {
      this.pairs[index].name_file = null;
      this.pairs[index].name_img = undefined;
      this.pairs[index].name = '';
    }
  }

  onFileChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.pairs[index].value_file = file;
      this.pairs[index].value = file.name;
      this.dictionaryService.uploadAttachment(file).subscribe({
        next: data => {
          this.pairs[index].value_img = this.normalizeStoredPath(data.filename);
          this.pairs[index].value_file = null;
          // Pre-fetch blob URL for the uploaded image
          if (this.isImagePath(this.pairs[index].value_img)) {
            this.fetchBlobUrl(this.pairs[index].value_img as string);
          }
        },
        error: () => {
          this.errorMessage = this.translate.instant('dictionary.edit.errorFileUpload');
        }
      });
    } else {
      this.pairs[index].value_file = null;
      this.pairs[index].value_img = undefined;
      this.pairs[index].value = '';
    }
  }

  onSubmit(_form: NgForm): void {
    // Validate that every pair has a name (text or selected file)
    const transCardTitle = this.translate.instant('dictionary.edit.cardTitle');
    for (let i = 0; i < this.pairs.length; i++) {
      const p = this.pairs[i];
      if (p.name_type === 'TEXT' && (!p.name || p.name.trim() === '')) {
        this.errorMessage = transCardTitle + ` ${i + 1}: ` + this.translate.instant('dictionary.edit.errorNameRequired');
        this.isSuccessful = false;
        return;
      }
      if (p.name_type === 'FILE' && !p.name_img && !p.name_file) {
        this.errorMessage = transCardTitle + ` ${i + 1}: ` + this.translate.instant('dictionary.edit.errorNameFileRequired');
        this.isSuccessful = false;
        return;
      }
      if (p.value_type === 'FILE' && !p.value_img && !p.value_file) {
        this.errorMessage = transCardTitle + ` ${i + 1}: ` + this.translate.instant('dictionary.edit.errorValueFileRequired');
        this.isSuccessful = false;
        return;
      }
    }

    this.dictionaryService.save(this.rootFolder?.id as number, this.toApiPairs(this.pairs))
      .subscribe({
        next: _data => {
          this.isSuccessful = true;
        },
        error: err => {
          this.errorMessage = err.error.message || this.translate.instant('dictionary.edit.errorMessage');
          this.isSuccessful = false;
        }
      });
  }

  exchangePair(i: number) {
    const pair = this.pairs[i];
    [pair.name, pair.value] = [pair.value || '', pair.name];
    [pair.name_type, pair.value_type] = [pair.value_type, pair.name_type];
    [pair.name_file, pair.value_file] = [pair.value_file, pair.name_file];
  }


  private loadPairs() {
    if (!this.rootFolder) {
      return;
    }
    this.dictionaryService.list(this.rootFolder.id as number)
      .subscribe({
        next: data => {
          this.pairs = (data as any[]).map(item => this.withUiId({
            ...item,
            name_img: this.normalizeStoredPath(item.name_file),
            value_img: this.normalizeStoredPath(item.value_file),
            name_file: null,
            value_file: null
          } as IDictionaryPair));
          // Pre-fetch blob URLs for images
          this.pairs.forEach(pair => {
            if (pair.name_img && this.isImagePath(pair.name_img)) {
              this.fetchBlobUrl(pair.name_img);
            }
            if (pair.value_img && this.isImagePath(pair.value_img)) {
              this.fetchBlobUrl(pair.value_img);
            }
          });
        }
      });
  }

  private fetchBlobUrl(storedPath: string): void {
    const normalizedPath = this.normalizeStoredPath(storedPath);
    if (!normalizedPath || this.failedBlobPaths.has(normalizedPath)) {
      return;
    }

    // Skip if already cached
    if (this.blobUrlCache.has(normalizedPath)) {
      return;
    }

    // Fetch image with authentication (auth interceptor adds token automatically)
    const url = this.dictionaryService.attachmentUrl(normalizedPath);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.blobUrlCache.set(normalizedPath, blobUrl);
        // Trigger change detection to update template
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.failedBlobPaths.add(normalizedPath);
        console.error('Failed to load image:', err);
      }
    });
  }

  protected getBlobUrl(storedPath: string | undefined): string | null {
    const normalizedPath = this.normalizeStoredPath(storedPath);
    if (!normalizedPath) {
      return null;
    }
    return this.blobUrlCache.get(normalizedPath) || null;
  }

  protected openAttachment(storedPath: string | undefined): void {
    const normalizedPath = this.normalizeStoredPath(storedPath);
    if (!normalizedPath) {
      return;
    }

    const cachedBlobUrl = this.getBlobUrl(normalizedPath);
    if (cachedBlobUrl) {
      globalThis.open(cachedBlobUrl, '_blank', 'noopener');
      return;
    }

    const url = this.dictionaryService.attachmentUrl(normalizedPath);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.blobUrlCache.set(normalizedPath, blobUrl);
        this.cdr.markForCheck();
        globalThis.open(blobUrl, '_blank', 'noopener');
      },
      error: (err) => {
        console.error('Failed to open attachment:', err);
      }
    });
  }

  private normalizeStoredPath(storedPath: string | undefined): string {
    if (!storedPath) {
      return '';
    }
    return storedPath.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  // Keep DOM nodes stable when inserting at the beginning.
  protected trackByPair(_index: number, pair: UiDictionaryPair): number {
    return pair.uiId;
  }

  private newEmptyPair(): UiDictionaryPair {
    return this.withUiId({name: '', name_type: 'TEXT', value_type: 'TEXT', value: ''} as IDictionaryPair);
  }

  private withUiId(pair: IDictionaryPair): UiDictionaryPair {
    return {
      ...pair,
      uiId: this.nextPairUiId++
    };
  }

  private toApiPairs(pairs: UiDictionaryPair[]): IDictionaryPair[] {
    return pairs.map(({ uiId, name_file, value_file, name_img, value_img, ...rest }) => ({
      ...rest,
      name_file: name_img,   // send stored path as name_file to server
      value_file: value_img  // send stored path as value_file to server
    } as IDictionaryPair));
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
        next: _data => {
          if (_data?.length > 0) {
            if (isName) {
              this.pairs[i].value = _data[0].translation as string;
            } else {
              this.pairs[i].name = _data[0].translation as string;
            }
          }
        },
        error: _err => {
          console.error("Translation error");
        }
      });
  }

  protected lngName(lngCode: string | undefined) {
    return this.languages?.find(l => l.key === lngCode)?.value || lngCode || '';
  }

  ngOnDestroy(): void {
    this.blobUrlCache.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    this.blobUrlCache.clear();
  }


  protected isImagePath(storedPath: string | undefined): boolean {
    if (!storedPath) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(storedPath);
  }

  protected clearNameImg(i: number): void {
    this.pairs[i].name_img = undefined;
    this.pairs[i].name = '';
  }

  protected clearValueImg(i: number): void {
    this.pairs[i].value_img = undefined;
    this.pairs[i].value = '';
  }

}
