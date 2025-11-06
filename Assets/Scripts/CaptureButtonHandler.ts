/**
 * Handler for the capture button interaction.
 * Triggers photo capture when button is tapped.
 */

import { PhotoCaptureManager } from "./PhotoCaptureManager";

@component
export class CaptureButtonHandler extends BaseScriptComponent {
  @input
  @hint("Reference to PhotoCaptureManager component")
  private captureManager: PhotoCaptureManager | null = null;

  @input
  @hint("Reference to Interactable component on this button")
  private interactable: Interactable | null = null;

  @input
  @hint("Enable haptic feedback on tap")
  private enableHaptics: boolean = true;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  private isTapping: boolean = false;

  onAwake() {
    this.setupInteraction();
  }

  /**
   * Set up interaction events
   */
  private setupInteraction(): void {
    if (!this.interactable) {
      print("CaptureButtonHandler: No Interactable component assigned!");
      return;
    }

    // Bind tap event
    this.interactable.onTap.add(() => {
      this.onButtonTapped();
    });

    // Optional: Add hover effects
    this.interactable.onHoverEnter.add(() => {
      this.onHoverEnter();
    });

    this.interactable.onHoverExit.add(() => {
      this.onHoverExit();
    });

    if (this.debugMode) {
      print("CaptureButtonHandler: Interaction setup complete");
    }
  }

  /**
   * Handle button tap - trigger photo capture
   */
  private onButtonTapped(): void {
    if (this.isTapping) {
      if (this.debugMode) {
        print("CaptureButtonHandler: Tap ignored - already processing");
      }
      return;
    }

    this.isTapping = true;

    if (!this.captureManager) {
      print("CaptureButtonHandler: No CaptureManager assigned!");
      this.isTapping = false;
      return;
    }

    // Trigger capture
    const success = this.captureManager.capturePhoto();

    if (success) {
      this.onCaptureSuccess();
    } else {
      this.onCaptureFailed();
    }

    // Reset tap state
    const delayEvent = this.createEvent("DelayedCallbackEvent");
    delayEvent.bind(() => {
      this.isTapping = false;
    });
    delayEvent.reset(0.1);
  }

  /**
   * Handle successful capture
   */
  private onCaptureSuccess(): void {
    if (this.debugMode) {
      print("CaptureButtonHandler: Photo captured successfully!");
    }

    // Trigger haptic feedback
    if (this.enableHaptics) {
      this.triggerHaptic();
    }

    // Visual feedback - scale animation
    this.animateButton();
  }

  /**
   * Handle failed capture
   */
  private onCaptureFailed(): void {
    if (this.debugMode) {
      print("CaptureButtonHandler: Photo capture failed");
    }

    // Different visual feedback for failure
    this.animateButtonError();
  }

  /**
   * Handle hover enter
   */
  private onHoverEnter(): void {
    if (this.debugMode) {
      print("CaptureButtonHandler: Hover enter");
    }

    // Scale up slightly
    const transform = this.getSceneObject().getTransform();
    const currentScale = transform.getLocalScale();
    transform.setLocalScale(currentScale.uniformScale(1.1));
  }

  /**
   * Handle hover exit
   */
  private onHoverExit(): void {
    if (this.debugMode) {
      print("CaptureButtonHandler: Hover exit");
    }

    // Reset scale
    const transform = this.getSceneObject().getTransform();
    const currentScale = transform.getLocalScale();
    transform.setLocalScale(currentScale.uniformScale(1.0 / 1.1));
  }

  /**
   * Animate button on successful capture
   */
  private animateButton(): void {
    const transform = this.getSceneObject().getTransform();
    const originalScale = transform.getLocalScale();

    // Quick scale down then back up
    transform.setLocalScale(originalScale.uniformScale(0.8));

    const delayEvent = this.createEvent("DelayedCallbackEvent");
    delayEvent.bind(() => {
      transform.setLocalScale(originalScale);
    });
    delayEvent.reset(0.1);
  }

  /**
   * Animate button on failed capture
   */
  private animateButtonError(): void {
    const transform = this.getSceneObject().getTransform();
    const originalPosition = transform.getLocalPosition();

    // Shake animation
    const shakeAmount = 10;
    let shakeCount = 0;
    const maxShakes = 6;

    const shakeInterval = this.createEvent("UpdateEvent");
    shakeInterval.bind(() => {
      if (shakeCount >= maxShakes) {
        transform.setLocalPosition(originalPosition);
        shakeInterval.enabled = false;
        return;
      }

      const offset = shakeCount % 2 === 0 ? shakeAmount : -shakeAmount;
      const newPos = originalPosition.add(new vec3(offset, 0, 0));
      transform.setLocalPosition(newPos);
      shakeCount++;
    });
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHaptic(): void {
    // Implementation depends on Spectacles haptic API
    // Placeholder for now
    if (this.debugMode) {
      print("CaptureButtonHandler: Haptic triggered");
    }
  }

  /**
   * Public method to enable/disable button
   */
  public setEnabled(enabled: boolean): void {
    if (this.interactable) {
      this.interactable.enabled = enabled;
    }

    // Update visual state
    const sceneObj = this.getSceneObject();
    sceneObj.enabled = enabled;

    if (this.debugMode) {
      print(`CaptureButtonHandler: Button ${enabled ? "enabled" : "disabled"}`);
    }
  }
}
