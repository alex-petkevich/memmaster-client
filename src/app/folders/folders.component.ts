import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { DialogComponent } from "../shared-components/dialog/dialog.component";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { finalize } from "rxjs";
import { IFolder } from "../model/folder.model";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { ToastComponent } from "../shared-components/toast/toast.component";
import { FormControl } from "@angular/forms";
import { AuthService } from '../_services/auth.service';
import { FoldersService } from '../_services/folders.service';

@Component({
    standalone: false,
    selector: 'app-folders',
    templateUrl: './folders.component.html',
    styleUrls: ['./folders.component.scss']
})
export class FoldersComponent implements OnInit {
    folders?: IFolder[];
    loadProgress: boolean = false;
    sort: string = "createdAt";
    sortOrder: string = "desc";
    isFilterOpen: boolean = false;
    factive: FormControl = new FormControl(false);
    fuuid: FormControl = new FormControl('');
    fname: FormControl = new FormControl('');

    @ViewChild("dialog") dialogComponent: DialogComponent | undefined;
    @ViewChild("toast") toastComponent: ToastComponent | undefined;

    constructor(private foldersService: FoldersService,
                private translate: TranslateService,
                private auth: AuthService,
                private router: Router,
                private location: Location,
                private activatedRoute: ActivatedRoute) {
    }

    async ngOnInit(): Promise<void> {
        await this.auth.isLoggedIn();

        this.activatedRoute.queryParams.subscribe(params => {
            this.loadFolders();
        });
    }

    private loadFolders() {
        this.loadProgress = true;
        this.foldersService.list(this.fname.value, this.fuuid.value, '', this.factive.value, this.sort, this.sortOrder)
            .pipe(
                finalize(() => {
                    this.loadProgress = false;
                })
            )
            .subscribe({
                next: data => {
                    this.folders = data;
                }
            });
    }

    confirmDelete(id: any) {
        var modal = this.dialogComponent?.open(this.translate.instant('folders.delete-confirm'));
        (modal as NgbModalRef).result.then((result) => {
            this.foldersService.delete(id).subscribe({
                next: data => {
                    this.loadFolders();
                }
            });
        });
    }

    pageCallback = (args: any): void => {
        const url = this.router.createUrlTree([], {relativeTo: this.activatedRoute, queryParams: {page: args}}).toString()
        this.location.go(url);
        this.loadFolders();
    }

    private showInternalError(err: any) {
        this.toastComponent?.error( err );
    }

    reorderCallback = (args: any): void => {
        this.sort = args[0];
        this.sortOrder = args[1];

        this.loadFolders();
    }

    displayFilter() {
        return false;
    }

    applyFilters() {
        this.isFilterOpen = true;
        this.loadFolders();
        return false;
    }

    resetFilters() {
        this.isFilterOpen = true;
        this.factive.setValue(false);
        this.fname.setValue("");
        this.fuuid.setValue("");

        this.loadFolders();
        return false;
    }

    activeFolder(id: number | undefined) {
        if (!id) {
            return;
        }
        this.foldersService.activateFolder(id).subscribe({
            next: (folder) => {
                this.folders?.forEach((usr, idx) => {
                    if (usr.id == folder.id) {
                        this.folders![idx] = folder;
                    }
                })
            }
        })
    }

    copySharedLink(uuid: string | undefined) {
        if (!uuid) {
            return;
        }
        const url = window.location.origin + '/shared/' + uuid;
        navigator.clipboard.writeText(url).then(() => {
            this.toastComponent?.success(this.translate.instant('folders.shared-link-copied'));
        }).catch(err => {
            this.toastComponent?.error(this.translate.instant('folders.shared-link-copy-error'));
        });
    }

    addFolder(id: number | undefined) {
        if (!id) {
            return;
        }
        this.router.navigate(['/folders', id, 'new']);
    }
}
