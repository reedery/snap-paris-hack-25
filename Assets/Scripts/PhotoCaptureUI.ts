/**
 * UI Controller for photo capture interface.
 * Provides visual feedback and user guidance during capture session.
 */

import { PhotoCaptureManager } from "./PhotoCaptureManager";
import { CustomLocationSync, SyncStatus } from "./CustomLocationSync";
import { PhotoData } from "./PhotoData";
import { PuzzleData } from "./PuzzleData";

@component
export class PhotoCaptureUI extends BaseScriptComponent {
  @input
  @hint("Reference to PhotoCaptureManager")
  private captureManager: PhotoCaptureManager | null = null;

  @input
  @hint("Reference to CustomLocationSync")
  private locationSync: CustomLocationSync | null = null;

  @input
  @hint("Text component for photo counter")
  private counterText: Text | null = null;

  @input
  @hint("Text component for status messages")
  private statusText: Text | null = null;

  @input
  @hint("SceneObject for progress bar")
  private progressBar: SceneObject | null = null;

  @input
  @hint("SceneObject for sync indicator")
  private syncIndicator: SceneObject | null = null;

  @input
  @hint("SceneObject for capture button")
  private captureButton: SceneObject | null = null;

  @input
  @hint("Material for status color feedback")
  private statusMaterial: Material | null = null;

  @input
  @hint("Enable haptic feedback on capture")
  private enableHaptics: boolean = true;

  @input
  @hint("Enable debug mode")
  private debugMode: boolean = false;

  private updateEvent: UpdateEvent | null = null;

  onAwake() {
    this.setupEventListeners();
    this.startUIUpdate();
  }

  /**
   * Set up event listeners for capture manager
   */
  private setupEventListeners(): void {
    if (!this.captureManager) {
      print("PhotoCaptureUI: CaptureManager not assigned!");
      return;
    }

    // Listen for photo captures
    this.captureManager.onPhotoCapture = (photo: PhotoData) => {
      this.onPhotoCaptured(photo);
    };

    // Listen for progress updates
    this.captureManager.onCaptureProgress = (current: number, max: number) => {
      this.updateProgress(current, max);
    };

    // Listen for puzzle completion
    this.captureManager.onPuzzleComplete = (puzzle: PuzzleData) => {
      this.onPuzzleCompleted(puzzle);
    };

    // Listen for errors
    this.captureManager.onCaptureError = (error: string) => {
      this.showError(error);
    };

    // Listen for sync status changes
    if (this.locationSync) {
      this.locationSync.onSyncStatusChanged = (status: SyncStatus) => {
        this.updateSyncStatus(status);
      };
    }
  }

  /**
   * Start UI update loop
   */
  private startUIUpdate(): void {
    this.updateEvent = this.createEvent("UpdateEvent");
    this.updateEvent.bind(() => this.update());
  }

  /**
   * Update UI each frame
   */
  private update(): void {
    this.updateCounter();
    this.updateStatus();
    this.updateCaptureButton();
  }

  /**
   * Update photo counter display
   */
  private updateCounter(): void {
    if (!this.counterText || !this.captureManager) {
      return;
    }

    const current = this.captureManager.getCurrentCount();
    const max = 15; // Get from manager config

    this.counterText.text = `${current}/${max} photos`;
  }

  /**
   * Update status message
   */
  private updateStatus(): void {
    if (!this.statusText) {
      return;
    }

    if (this.locationSync) {
      this.statusText.text = this.locationSync.getStatusMessage();
    }
  }

  /**
   * Update capture button visibility/state
   */
  private updateCaptureButton(): void {
    if (!this.captureButton || !this.captureManager) {
      return;
    }

    const canCapture = this.captureManager.isReadyToCapture();
    this.captureButton.enabled = canCapture;

    // Update button visual state
    if (this.statusMaterial) {
      const color = canCapture ? new vec4(0, 1, 0, 1) : new vec4(0.5, 0.5, 0.5, 1);
      this.statusMaterial.mainPass.baseColor = color;
    }
  }

  /**
   * Update sync status indicator
   */
  private updateSyncStatus(status: SyncStatus): void {
    if (!this.syncIndicator || !this.statusMaterial) {
      return;
    }

    let color: vec4;

    switch (status) {
      case SyncStatus.SYNCED:
        color = new vec4(0, 1, 0, 1); // Green
        break;
      case SyncStatus.SYNCING:
        color = new vec4(1, 1, 0, 1); // Yellow
        break;
      case SyncStatus.POOR_TRACKING:
        color = new vec4(1, 0.5, 0, 1); // Orange
        break;
      case SyncStatus.LOST:
      case SyncStatus.NOT_SYNCED:
        color = new vec4(1, 0, 0, 1); // Red
        break;
      default:
        color = new vec4(0.5, 0.5, 0.5, 1); // Gray
    }

    this.statusMaterial.mainPass.baseColor = color;

    if (this.debugMode) {
      print(`PhotoCaptureUI: Sync status updated to ${SyncStatus[status]}`);
    }
  }

  /**
   * Update progress bar
   */
  private updateProgress(current: number, max: number): void {
    if (!this.progressBar) {
      return;
    }

    const progress = current / max;
    const scale = this.progressBar.getTransform().getLocalScale();
    scale.x = progress;
    this.progressBar.getTransform().setLocalScale(scale);
  }

  /**
   * Handle photo captured event
   */
  private onPhotoCaptured(photo: PhotoData): void {
    // Visual flash effect
    this.showCaptureFlash();

    // Haptic feedback
    if (this.enableHaptics) {
      this.triggerHapticFeedback();
    }

    if (this.debugMode) {
      print(`PhotoCaptureUI: Photo captured - ${photo.id}`);
    }
  }

  /**
   * Handle puzzle completed event
   */
  private onPuzzleCompleted(puzzle: PuzzleData): void {
    if (this.statusText) {
      this.statusText.text = "Puzzle Complete! 🎉";
    }

    // Show completion animation
    this.showCompletionAnimation();

    if (this.debugMode) {
      print(`PhotoCaptureUI: Puzzle completed - ${puzzle.puzzleId}`);
    }
  }

  /**
   * Show error message to user
   */
  private showError(error: string): void {
    if (this.statusText) {
      this.statusText.text = `Error: ${error}`;
    }

    // Flash red
    if (this.statusMaterial) {
      this.statusMaterial.mainPass.baseColor = new vec4(1, 0, 0, 1);

      const delayEvent = this.createEvent("DelayedCallbackEvent");
      delayEvent.bind(() => {
        if (this.statusMaterial) {
          this.statusMaterial.mainPass.baseColor = new vec4(1, 1, 1, 1);
        }
      });
      delayEvent.reset(0.5);
    }

    print(`PhotoCaptureUI Error: ${error}`);
  }

  /**
   * Visual effects
   */
  private showCaptureFlash(): void {
    // Implement flash effect
    // Could animate a white overlay or screen effect
  }

  private showCompletionAnimation(): void {
    // Implement celebration animation
    // Could scale up text, show particles, etc.
  }

  private triggerHapticFeedback(): void {
    // Trigger device haptic feedback
    // API depends on Spectacles haptic capabilities
  }

  /**
   * Public methods for external interaction
   */
  public showMessage(message: string, duration: number = 2.0): void {
    if (this.statusText) {
      this.statusText.text = message;

      const delayEvent = this.createEvent("DelayedCallbackEvent");
      delayEvent.bind(() => {
        this.updateStatus(); // Restore normal status
      });
      delayEvent.reset(duration);
    }
  }

  public setProgressBarColor(color: vec4): void {
    if (this.progressBar && this.statusMaterial) {
      this.statusMaterial.mainPass.baseColor = color;
    }
  }
}
