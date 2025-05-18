import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../_services/auth.service";
import { finalize } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { ToastComponent } from "../../shared-components/toast/toast.component";
import { MetricsService } from "../../_services/metrics.service";

@Component({
    selector: 'app-metrics',
    templateUrl: './metrics.component.html',
    styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit {
    loadProgress: boolean = false;
    loadingMetrics: boolean = false;
    metrics: any;
    health: any;
    metricDetails: any;
    @ViewChild("toast") toastComponent: ToastComponent | undefined;

    constructor(private metricsService: MetricsService,
                private translate: TranslateService,
                private auth: AuthService,
                private router: Router,
                private location: Location,
                private activatedRoute: ActivatedRoute) {
    }

    async ngOnInit(): Promise<void> {
        await this.auth.isLoggedIn();

        this.listMetrics();
    }

    private listMetrics() {
        this.loadProgress = true;
        this.metricsService.getMetrics()
            .pipe(
                finalize(() => {
                    this.loadProgress = false;
                })
            )
            .subscribe({
                next: data => {
                    this.metrics = data;
                },
                error: err => {
                    this.showInternalError(err);
                }
            });
        this.metricsService.getHealth().subscribe({
            next: data => {
                this.health = data;
            },
            error: err => {
                this.showInternalError(err);
            }
        })
    }

    showMetric(metric: string) {
        if (!metric) {
            return false;
        }
        this.loadingMetrics = true;
        this.metricsService.getMetricInfo(metric)
            .pipe(
                finalize(() => {
                    this.loadingMetrics = false;
                })
            )
            .subscribe({
                next: data => {
                    this.metricDetails = data;
                },
                error: err => {
                    this.showInternalError(err);
                }
        });
        return false;
    }

    private showInternalError(err: any) {
        this.toastComponent?.error( err );
    }

}
