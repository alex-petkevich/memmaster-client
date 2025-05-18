import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../_services/auth.service";
import { finalize } from "rxjs";
import { ToastComponent } from "../../shared-components/toast/toast.component";
import { MetricsService } from "../../_services/metrics.service";

@Component({
    selector: 'app-configs',
    templateUrl: './configs.component.html',
    styleUrls: ['./configs.component.scss']
})
export class ConfigsComponent implements OnInit {
    loadProgress: boolean = false;
    env: any;
    flyway: any;
    @ViewChild("toast") toastComponent: ToastComponent | undefined;

    constructor(private metricsService: MetricsService,
                private translate: TranslateService,
                private auth: AuthService) {
    }

    async ngOnInit(): Promise<void> {
        await this.auth.isLoggedIn();

        this.listConfigs();
    }

    private listConfigs() {
        this.loadProgress = true;
        this.metricsService.getEnv()
            .pipe(
                finalize(() => {
                    this.loadProgress = false;
                })
            )
            .subscribe({
                next: data => {
                    this.env = data;
                },
                error: err => {
                    this.showInternalError(err);
                }
            });
        this.metricsService.getFlyway().subscribe({
            next: data => {
                this.flyway = data;
            },
            error: err => {
                this.showInternalError(err);
            }
        });
    }

    private showInternalError(err: any) {
        this.toastComponent?.error( err );
    }

    getFlywayProps() {
        return this.flyway.contexts["forwader-server"].flywayBeans.flyway.migrations;
    }
}
