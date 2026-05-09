import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TokenStorageService } from "../_services/token-storage.service";
import { FoldersService } from "../_services/folders.service";
import { DictionaryService } from "../_services/dictionary.service";
import { SettingsService } from "../_services/settings.service";
import { IFolder } from "../model/folder.model";
import { IDictionaryPair } from "../model/name_value.model";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Subscription } from "rxjs";
import { concatMap } from "rxjs/operators";

export interface IFlatFolder {
  id: number;
  label: string;
  depth: number;
  available_count: number;
  unarchived_count: number;
}

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']);
  private readonly videoExtensions = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v']);

  isLoggedIn: boolean = false;
  flatFolders: IFlatFolder[] = [];
  selectedFolderId: number | null = null;
  includeRemembered: boolean = false;
  allCards: IDictionaryPair[] = [];
  cards: IDictionaryPair[] = [];
  currentCard: IDictionaryPair | null = null;
  showValue: boolean = false;
  loadingCards: boolean = false;
  isSharedMode: boolean = false;
  isSharedFolderOwner: boolean = false;
  sharedFolderUuid: string | null = null;
  private readonly blobUrlCache = new Map<string, string>();
  private readonly failedBlobPaths = new Set<string>();
  private routeSubscription: Subscription | null = null;

  constructor(
    private tokenStorageService: TokenStorageService,
    private foldersService: FoldersService,
    public dictionaryService: DictionaryService,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.tokenStorageService.getToken();
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.initializeByRoute(params.get('publicFolderUuid'));
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.blobUrlCache.forEach(url => URL.revokeObjectURL(url));
    this.blobUrlCache.clear();
  }

   private initializeByRoute(publicFolderUuid: string | null): void {
     this.resetCardState();
     if (!this.isLoggedIn) {
       return;
     }

     if (publicFolderUuid) {
       this.isSharedMode = true;
       this.sharedFolderUuid = publicFolderUuid;
       this.includeRemembered = false;
       this.loadSharedFolder(publicFolderUuid);
       return;
     }

     this.isSharedMode = false;
     this.sharedFolderUuid = null;
     // Load preferences first (with concatMap), then automatically load folders
     this.settingsService.getHomePreferences().pipe(
       concatMap((prefs: any) => {
         this.includeRemembered = prefs.includeRemembered === 'true';
         if (prefs.selectedFolderId && prefs.selectedFolderId !== '') {
           this.selectedFolderId = parseInt(prefs.selectedFolderId, 10);
         }
         return this.foldersService.listMine('', '', '', true);
       })
     ).subscribe({
       next: (data: IFolder[]) => {
         this.flatFolders = this.flattenTree(data, 0);

         if (this.selectedFolderId == null) {
           return;
         }

         const selectedFolderVisible = this.flatFolders.some(folder => folder.id === this.selectedFolderId);
         if (!selectedFolderVisible) {
           this.selectedFolderId = null;
           this.saveHomePreferences();
           return;
         }

         this.loadCardsForSelectedFolder();
       }
     });
   }

  private resetCardState(): void {
    this.flatFolders = [];
    this.selectedFolderId = null;
    this.isSharedFolderOwner = false;
    this.allCards = [];
    this.cards = [];
    this.currentCard = null;
    this.showValue = false;
    this.loadingCards = false;
  }

   private saveHomePreferences(): void {
     const preferences = {
       'home_selected_folder_id': this.selectedFolderId?.toString() ?? '',
       'home_include_remembered': this.includeRemembered.toString()
     };
     this.settingsService.saveHomePreferences(preferences).subscribe();
   }


  private loadSharedFolder(uuid: string): void {
    this.loadingCards = true;
    this.foldersService.getSharedByUuid(uuid).subscribe({
      next: (folder: IFolder) => {
        this.selectedFolderId = folder?.id ?? null;
        if (this.selectedFolderId) {
          const currentUserId = this.tokenStorageService.getUser()?.id;
          this.isSharedFolderOwner = currentUserId != null && folder.user_id === currentUserId;
          this.loadCardsForSelectedFolder();
          return;
        }
        this.loadingCards = false;
      },
      error: () => {
        this.loadingCards = false;
      }
    });
  }

  private flattenTree(folders: IFolder[], depth: number): IFlatFolder[] {
    const result: IFlatFolder[] = [];
    for (const folder of folders) {
      result.push({
        id: folder.id!,
        label: folder.name,
        depth,
        available_count: folder.available_dictionary_count ?? 0,
        unarchived_count: folder.unarchived_dictionary_count ?? folder.available_dictionary_count ?? folder.dictionary_count ?? 0
      });
      if (folder.children && folder.children.length > 0) {
        result.push(...this.flattenTree(folder.children, depth + 1));
      }
    }
    return result;
  }

  getFolderIndent(depth: number): string {
    return '\u00A0\u00A0\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '└ ' : '');
  }

  getFolderCount(folder: IFlatFolder): number {
    return this.includeRemembered ? folder.unarchived_count : folder.available_count;
  }

  getAttachmentUrl(storedPath?: string): string | null {
    if (!storedPath) {
      return null;
    }
    return this.dictionaryService.attachmentUrl(storedPath);
  }

  getBlobUrl(storedPath?: string): string | null {
    const normalizedPath = this.normalizeStoredPath(storedPath);
    if (!normalizedPath) {
      return null;
    }
    return this.blobUrlCache.get(normalizedPath) || null;
  }

  getAttachmentFileName(storedPath?: string): string {
    if (!storedPath) {
      return 'download';
    }
    const normalized = storedPath.replace(/\\/g, '/');
    const rawName = normalized.split('/').filter(Boolean).pop() || 'download';
    try {
      return decodeURIComponent(rawName);
    } catch {
      return rawName;
    }
  }

  getAttachmentKind(storedPath?: string): 'image' | 'video' | 'binary' {
    const extension = this.getAttachmentExtension(storedPath);
    if (this.imageExtensions.has(extension)) {
      return 'image';
    }
    if (this.videoExtensions.has(extension)) {
      return 'video';
    }
    return 'binary';
  }

  openAttachment(storedPath?: string): void {
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
      error: () => {
        this.failedBlobPaths.add(normalizedPath);
      }
    });
  }

  private getAttachmentExtension(storedPath?: string): string {
    const fileName = this.getAttachmentFileName(storedPath).toLowerCase();
    const dot = fileName.lastIndexOf('.');
    return dot > -1 ? fileName.substring(dot + 1) : '';
  }

  private normalizeStoredPath(storedPath?: string): string {
    if (!storedPath) {
      return '';
    }
    return storedPath.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  private fetchBlobUrl(storedPath?: string): void {
    const normalizedPath = this.normalizeStoredPath(storedPath);
    if (!normalizedPath || this.failedBlobPaths.has(normalizedPath) || this.blobUrlCache.has(normalizedPath)) {
      return;
    }

    const url = this.dictionaryService.attachmentUrl(normalizedPath);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.blobUrlCache.set(normalizedPath, blobUrl);
        this.cdr.markForCheck();
      },
      error: () => {
        this.failedBlobPaths.add(normalizedPath);
      }
    });
  }

  private preloadCardMedia(card: IDictionaryPair | null): void {
    if (!card) {
      return;
    }

    if (card.name_type === 'FILE' && card.name_img && this.getAttachmentKind(card.name_img) !== 'binary') {
      this.fetchBlobUrl(card.name_img);
    }

    if (card.value_type === 'FILE' && card.value_img && this.getAttachmentKind(card.value_img) !== 'binary') {
      this.fetchBlobUrl(card.value_img);
    }
  }

  onFolderChange(folderId: number | null): void {
    if (this.isSharedMode) {
      return;
    }
    this.selectedFolderId = folderId;
    this.allCards = [];
    this.cards = [];
    this.currentCard = null;
    this.showValue = false;

    if (this.selectedFolderId) {
      this.loadCardsForSelectedFolder();
    }
    this.saveHomePreferences();
  }

  onIncludeRememberedChange(checked: boolean): void {
    if (this.isSharedMode) {
      return;
    }
    this.includeRemembered = checked;
    if (this.selectedFolderId) {
      this.loadCardsForSelectedFolder();
    }
    this.saveHomePreferences();
  }

  private loadCardsForSelectedFolder(): void {
    if (!this.selectedFolderId) {
      return;
    }
    this.loadingCards = true;
    this.dictionaryService.list(this.selectedFolderId).subscribe({
      next: (data: IDictionaryPair[]) => {
        this.allCards = data.map((card: any) => ({
          ...card,
          name_img: card.name_img ?? card.name_file,
          value_img: card.value_img ?? card.value_file
        }));
        this.cards = this.filterCards(this.allCards).sort(() => Math.random() - 0.5);
        this.loadingCards = false;
        this.showNextCard();
      },
      error: () => { this.loadingCards = false; }
    });
  }

  private filterCards(cards: IDictionaryPair[]): IDictionaryPair[] {
    return cards.filter(p => !p.is_archived && (this.includeRemembered || !p.is_remembered));
  }

  private showNextCard(): void {
    this.showValue = false;
    if (this.cards.length > 0) {
      this.currentCard = this.cards.shift()!;
      this.preloadCardMedia(this.currentCard);
    } else {
      this.currentCard = null;
    }
  }

   onCardClick(): void {
     if (this.showValue) {
       // If value is already shown, go to next card
       this.nextCard();
     } else {
       // Otherwise, reveal the value
       this.revealValue();
     }
   }

   revealValue(): void {
     this.showValue = true;
     if (this.currentCard?.value_type === 'FILE' && this.currentCard.value_img && this.getAttachmentKind(this.currentCard.value_img) !== 'binary') {
       this.fetchBlobUrl(this.currentCard.value_img);
     }
   }

  markRemembered(): void {
    if (!this.currentCard?.id || !this.selectedFolderId) return;
    this.dictionaryService.markAsRemembered(this.selectedFolderId, this.currentCard.id).subscribe({
      next: () => { this.showNextCard(); },
      error: () => { this.showNextCard(); }
    });
  }

  archiveCard(): void {
    if (!this.currentCard?.id || !this.selectedFolderId) return;
    this.dictionaryService.markAsArchived(this.selectedFolderId, this.currentCard.id).subscribe({
      next: () => { this.showNextCard(); },
      error: () => { this.showNextCard(); }
    });
  }

  editCurrentFolderCards(): void {
    if (this.isSharedMode || !this.selectedFolderId) {
      return;
    }
    this.router.navigate(['/dictionary', this.selectedFolderId, 'edit']);
  }

  viewSharedFolderCards(): void {
    if (!this.selectedFolderId) {
      return;
    }
    this.router.navigate(['/dictionary', this.selectedFolderId, 'edit']);
  }

   nextCard(): void {
     if (this.currentCard) {
       this.cards.push(this.currentCard);
     }
     this.showNextCard();
   }

   mixCards(): void {
     if (this.currentCard) {
       this.cards.push(this.currentCard);
     }
     // Fisher-Yates shuffle algorithm
     for (let i = this.cards.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
     }
     this.showNextCard();
   }
}
