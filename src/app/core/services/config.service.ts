// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConfig } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly BASE_URL_KEY = 'low_code_base_url';
  private readonly CONFIG_VERSION_KEY = 'low_code_config_version';
  private readonly CURRENT_CONFIG_VERSION = '1.0';

  private configSubject = new BehaviorSubject<AppConfig>(this.loadConfig());
  public config$ = this.configSubject.asObservable();

  constructor() {
    this.validateConfigVersion();
  }

  /**
   * Set the backend base URL
   */
  setBaseUrl(url: string): void {
    const cleanUrl = this.cleanUrl(url);

    if (!this.isValidUrl(cleanUrl)) {
      throw new Error('Invalid URL format');
    }

    localStorage.setItem(this.BASE_URL_KEY, cleanUrl);
    localStorage.setItem(this.CONFIG_VERSION_KEY, this.CURRENT_CONFIG_VERSION);

    this.configSubject.next(this.loadConfig());
    console.log('✅ Base URL configured:', cleanUrl);
  }

  /**
   * Get the configured base URL
   */
  getBaseUrl(): string {
    return localStorage.getItem(this.BASE_URL_KEY) || '';
  }

  /**
   * Check if the application is configured
   */
  isConfigured(): boolean {
    const baseUrl = this.getBaseUrl();
    return Boolean(baseUrl && this.isValidUrl(baseUrl));
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    return this.configSubject.value;
  }

  /**
   * Clear configuration
   */
  clearConfig(): void {
    localStorage.removeItem(this.BASE_URL_KEY);
    localStorage.removeItem(this.CONFIG_VERSION_KEY);
    this.configSubject.next(this.loadConfig());
    console.log('✅ Configuration cleared');
  }

  /**
   * Test connection to the configured backend
   */
  testConnection(): Observable<boolean> {
    return new Observable(observer => {
      const baseUrl = this.getBaseUrl();

      if (!baseUrl) {
        observer.error(new Error('No base URL configured'));
        return;
      }

      // Create a simple fetch request to test the connection
      fetch(`${baseUrl}/api/health/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.ok) {
            observer.next(true);
            observer.complete();
          } else {
            observer.error(new Error(`HTTP ${response.status}: ${response.statusText}`));
          }
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Update configuration with new values
   */
  updateConfig(config: Partial<AppConfig>): void {
    if (config.baseUrl) {
      this.setBaseUrl(config.baseUrl);
    }
  }

  /**
   * Export configuration for backup
   */
  exportConfig(): string {
    const config = {
      baseUrl: this.getBaseUrl(),
      version: this.CURRENT_CONFIG_VERSION,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from backup
   */
  importConfig(configJson: string): void {
    try {
      const config = JSON.parse(configJson);

      if (config.baseUrl && this.isValidUrl(config.baseUrl)) {
        this.setBaseUrl(config.baseUrl);
        console.log('✅ Configuration imported successfully');
      } else {
        throw new Error('Invalid configuration format');
      }
    } catch (error) {
      console.error('❌ Failed to import configuration:', error);
      throw new Error('Invalid configuration file');
    }
  }

  /**
   * Get configuration status with details
   */
  getConfigStatus(): {
    isConfigured: boolean;
    baseUrl: string;
    version: string;
    lastUpdated: Date | null;
  } {
    const baseUrl = this.getBaseUrl();
    const version = localStorage.getItem(this.CONFIG_VERSION_KEY) || 'unknown';

    return {
      isConfigured: this.isConfigured(),
      baseUrl,
      version,
      lastUpdated: null // Could implement timestamp tracking if needed
    };
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): AppConfig {
    return {
      baseUrl: this.getBaseUrl(),
      isConfigured: this.isConfigured()
    };
  }

  /**
   * Clean and normalize URL
   */
  private cleanUrl(url: string): string {
    let cleanUrl = url.trim();

    // Remove trailing slash
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    return cleanUrl;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * Validate configuration version and migrate if needed
   */
  private validateConfigVersion(): void {
    const storedVersion = localStorage.getItem(this.CONFIG_VERSION_KEY);

    if (!storedVersion) {
      // First time setup or old version without version tracking
      const baseUrl = this.getBaseUrl();
      if (baseUrl) {
        localStorage.setItem(this.CONFIG_VERSION_KEY, this.CURRENT_CONFIG_VERSION);
        console.log('✅ Configuration version updated to', this.CURRENT_CONFIG_VERSION);
      }
    } else if (storedVersion !== this.CURRENT_CONFIG_VERSION) {
      // Handle version migration if needed
      this.migrateConfiguration(storedVersion, this.CURRENT_CONFIG_VERSION);
    }
  }

  /**
   * Migrate configuration between versions
   */
  private migrateConfiguration(fromVersion: string, toVersion: string): void {
    console.log(`🔄 Migrating configuration from ${fromVersion} to ${toVersion}`);

    // Add migration logic here as needed
    // For now, just update the version
    localStorage.setItem(this.CONFIG_VERSION_KEY, toVersion);

    console.log('✅ Configuration migration completed');
  }
}
