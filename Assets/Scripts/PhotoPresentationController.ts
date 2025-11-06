/**
 * Controls how photos are displayed to the player during seek phase
 * Supports multiple display modes and progressive hint system
 */

import { PhotoData } from "./PhotoData";

export enum DisplayMode {
  FULL = 0,
  AR_OVERLAY = 1,
  CORNER_PEEK = 2,
  WORLD_LOCKED = 3,
}

@component
export class PhotoPresentationController extends BaseScriptComponent {
  @input
  @hint("Image component for photo display")
  private photoImage: Image | null = null;

  @input
  @hint("Scene object for AR overlay mode")
  private arOverlay: SceneObject | null = null;

  @input
  @hint("Scene object for corner preview")
  private cornerPreview: SceneObject | null = null;

  @input
  @hint("Text component for hints")
  private hintText: Text | null = null;

  @input
  @hint("Photo transparency for AR overlay (0.0-1.0)")
  private photoTransparency: number = 0.6;

  @input
  @hint("Enable progressive hints")
  private enableHints: boolean = true;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  private currentPhoto: PhotoData | null = null;
  private displayMode: DisplayMode = DisplayMode.FULL;
  private hintLevel: number = 0;
  private photoStartTime: number = 0;
  private updateEvent: UpdateEvent | null = null;

  onAwake() {
    this.hideAllDisplays();
  }

  /**
   * Show a photo to the player
   */
  public showPhoto(photoData: PhotoData): void {
    this.currentPhoto = photoData;
    this.hintLevel = 0;
    this.photoStartTime = Date.now();

    // Display photo in current mode
    this.updateDisplay();

    // Start hint timer if enabled
    if (this.enableHints) {
      this.startHintTimer();
    }

    if (this.debugMode) {
      print(`PhotoPresentation: Showing photo ${photoData.id}`);
    }
  }

  /**
   * Update the photo display based on current mode
   */
  private updateDisplay(): void {
    if (!this.currentPhoto) {
      return;
    }

    // Hide all displays first
    this.hideAllDisplays();

    // Show appropriate display
    switch (this.displayMode) {
      case DisplayMode.FULL:
        this.showFullDisplay();
        break;
      case DisplayMode.AR_OVERLAY:
        this.showAROverlay();
        break;
      case DisplayMode.CORNER_PEEK:
        this.showCornerPeek();
        break;
      case DisplayMode.WORLD_LOCKED:
        this.showWorldLocked();
        break;
    }
  }

  /**
   * Show photo in full view mode
   */
  private showFullDisplay(): void {
    if (!this.photoImage || !this.currentPhoto?.imageData) {
      return;
    }

    this.photoImage.enabled = true;
    this.photoImage.mainPass.baseTex = this.currentPhoto.imageData;
    this.photoImage.mainPass.baseColor = new vec4(1, 1, 1, 1);
  }

  /**
   * Show photo as AR overlay in field of view
   */
  private showAROverlay(): void {
    if (!this.arOverlay || !this.currentPhoto?.imageData) {
      return;
    }

    this.arOverlay.enabled = true;

    // Get image component from overlay
    const imageComponent = this.arOverlay.getComponent("Image") as Image;
    if (imageComponent) {
      imageComponent.mainPass.baseTex = this.currentPhoto.imageData;
      imageComponent.mainPass.baseColor = new vec4(
        1,
        1,
        1,
        this.photoTransparency
      );
    }
  }

  /**
   * Show small preview in corner
   */
  private showCornerPeek(): void {
    if (!this.cornerPreview || !this.currentPhoto?.imageData) {
      return;
    }

    this.cornerPreview.enabled = true;

    const imageComponent = this.cornerPreview.getComponent("Image") as Image;
    if (imageComponent) {
      imageComponent.mainPass.baseTex = this.currentPhoto.imageData;
    }
  }

  /**
   * Show photo locked at its actual world position (for feedback)
   */
  private showWorldLocked(): void {
    if (!this.arOverlay || !this.currentPhoto) {
      return;
    }

    this.arOverlay.enabled = true;

    // Position at actual photo location
    const transform = this.arOverlay.getTransform();
    transform.setWorldPosition(this.currentPhoto.transform.position);
    transform.setWorldRotation(this.currentPhoto.transform.rotation);

    const imageComponent = this.arOverlay.getComponent("Image") as Image;
    if (imageComponent && this.currentPhoto.imageData) {
      imageComponent.mainPass.baseTex = this.currentPhoto.imageData;
      imageComponent.mainPass.baseColor = new vec4(1, 1, 1, 0.8);
    }
  }

  /**
   * Hide all display modes
   */
  private hideAllDisplays(): void {
    if (this.photoImage) {
      this.photoImage.enabled = false;
    }
    if (this.arOverlay) {
      this.arOverlay.enabled = false;
    }
    if (this.cornerPreview) {
      this.cornerPreview.enabled = false;
    }
  }

  /**
   * Toggle between display modes
   */
  public toggleViewMode(): void {
    // Cycle through modes
    this.displayMode = (this.displayMode + 1) % 4;
    this.updateDisplay();

    if (this.debugMode) {
      print(`PhotoPresentation: Switched to mode ${DisplayMode[this.displayMode]}`);
    }
  }

  /**
   * Start progressive hint timer
   */
  private startHintTimer(): void {
    if (!this.updateEvent) {
      this.updateEvent = this.createEvent("UpdateEvent");
      this.updateEvent.bind(() => this.updateHints());
    }
  }

  /**
   * Update hints based on elapsed time
   */
  private updateHints(): void {
    if (!this.currentPhoto) {
      return;
    }

    const elapsed = (Date.now() - this.photoStartTime) / 1000;

    // Progressive hint levels
    let newHintLevel = 0;
    if (elapsed > 45) {
      newHintLevel = 4; // Distance meter
    } else if (elapsed > 30) {
      newHintLevel = 3; // Directional arrow
    } else if (elapsed > 15) {
      newHintLevel = 2; // Warm/cold indicator
    } else {
      newHintLevel = 1; // No hint
    }

    if (newHintLevel !== this.hintLevel) {
      this.hintLevel = newHintLevel;
      this.showHint();
    }
  }

  /**
   * Display current hint level
   */
  private showHint(): void {
    if (!this.hintText) {
      return;
    }

    switch (this.hintLevel) {
      case 1:
        this.hintText.text = "";
        break;
      case 2:
        this.hintText.text = "Hint: Getting warmer...";
        break;
      case 3:
        this.hintText.text = "Hint: Look around →";
        break;
      case 4:
        this.hintText.text = "Hint: Distance shown below";
        break;
    }

    if (this.debugMode) {
      print(`PhotoPresentation: Showing hint level ${this.hintLevel}`);
    }
  }

  /**
   * Add a manual hint (called by player request)
   */
  public addHint(): void {
    if (this.hintLevel < 4) {
      this.hintLevel++;
      this.showHint();
    }
  }

  /**
   * Hide the photo from view
   */
  public hidePhoto(): void {
    this.hideAllDisplays();
    this.currentPhoto = null;

    if (this.hintText) {
      this.hintText.text = "";
    }

    if (this.debugMode) {
      print("PhotoPresentation: Photo hidden");
    }
  }

  /**
   * Show photo at its actual world position for feedback
   */
  public showPhotoInWorld(): void {
    const previousMode = this.displayMode;
    this.displayMode = DisplayMode.WORLD_LOCKED;
    this.updateDisplay();

    // Restore previous mode after a delay
    const delayEvent = this.createEvent("DelayedCallbackEvent");
    delayEvent.bind(() => {
      this.displayMode = previousMode;
      this.updateDisplay();
    });
    delayEvent.reset(3);
  }

  /**
   * Get current display mode
   */
  public getDisplayMode(): DisplayMode {
    return this.displayMode;
  }

  /**
   * Set display mode
   */
  public setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
    this.updateDisplay();
  }

  /**
   * Get current hint level
   */
  public getHintLevel(): number {
    return this.hintLevel;
  }
}

