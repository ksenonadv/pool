import { Injectable } from '@angular/core';

/**
 * Service responsible for providing access to application configuration values.
 * Retrieves configuration from the globally available window.__APP_CONFIG__ object.
 */
@Injectable({ 
  providedIn: 'root' 
})
export class ConfigService {
  
  /**
   * Creates an instance of the ConfigService.
   * Validates that the application configuration is available.
   * 
   * @throws Error if the configuration is not loaded
   */
  constructor() {
    if (!window.__APP_CONFIG__) {
      throw new Error('Configuration not loaded.'
      );
    }
  }

  /**
   * Gets the API URL from configuration.
   * 
   * @returns The base URL for API requests
   */
  public get apiUrl(): string {
    return window.__APP_CONFIG__.API_URL
  }

  /**
   * Gets the Socket URL from configuration.
   * 
   * @returns The URL for WebSocket connections
   */
  public get socketUrl(): string {
    return window.__APP_CONFIG__.SOCKET_URL
  }
}