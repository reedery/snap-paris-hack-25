/**
 * Main controller for photo capture session in Hide & Seek game.
 * Orchestrates photo capture, validation, and puzzle creation.
 */

import { PhotoData, PhotoTransform, PhotoMetadata } from "./PhotoData";
import { PuzzleData } from "./PuzzleData";
import { CustomLocationSync, SyncStatus } from "./CustomLocationSync";
import { PhotoStorageManager } from "./PhotoStorageManager";

@component
export class PhotoCaptureManager extends BaseScriptComponent {
  @input
  @hint("Maximum number of photos per puzzle")
  private maxPhotos: number = 15;

  @input
  @hint("Minimum photos required to create valid puzzle")
  private minPhotos: number = 5;

  @input
  @hint("Cooldown between captures in seconds")
  private captureDelay: number = 0.5;

  @input
  @hint("Auto-save progress every N photos")
  private autoSaveInterval: number = 3;

  @input
  @hint("Reference to CustomLocationSync component")
  private locationSync: CustomLocationSync | null = null;

  @input
  @hint("Reference to PhotoStorageManager component")
  private storageManager: PhotoStorageManager | null = null;

  @input
  @hint("Camera component for capturing photos")
  private camera: Camera | null = null;

  @input
  @hint("Custom Location asset ID")
  private customLocationId: string = "";

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  // Events
  public onPhotoCapture: ((photo: PhotoData) => void) | null = null;
  public onCaptureProgress: ((current: number, max: number) => void) | null = null;
  public onPuzzleComplete: ((puzzle: PuzzleData) => void) | null = null;
  public onCaptureError: ((error: string) => void) | null = null;

  private currentPuzzle: PuzzleData | null = null;
  private canCapture: boolean = true;
  private lastCaptureTime: number = 0;
  private sessionStartTime: number = 0;
  private isInitialized: boolean = false;

  onAwake() {
    this.validateComponents();
  }

  /**
   * Validate all required components are assigned
   */
  private validateComponents(): void {
    let hasErrors = false;

    if (!this.locationSync) {
      print("PhotoCaptureManager: CustomLocationSync not assigned!");
      hasErrors = true;
    }

    if (!this.storageManager) {
      print("PhotoCaptureManager: PhotoStorageManager not assigned!");
      hasErrors = true;
    }

    if (!this.camera) {
      print("PhotoCaptureManager: Camera not assigned!");
      hasErrors = true;
    }

    if (this.customLocationId.length === 0) {
      print("PhotoCaptureManager: Custom Location ID not set!");
      hasErrors = true;
    }

    if (hasErrors) {
      this.fireError("Required components missing - check Inspector");
    }
  }

  /**
   * Initialize the capture session
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      if (this.debugMode) {
        print("PhotoCaptureManager: Already initialized");
      }
      return true;
    }

    // Verify Custom Location sync
    if (!this.locationSync || !this.locationSync.isReadyForCapture()) {
      this.fireError("Custom Location not synced");
      return false;
    }

    // Create new puzzle
    const deviceId = this.getDeviceId();
    this.currentPuzzle = new PuzzleData(this.customLocationId, deviceId);
    this.sessionStartTime = Date.now();
    this.isInitialized = true;

    if (this.debugMode) {
      print(
        `PhotoCaptureManager: Initialized session - Puzzle ID: ${this.currentPuzzle.puzzleId}`
      );
    }

    return true;
  }

  /**
   * Capture a single photo with all metadata
   */
  public capturePhoto(): boolean {
    // Validate state
    if (!this.isInitialized) {
      if (!this.initialize()) {
        return false;
      }
    }

    if (!this.canCapture) {
      this.fireError("Capture on cooldown");
      return false;
    }

    if (!this.currentPuzzle) {
      this.fireError("No active puzzle session");
      return false;
    }

    // Check photo limit
    if (this.currentPuzzle.photos.length >= this.maxPhotos) {
      this.fireError("Maximum photos reached");
      return false;
    }

    // Validate tracking
    if (!this.locationSync || !this.locationSync.isReadyForCapture()) {
      this.fireError("Tracking not ready");
      return false;
    }

    // Capture the photo
    const photo = this.performCapture();

    if (!photo) {
      this.fireError("Capture failed");
      return false;
    }

    // Validate capture
    if (!this.validateCapture(photo)) {
      this.fireError("Invalid photo data");
      return false;
    }

    // Add to puzzle
    this.currentPuzzle.addPhoto(photo);

    // Fire progress event
    if (this.onCaptureProgress) {
      this.onCaptureProgress(
        this.currentPuzzle.photos.length,
        this.maxPhotos
      );
    }

    // Fire capture event
    if (this.onPhotoCapture) {
      this.onPhotoCapture(photo);
    }

    // Auto-save if interval reached
    if (
      this.currentPuzzle.photos.length % this.autoSaveInterval === 0
    ) {
      this.saveProgress();
    }

    // Check if puzzle complete
    if (this.currentPuzzle.photos.length >= this.maxPhotos) {
      this.finalizePuzzle();
    }

    // Start cooldown
    this.startCaptureDelay();

    if (this.debugMode) {
      print(
        `PhotoCaptureManager: Captured photo ${this.currentPuzzle.photos.length}/${this.maxPhotos}`
      );
    }

    return true;
  }

  /**
   * Perform the actual photo capture
   */
  private performCapture(): PhotoData | null {
    try {
      // Generate unique ID
      const photoId = PhotoData.generateId();

      // Get device transform
      const transform = this.getDeviceTransform();

      // Create metadata
      const metadata: PhotoMetadata = {
        customLocationId: this.customLocationId,
        deviceInfo: this.getDeviceInfo(),
        lightingConditions: this.getLightingConditions(),
        captureIndex: this.currentPuzzle!.photos.length + 1,
      };

      // Create photo data
      const photo = new PhotoData(photoId, transform, metadata);

      // Capture image (simplified - in real implementation would capture actual texture)
      photo.imageData = this.captureImage();

      // Calculate difficulty
      photo.calculateDifficulty();

      return photo;
    } catch (error) {
      print(`PhotoCaptureManager: Capture error - ${error}`);
      return null;
    }
  }

  /**
   * Get current device transform in Custom Location space
   */
  private getDeviceTransform(): PhotoTransform {
    const deviceTransform = this.getSceneObject().getTransform();

    return {
      position: deviceTransform.getWorldPosition(),
      rotation: deviceTransform.getWorldRotation(),
      eulerAngles: this.quaternionToEuler(deviceTransform.getWorldRotation()),
    };
  }

  /**
   * Convert quaternion to euler angles
   */
  private quaternionToEuler(quat: quat): vec3 {
    // Simplified conversion - in production use proper quaternion math
    return new vec3(0, 0, 0); // Placeholder
  }

  /**
   * Capture image from camera
   */
  private captureImage(): Texture | null {
    // In real implementation, would capture from camera component
    // For now, return null as placeholder
    return null;
  }

  /**
   * Get current lighting conditions
   */
  private getLightingConditions(): number {
    // Placeholder - would read from light sensor
    return 0.5;
  }

  /**
   * Validate captured photo has all required data
   */
  private validateCapture(photo: PhotoData): boolean {
    return photo.isValid();
  }

  /**
   * Save current progress to prevent data loss
   */
  private saveProgress(): void {
    if (!this.currentPuzzle || !this.storageManager) {
      return;
    }

    // Save as temporary progress
    this.storageManager.savePuzzle(this.currentPuzzle);

    if (this.debugMode) {
      print("PhotoCaptureManager: Progress saved");
    }
  }

  /**
   * Finalize and package all photos into puzzle format
   */
  public finalizePuzzle(): boolean {
    if (!this.currentPuzzle) {
      this.fireError("No active puzzle to finalize");
      return false;
    }

    // Validate minimum photos
    if (!this.currentPuzzle.isValid(this.minPhotos)) {
      this.fireError(`Minimum ${this.minPhotos} photos required`);
      return false;
    }

    // Save final puzzle
    if (this.storageManager) {
      this.storageManager.savePuzzle(this.currentPuzzle);
    }

    // Fire completion event
    if (this.onPuzzleComplete) {
      this.onPuzzleComplete(this.currentPuzzle);
    }

    if (this.debugMode) {
      print(
        `PhotoCaptureManager: Puzzle finalized - ${this.currentPuzzle.photos.length} photos`
      );
    }

    return true;
  }

  /**
   * Reset current session for new capture set
   */
  public reset(): void {
    this.currentPuzzle = null;
    this.isInitialized = false;
    this.canCapture = true;
    this.lastCaptureTime = 0;

    if (this.debugMode) {
      print("PhotoCaptureManager: Session reset");
    }
  }

  /**
   * Start capture delay cooldown
   */
  private startCaptureDelay(): void {
    this.canCapture = false;
    this.lastCaptureTime = Date.now();

    const delayEvent = this.createEvent("DelayedCallbackEvent");
    delayEvent.bind(() => {
      this.canCapture = true;
    });
    delayEvent.reset(this.captureDelay);
  }

  /**
   * Get current photo count
   */
  public getCurrentCount(): number {
    return this.currentPuzzle ? this.currentPuzzle.photos.length : 0;
  }

  /**
   * Check if ready to capture
   */
  public isReadyToCapture(): boolean {
    return (
      this.isInitialized &&
      this.canCapture &&
      this.currentPuzzle !== null &&
      this.currentPuzzle.photos.length < this.maxPhotos &&
      (this.locationSync?.isReadyForCapture() ?? false)
    );
  }

  /**
   * Helper methods
   */
  private getDeviceId(): string {
    // In real implementation, would get actual device ID
    return `device_${Date.now()}`;
  }

  private getDeviceInfo(): string {
    return "Spectacles 2024";
  }

  private fireError(message: string): void {
    print(`PhotoCaptureManager Error: ${message}`);
    if (this.onCaptureError) {
      this.onCaptureError(message);
    }
  }
}
