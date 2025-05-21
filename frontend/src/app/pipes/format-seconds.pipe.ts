import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe that formats a total number of seconds into a human-readable time string.
 * 
 * Formats seconds into "HH:MM:SS" or "MM:SS" format depending on options.
 * 
 * Usage examples:
 * {{ 65 | seconds }} -> "00:01:05"
 * {{ 65 | seconds:true }} -> "01:05"
 */
@Pipe({
  name: 'seconds'
})
export class FormatSecondsPipe implements PipeTransform {
  
  /**
   * Transform a number of seconds into a formatted time string.
   * 
   * @param value - The number of seconds to format
   * @param hide_hour - Whether to hide the hours part (defaults to false)
   * @returns Formatted time string in "HH:MM:SS" or "MM:SS" format
   */
  public transform(value: number, hide_hour: boolean = false) {

    if (isNaN(value))
      return hide_hour ? '00:00' : '00:00:00';

    const hours: number = Math.floor(value / 3600); value -= hours * 3600;
    const minutes: number = Math.floor(value / 60);

    return ((hours > 0 || hours == 0 && !hide_hour) ? (hours.toString().padStart(2, '0') + ':') : '') + minutes.toString().padStart(2, '0') + ':' + Math.floor((value - minutes * 60)).toString().padStart(2, '0');
  }
}
