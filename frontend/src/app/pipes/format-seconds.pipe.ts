import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'seconds'
})
export class FormatSecondsPipe implements PipeTransform {
  
  public transform(value: number, hide_hour: boolean = false) {

    if (isNaN(value))
      return hide_hour ? '00:00' : '00:00:00';

    const hours: number = Math.floor(value / 3600); value -= hours * 3600;
    const minutes: number = Math.floor(value / 60);

    return ((hours > 0 || hours == 0 && !hide_hour) ? (hours.toString().padStart(2, '0') + ':') : '') + minutes.toString().padStart(2, '0') + ':' + Math.floor((value - minutes * 60)).toString().padStart(2, '0');
  }
}
