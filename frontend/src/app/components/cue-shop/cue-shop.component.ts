import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from '../../modules/shared.module';
import { CueService } from '../../services/cue.service';
import { Cue, CueShopResponse } from '@shared/cue.types';
import { MessageService } from 'primeng/api';
import { CueShopItemComponent } from './cue-shop-item/cue-shop-item.component';

@Component({
  selector: 'app-cue-shop',
  standalone: true,
  imports: [SharedModule, CueShopItemComponent],
  templateUrl: './cue-shop.component.html',
  styleUrl: './cue-shop.component.scss',
})
export class CueShopComponent implements OnInit {
  
  private readonly cueService = inject(CueService);
  private readonly messageService = inject(MessageService);

  public cueShop: CueShopResponse = undefined!;

  ngOnInit(): void {
    this.cueService.getCueShopData().subscribe((data) => {
      this.cueShop = data;
    });
  }

  public equipCue(cue: Cue): void {

    console.log(`Equipping cue: ${cue.name}`);

    this.cueService.equipCue(cue.id).subscribe({
      next: () => {

        console.log(`Successfully equipped cue: ${cue.name}`);

        this.messageService.add({
          severity: 'success',
          summary: 'Equipped!',
          detail: `You're now using the ${cue.name}.`
        });

        cue.isEquipped = true;

        this.cueShop.cues.forEach((c) => {
          if (c.id !== cue.id) {
            c.isEquipped = false;
          }
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to equip cue.'
        });
      }
    });
  }
}
