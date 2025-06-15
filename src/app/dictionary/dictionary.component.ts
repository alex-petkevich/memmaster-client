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
    selector: 'app-dictionary',
    templateUrl: './dictionary.component.html',
    styleUrls: ['./dictionary.component.scss']
})
export class DictionaryComponent implements OnInit {
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
            this.foldersService.list('', '', '', true)
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

    pageCallback = (args: any): void => {
        const url = this.router.createUrlTree([], {relativeTo: this.activatedRoute, queryParams: {page: args}}).toString()
        this.location.go(url);
        this.loadFolders();
    }

    private showInternalError(err: any) {
        this.toastComponent?.error( err );
    }

}
