import { Injectable } from '@angular/core';

@Injectable({ 
  providedIn: 'root' 
})
export class ConfigService {
  
  constructor() {
    if (!window.__APP_CONFIG__) {
      throw new Error('Configuration not loaded.'
      );
    }
  }

  public get apiUrl(): string {
    return window.__APP_CONFIG__.API_URL
  }
}