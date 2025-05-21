import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CueShopResponse } from '@shared/cue.types';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-cue-shop-item',
  templateUrl: './cue-shop-item.component.html',
  styleUrl: './cue-shop-item.component.scss',
  imports: [SharedModule]
})
export class CueShopItemComponent {

  @Input()
  public cue: CueShopResponse['cues'][0] = undefined!;

  @Input()
  public playerPoints: number = 0;

  @Output()
  private equipCue: EventEmitter<void> = new EventEmitter<void>();

  public equip() {
    this.equipCue.emit();
  }

}
