import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { GAME_AUDIO_ASSETS } from "../constants/assets.constants";

const AUDIO_MUTED_PREFERENCE_KEY = 'audioMutedPreference';

@Injectable({
  providedIn: 'root'
})
export class PoolAudioService {
  
  private audioMap: Map<string, HTMLAudioElement> = new Map();
  private _isMuted = new BehaviorSubject<boolean>(false);
  
  public readonly isMuted$ = this._isMuted.asObservable();
  
  constructor() {

    Object.entries(GAME_AUDIO_ASSETS).forEach(([key, value]) => {
      this.loadAudio(
        key, 
        value
      );
    });
    
    this.loadMutePreference();
  }
  
  /**
   * Load an audio file and store it in the audio map
   */
  private loadAudio(id: string, path: string): void {
    
    const audio = new Audio(path);
    audio.load();

    this.audioMap.set(
      id, 
      audio
    );
  }
  
  /**
   * Play the specified audio if not muted
   */
  public play(id: keyof typeof GAME_AUDIO_ASSETS): void {
    if (this._isMuted.value) 
      return;

    const audio = this.audioMap.get(id);

    if (!audio)
      return;

    // Clone the audio element to allow overlapping playback
    const clone = audio.cloneNode(true) as HTMLAudioElement;
    clone.currentTime = 0;
    clone.play().catch(err => {
      console.warn(
        `Audio playback failed: ${err}`
      );
    });
  }
  
  /**
   * Toggle mute state
   */
  public toggleMute() {
    this._isMuted.next(!this._isMuted.value);
    this.saveMutePreference();
  }
    
  /**
   * Get current mute state
   */
  public get isMuted(): boolean {
    return this._isMuted.value;
  }
  
  /**
   * Save mute preference to localStorage
   */
  private saveMutePreference(): void {
    localStorage.setItem(
      AUDIO_MUTED_PREFERENCE_KEY, 
      this._isMuted.value ? 'true' : 'false'
    );
  }
  
  /**
   * Load mute preference from localStorage
   */
  private loadMutePreference(): void {
    
    const savedPreference = localStorage.getItem(
      AUDIO_MUTED_PREFERENCE_KEY
    );
    
    if (savedPreference !== null) {
      this._isMuted.next(
        savedPreference === 'true'
      );
    }
  }
}