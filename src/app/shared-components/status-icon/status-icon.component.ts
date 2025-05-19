import { Component, Input } from "@angular/core";

@Component({
    standalone: false,
    selector: 'app-status-icon',
    templateUrl: 'status-icon.component.html',
})
export class StatusIconComponent {
    @Input() isGreen: boolean = true;

}