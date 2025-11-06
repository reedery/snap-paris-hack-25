/**
 * Handles player positioning and guess capture for photo matching
 * Tracks position/rotation and provides guidance to the player
 */

import { PhotoData, PhotoTransform } from "./PhotoData";

@component
export class PositionMatchingController extends BaseScriptComponent {
  @input
  @hint("Device tracking component")
  private deviceTracking: DeviceTracking | null = null;

  @input
  @hint("Position tolerance in meters")
  private positionTolerance: number = 1.0;

  @input
  @hint("Rotation tolerance in degrees")
  private rotationTolerance: number = 15.0;

  @input
  @hint("Ghost outline object at target position")
  private ghostOutline: SceneObject | null = null;

  @input
  @hint("Distance indicator text")
  private distanceText: Text | null = null;

  @input
  @hint("Rotation indicator object")
  private rotationIndicator: SceneObject | null = null;

  @input
  @hint("Ground circle showing target area")
  private targetCircle: SceneObject | null = null;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  // Events
  public onGuessCaptured: ((transform: Transform) => void) | null = null;
  public onPositionUpdate: ((distance: number, angleError: number) => void) | null = null;

  private playerTransform: Transform | null = null;
  private targetTransform: PhotoTransform | null = null;
  private guessTransform: Transform | null = null;
  private isTracking: boolean = false;
  private updateEvent: UpdateEvent | null = null;

  onAwake() {
    this.playerTransform = this.getSceneObject().getTransform();
  }

  /**
   * Start tracking for a specific photo
   */
  public startTracking(photo: PhotoData): void {
    this.targetTransform = photo.transform;
    this.isTracking = true;

    // Show guidance elements
    this.showGuidance(true);

    // Position ghost at target
    if (this.ghostOutline && this.targetTransform) {
      const ghostTransform = this.ghostOutline.getTransform();
      ghostTransform.setWorldPosition(this.targetTransform.position);
      ghostTransform.setWorldRotation(this.targetTransform.rotation);
      this.ghostOutline.enabled = true;
    }

    // Position target circle
    if (this.targetCircle && this.targetTransform) {
      const circleTransform = this.targetCircle.getTransform();
      const groundPos = new vec3(
        this.targetTransform.position.x,
        0,
        this.targetTransform.position.z
      );
      circleTransform.setWorldPosition(groundPos);
      this.targetCircle.enabled = true;
    }

    // Start update loop
    if (!this.updateEvent) {
      this.updateEvent = this.createEvent("UpdateEvent");
      this.updateEvent.bind(() => this.update());
    }

    if (this.debugMode) {
      print("PositionMatching: Started tracking");
    }
  }

  /**
   * Stop tracking
   */
  public stopTracking(): void {
    this.isTracking = false;
    this.showGuidance(false);

    if (this.debugMode) {
      print("PositionMatching: Stopped tracking");
    }
  }

  /**
   * Update tracking and guidance each frame
   */
  private update(): void {
    if (!this.isTracking || !this.targetTransform || !this.playerTransform) {
      return;
    }

    const posError = this.calculatePositionError();
    const rotError = this.calculateRotationError();

    // Update guidance
    this.updatePositionGuidance(posError);
    this.updateRotationGuidance(rotError);

    // Fire update event
    if (this.onPositionUpdate) {
      this.onPositionUpdate(posError, rotError);
    }
  }

  /**
   * Capture current position as the player's guess
   */
  public captureGuess(): void {
    if (!this.playerTransform) {
      print("PositionMatching: Cannot capture - no player transform");
      return;
    }

    this.guessTransform = this.playerTransform;

    // Stop tracking
    this.stopTracking();

    // Fire guess captured event
    if (this.onGuessCaptured) {
      this.onGuessCaptured(this.guessTransform);
    }

    if (this.debugMode) {
      const posError = this.calculatePositionError();
      const rotError = this.calculateRotationError();
      print(
        `PositionMatching: Guess captured - Pos: ${posError.toFixed(2)}m, Rot: ${rotError.toFixed(1)}°`
      );
    }
  }

  /**
   * Calculate distance between player and target position
   */
  public calculatePositionError(): number {
    if (!this.playerTransform || !this.targetTransform) {
      return -1;
    }

    const playerPos = this.playerTransform.getWorldPosition();
    const targetPos = this.targetTransform.position;

    return playerPos.distance(targetPos);
  }

  /**
   * Calculate angular difference between player and target rotation
   */
  public calculateRotationError(): number {
    if (!this.playerTransform || !this.targetTransform) {
      return -1;
    }

    const playerRot = this.playerTransform.getWorldRotation();
    const targetRot = this.targetTransform.rotation;

    // Calculate angle between quaternions
    const dot = Math.abs(
      playerRot.x * targetRot.x +
        playerRot.y * targetRot.y +
        playerRot.z * targetRot.z +
        playerRot.w * targetRot.w
    );

    const angle = 2 * Math.acos(Math.min(1, dot)) * (180 / Math.PI);

    return angle;
  }

  /**
   * Check if current position is within tolerance
   */
  public isWithinTolerance(): boolean {
    const posError = this.calculatePositionError();
    const rotError = this.calculateRotationError();

    return (
      posError >= 0 &&
      rotError >= 0 &&
      posError <= this.positionTolerance &&
      rotError <= this.rotationTolerance
    );
  }

  /**
   * Update position guidance display
   */
  private updatePositionGuidance(distance: number): void {
    if (!this.distanceText) {
      return;
    }

    if (distance < 0) {
      this.distanceText.text = "";
      return;
    }

    this.distanceText.text = `${distance.toFixed(1)}m away`;

    // Color code by accuracy
    if (distance < this.positionTolerance) {
      this.distanceText.textFill.color = new vec4(0, 1, 0, 1); // Green
    } else if (distance < this.positionTolerance * 2) {
      this.distanceText.textFill.color = new vec4(1, 1, 0, 1); // Yellow
    } else {
      this.distanceText.textFill.color = new vec4(1, 0, 0, 1); // Red
    }
  }

  /**
   * Update rotation guidance display
   */
  private updateRotationGuidance(angleError: number): void {
    if (!this.rotationIndicator || angleError < 0) {
      return;
    }

    // Rotate indicator based on error
    const indicatorTransform = this.rotationIndicator.getTransform();
    const rotation = quat.angleAxis(angleError * (Math.PI / 180), vec3.up());
    indicatorTransform.setLocalRotation(rotation);

    // Color code the indicator
    const material = this.rotationIndicator.getComponent(
      "RenderMeshVisual"
    ) as RenderMeshVisual;
    if (material) {
      if (angleError < this.rotationTolerance) {
        material.mainPass.baseColor = new vec4(0, 1, 0, 1); // Green
      } else if (angleError < this.rotationTolerance * 2) {
        material.mainPass.baseColor = new vec4(1, 1, 0, 1); // Yellow
      } else {
        material.mainPass.baseColor = new vec4(1, 0, 0, 1); // Red
      }
    }
  }

  /**
   * Show/hide guidance elements
   */
  private showGuidance(show: boolean): void {
    if (this.ghostOutline) {
      this.ghostOutline.enabled = show;
    }
    if (this.distanceText) {
      this.distanceText.enabled = show;
    }
    if (this.rotationIndicator) {
      this.rotationIndicator.enabled = show;
    }
    if (this.targetCircle) {
      this.targetCircle.enabled = show;
    }
  }

  /**
   * Get current position error
   */
  public getCurrentPositionError(): number {
    return this.calculatePositionError();
  }

  /**
   * Get current rotation error
   */
  public getCurrentRotationError(): number {
    return this.calculateRotationError();
  }

  /**
   * Get the last captured guess
   */
  public getGuessTransform(): Transform | null {
    return this.guessTransform;
  }

  /**
   * Set position tolerance
   */
  public setPositionTolerance(tolerance: number): void {
    this.positionTolerance = tolerance;
  }

  /**
   * Set rotation tolerance
   */
  public setRotationTolerance(tolerance: number): void {
    this.rotationTolerance = tolerance;
  }
}

