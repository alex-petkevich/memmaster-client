import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../_services/auth.service";
import { finalize } from "rxjs";
import { ToastComponent } from "../../shared-components/toast/toast.component";
import { MetricsService } from "../../_services/metrics.service";

@Component({
    selector: 'app-logs',
    templateUrl: './logs.component.html',
    styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
    loadProgress: boolean = false;
    logs: any;
    listCheckedLL: string[] = [];
    @ViewChild("toast") toastComponent: ToastComponent | undefined;

    constructor(private metricsService: MetricsService,
                private translate: TranslateService,
                private auth: AuthService) {
    }

    async ngOnInit(): Promise<void> {
        await this.auth.isLoggedIn();

        this.listLogs();
    }

    private listLogs() {
        this.loadProgress = true;
        this.metricsService.getLoggers()
            .pipe(
                finalize(() => {
                    this.loadProgress = false;
                })
            )
            .subscribe({
                next: data => {
                    this.logs = data;
                    this.listCheckedLL = [...data.levels];
                },
                error: err => {
                    this.showInternalError(err);
                }
            });
    }

    private showInternalError(err: any) {
        this.toastComponent?.error( err );
    }

    changeLL(param: string) {
        if (this.checkedLL(param)) {
            this.listCheckedLL.splice(this.listCheckedLL.indexOf(param),1);
        } else {
            this.listCheckedLL.push(param);
        }
    }

    checkedLL(ll: string) {
        return this.listCheckedLL.includes(ll);
    }

    showLevel(configuredLevel: string, effectiveLevel: string) {
        return this.checkedLL(configuredLevel) || this.checkedLL(effectiveLevel);
    }
}
