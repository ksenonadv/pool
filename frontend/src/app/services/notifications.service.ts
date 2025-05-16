import { inject, Injectable } from "@angular/core";
import { MessageService } from "primeng/api";

const NOTIFICATION_DURATION = 3000;

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {

    private readonly messageService: MessageService = inject(
        MessageService
    );;

    public success(title: string, message: string): void {
        this.messageService.add({
            severity: 'success',
            summary: title,
            detail: message,
            life: NOTIFICATION_DURATION
        });

        console.log(`Success: ${title} - ${message}`);
    }

    public error(title: string, message: string): void {
        this.messageService.add({
            severity: 'error',
            summary: title,
            detail: message,
            life: NOTIFICATION_DURATION
        });
    }
}