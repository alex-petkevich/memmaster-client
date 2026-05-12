import {Component, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, TemplateRef, HostListener} from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {TokenStorageService} from "../../_services/token-storage.service";
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
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";

type UiDictionaryPair = IDictionaryPair & { uiId: number; name_img?: string; value_img?: string; fromPaste?: boolean };

interface BulkImportItem {
  name: string;
  value: string;
  status: 'new' | 'duplicate' | 'error';
}

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
  bulkImportModal: NgbModalRef | undefined;
  copyToFolderModal: NgbModalRef | undefined;
  copyToFolderData: { folders: IFolder[]; selectedFolderId: number | null; loading: boolean; success: boolean; error: string } = {
    folders: [], selectedFolderId: null, loading: false, success: false, error: ''
  };
  bulkImportData: BulkImportItem[] = [];
  bulkImportDuplicateCount: number = 0;
  protected bulkImportFileSelected: File | null = null;
  protected bulkPasteText: string = '';
  protected bulkImportActiveTab: string = 'paste';
  protected exportMenuOpen: boolean = false;

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

  isOwner: boolean = true;
  copyToFolderModalTemplate: TemplateRef<any> | undefined;

  errorMessage: string = "";
  @ViewChild("finalDialog") toastComponent: ToastComponent | undefined;
  @ViewChild("bulkImportModal") bulkImportModalTemplate: TemplateRef<any> | undefined;
  @ViewChild("copyToFolderModal") set copyToFolderModalRef(ref: TemplateRef<any>) {
    this.copyToFolderModalTemplate = ref;
  }

  constructor(private readonly auth: AuthService,
              private readonly tokenStorage: TokenStorageService,
              private readonly foldersService: FoldersService,
              private readonly dictionaryService: DictionaryService,
              private readonly extTranslatorService: ExtTranslatorService,
              private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly translate: TranslateService,
              private readonly directory: DirectoryService,
              private readonly http: HttpClient,
              private readonly cdr: ChangeDetectorRef,
              private readonly modalService: NgbModal) {
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
                  const currentUserId = this.tokenStorage.getUser()?.id;
                  this.isOwner = currentUserId != null && data.user_id === currentUserId;
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
    this.sortPairsByArchived();
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
          this.pairs.forEach(p => p.fromPaste = false);
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

  toggleArchived(i: number): void {
    if (!this.isOwner || !this.rootFolder?.id || !this.pairs[i].id) {
      return;
    }
    const pairId = this.pairs[i].id;
    const folderId = this.rootFolder.id;
    
    this.dictionaryService.toggleArchived(folderId, pairId).subscribe({
      next: (data: any) => {
        this.pairs[i] = this.withUiId({
          ...data,
          name_img: this.normalizeStoredPath(data.name_file as string | undefined),
          value_img: this.normalizeStoredPath(data.value_file as string | undefined),
          name_file: null,
          value_file: null
        } as IDictionaryPair);
        this.sortPairsByArchived();
      },
      error: () => {
        this.errorMessage = this.translate.instant('dictionary.edit.errorMessage');
      }
    });
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
          this.sortPairsByArchived();
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

  private sortPairsByArchived(): void {
    this.pairs.sort((a, b) => Number(Boolean(a.is_archived)) - Number(Boolean(b.is_archived)));
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

  protected openCopyToFolderModal(): void {
    this.copyToFolderData = { folders: [], selectedFolderId: null, loading: true, success: false, error: '' };
    if (this.copyToFolderModalTemplate) {
      this.copyToFolderModal = this.modalService.open(this.copyToFolderModalTemplate, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false
      });
    }
    this.foldersService.listMine('', '', '', false).subscribe({
      next: (data: IFolder[]) => {
        this.copyToFolderData.folders = this.flattenFolderTree(data);
        this.copyToFolderData.loading = false;
      },
      error: () => {
        this.copyToFolderData.loading = false;
        this.copyToFolderData.error = this.translate.instant('dictionary.edit.errorMessage');
      }
    });
  }

  private flattenFolderTree(folders: IFolder[], depth = 0): IFolder[] {
    const result: IFolder[] = [];
    for (const f of folders) {
      result.push({ ...f, name: '\u00A0'.repeat(depth * 4) + (depth > 0 ? '└ ' : '') + f.name });
      if (f.children?.length) {
        result.push(...this.flattenFolderTree(f.children, depth + 1));
      }
    }
    return result;
  }

  protected confirmCopyToFolder(modal: any): void {
    if (!this.copyToFolderData.selectedFolderId || !this.rootFolder?.id) {
      return;
    }
    this.copyToFolderData.loading = true;
    this.copyToFolderData.error = '';
    this.dictionaryService.copyToFolder(this.rootFolder.id, this.copyToFolderData.selectedFolderId).subscribe({
      next: () => {
        this.copyToFolderData.loading = false;
        this.copyToFolderData.success = true;
        setTimeout(() => modal.dismiss(), 1500);
      },
      error: (err: any) => {
        this.copyToFolderData.loading = false;
        this.copyToFolderData.error = err?.error?.message || this.translate.instant('dictionary.edit.errorMessage');
      }
    });
  }

  protected openBulkImportModal(): void {    this.exportMenuOpen = false;
    this.bulkImportData = [];
    this.bulkImportDuplicateCount = 0;
    this.bulkImportFileSelected = null;
    this.bulkPasteText = '';
    this.bulkImportActiveTab = 'paste';
    if (this.bulkImportModalTemplate) {
      this.bulkImportModal = this.modalService.open(this.bulkImportModalTemplate, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  protected onBulkFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      this.bulkImportFileSelected = null;
      return;
    }

    const file = input.files[0];
    this.bulkImportFileSelected = file;
    this.parseBulkFile(file);
  }

  private parseBulkFile(file: File): void {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      // XLS/XLSX is parsed on backend; keep preview empty but allow import action.
      this.bulkImportData = [];
      this.bulkImportDuplicateCount = 0;
      return;
    }

    if (!lowerName.endsWith('.csv')) {
      this.errorMessage = this.translate.instant('dictionary.edit.unsupported-format');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const rows = this.parseCSV((e.target?.result as string) || '');
        this.processBulkData(rows);
      } catch (err) {
        this.errorMessage = this.translate.instant('dictionary.edit.file-parse-error');
        console.error('File parse error:', err);
      }
    };
    reader.readAsText(file);
  }

  private parseCSV(csv: string): any[] {
    const lines = csv.trim().split('\n');
    const rows: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing - handle quoted values
      const parts = line.split(',').map(p => {
        p = p.trim();
        if (p.startsWith('"') && p.endsWith('"')) {
          return p.slice(1, -1).replace(/""/g, '"');
        }
        return p;
      });

      if (parts.length >= 2) {
        rows.push({
          name: parts[0],
          value: parts[1]
        });
      }
    }

    return rows;
  }


  private processBulkData(rows: any[]): void {
    this.bulkImportData = [];
    this.bulkImportDuplicateCount = 0;

    // Get existing names to check for duplicates
    const existingNames = new Set(this.pairs.map(p => p.name?.toLowerCase()));

    for (const row of rows) {
      if (!row.name || String(row.name).trim() === '') {
        continue;
      }

      const name = String(row.name).trim();
      const value = String(row.value || '').trim();

      // Check if it's a duplicate
      if (existingNames.has(name.toLowerCase())) {
        this.bulkImportData.push({
          name,
          value,
          status: 'duplicate'
        });
        this.bulkImportDuplicateCount++;
      } else {
        this.bulkImportData.push({
          name,
          value,
          status: 'new'
        });
        existingNames.add(name.toLowerCase());
      }
    }
  }

  protected importBulkData(modal: any): void {
    if (!this.bulkImportFileSelected) {
      this.errorMessage = this.translate.instant('dictionary.edit.import-select-file');
      return;
    }

    this.dictionaryService.bulkImportFile(this.rootFolder?.id as number, this.bulkImportFileSelected).subscribe({
      next: (data) => {
        for (const savedPair of data) {
          this.pairs.unshift(this.withUiId({
            ...savedPair,
            name_img: this.normalizeStoredPath(savedPair.name_file),
            value_img: this.normalizeStoredPath(savedPair.value_file),
            name_file: null,
            value_file: null
          } as IDictionaryPair));
        }

        this.bulkImportData = [];
        this.bulkImportDuplicateCount = 0;
        this.bulkImportFileSelected = null;
        modal.dismiss();

        this.isSuccessful = true;
        setTimeout(() => {
          this.isSuccessful = false;
        }, 3000);

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || this.translate.instant('dictionary.edit.errorMessage');
      }
    });
  }

  protected onBulkPasteImport(modal: any): void {
    if (!this.bulkPasteText.trim()) {
      return;
    }

    const rows = this.parsePastedText(this.bulkPasteText);
    const existingNames = new Set(this.pairs.map(p => p.name?.toLowerCase()));
    let added = 0;

    for (const row of rows) {
      const name = row.name.trim();
      const value = row.value.trim();
      if (!name) continue;

      // Skip duplicates
      if (existingNames.has(name.toLowerCase())) {
        continue;
      }

      this.pairs.unshift(this.withUiId({
        name,
        name_type: 'TEXT',
        value,
        value_type: 'TEXT',
        fromPaste: true
      } as any));
      existingNames.add(name.toLowerCase());
      added++;
    }

    this.bulkPasteText = '';
    modal.dismiss();
    this.cdr.markForCheck();
  }

  private parsePastedText(text: string): { name: string; value: string }[] {
    const results: { name: string; value: string }[] = [];
    const lines = text.trim().split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;

      // Try tab-separated (XLS copy), then pipe (markdown table), then comma
      let parts: string[] | null = null;

      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes('|')) {
        // Markdown table row: | key | value |
        const stripped = line.replace(/^\||\|$/g, '');
        parts = stripped.split('|');
        // Skip markdown separator lines like |---|---|
        if (parts.every(p => /^[\s\-:]+$/.test(p))) continue;
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else if (line.includes(';')) {
        parts = line.split(';');
      }

      if (parts && parts.length >= 2) {
        results.push({
          name: parts[0].trim().replace(/^\*\*|\*\*$/g, '').replace(/^["']|["']$/g, ''),
          value: parts[1].trim().replace(/^\*\*|\*\*$/g, '').replace(/^["']|["']$/g, '')
        });
      }
    }

    return results;
  }

  protected toggleExportMenu(): void {
    this.exportMenuOpen = !this.exportMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.exportMenuOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.export-menu-container')) {
      return;
    }

    this.exportMenuOpen = false;
  }

  protected exportAs(format: 'csv' | 'xlsx' | 'docx'): void {
    this.exportMenuOpen = false;
    if (!this.rootFolder?.id) {
      return;
    }

    this.dictionaryService.export(this.rootFolder.id, format).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.errorMessage = this.translate.instant('dictionary.edit.export-error');
          return;
        }

        const fileName = this.extractFileName(response.headers.get('content-disposition'))
          || `dictionary-${this.rootFolder?.id}.${format}`;
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || this.translate.instant('dictionary.edit.export-error');
      }
    });
  }

  private extractFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }

    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return plainMatch?.[1] || null;
  }

}
