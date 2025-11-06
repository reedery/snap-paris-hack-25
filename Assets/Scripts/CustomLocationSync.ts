/**
 * Monitors Custom Location tracking status and provides feedback.
 * Ensures proper tracking before allowing photo capture.
 */

@component
export class CustomLocationSync extends BaseScriptComponent {
  @input
  @hint("Reference to the Custom Location asset")
  private customLocation: LocationAsset | null = null;

  @input
  @hint("Minimum tracking confidence required (0.0 - 1.0)")
  private minConfidence: number = 0.7;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  // Events for status changes
  public onSyncStatusChanged: ((status: SyncStatus) => void) | null = null;
  public onConfidenceChanged: ((confidence: number) => void) | null = null;

  private currentStatus: SyncStatus = SyncStatus.NOT_SYNCED;
  private currentConfidence: number = 0.0;
  private trackingComponent: DeviceLocationTrackingComponent | null = null;
  private updateEvent: UpdateEvent | null = null;

  onAwake() {
    this.setupLocationTracking();
    this.startMonitoring();
  }

  /**
   * Set up location tracking component reference
   */
  private setupLocationTracking(): void {
    if (!this.customLocation) {
      print("CustomLocationSync: No custom location asset assigned!");
      return;
    }

    // Find DeviceLocationTrackingComponent in scene
    const sceneObjects = this.getSceneObject().getParent()?.children;
    if (sceneObjects) {
      for (let i = 0; i < sceneObjects.length; i++) {
        const tracking = sceneObjects[i].getComponent(
          "DeviceLocationTrackingComponent"
        ) as DeviceLocationTrackingComponent;
        if (tracking) {
          this.trackingComponent = tracking;
          break;
        }
      }
    }

    if (!this.trackingComponent && this.debugMode) {
      print("CustomLocationSync: DeviceLocationTrackingComponent not found");
    }
  }

  /**
   * Start monitoring location tracking status
   */
  private startMonitoring(): void {
    this.updateEvent = this.createEvent("UpdateEvent");
    this.updateEvent.bind(() => this.update());
  }

  /**
   * Update tracking status each frame
   */
  private update(): void {
    if (!this.trackingComponent || !this.customLocation) {
      this.updateStatus(SyncStatus.NOT_SYNCED, 0.0);
      return;
    }

    const isTracking = this.trackingComponent.isTracking();
    const trackingQuality = this.getTrackingQuality();

    // Determine sync status
    let newStatus = this.currentStatus;

    if (!isTracking) {
      newStatus = SyncStatus.NOT_SYNCED;
    } else if (trackingQuality < this.minConfidence * 0.5) {
      newStatus = SyncStatus.LOST;
    } else if (trackingQuality < this.minConfidence) {
      newStatus = SyncStatus.SYNCING;
    } else if (trackingQuality >= this.minConfidence) {
      if (this.currentStatus === SyncStatus.SYNCED) {
        // Check if quality degraded
        if (trackingQuality < this.minConfidence * 1.2) {
          newStatus = SyncStatus.POOR_TRACKING;
        }
      } else {
        newStatus = SyncStatus.SYNCED;
      }
    }

    this.updateStatus(newStatus, trackingQuality);
  }

  /**
   * Get current tracking quality/confidence
   */
  private getTrackingQuality(): number {
    if (!this.trackingComponent) {
      return 0.0;
    }

    // In real implementation, this would get actual tracking confidence
    // For now, we'll simulate based on tracking state
    if (this.trackingComponent.isTracking()) {
      // Simulate confidence value
      return 0.8 + Math.random() * 0.2;
    }

    return 0.0;
  }

  /**
   * Update status and fire events if changed
   */
  private updateStatus(newStatus: SyncStatus, confidence: number): void {
    const statusChanged = newStatus !== this.currentStatus;
    const confidenceChanged = Math.abs(confidence - this.currentConfidence) > 0.01;

    if (statusChanged) {
      this.currentStatus = newStatus;
      if (this.onSyncStatusChanged) {
        this.onSyncStatusChanged(newStatus);
      }

      if (this.debugMode) {
        print(`CustomLocationSync: Status changed to ${SyncStatus[newStatus]}`);
      }
    }

    if (confidenceChanged) {
      this.currentConfidence = confidence;
      if (this.onConfidenceChanged) {
        this.onConfidenceChanged(confidence);
      }
    }
  }

  /**
   * Check if ready for photo capture
   */
  public isReadyForCapture(): boolean {
    return (
      this.currentStatus === SyncStatus.SYNCED &&
      this.currentConfidence >= this.minConfidence
    );
  }

  /**
   * Get current sync status
   */
  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * Get current tracking confidence
   */
  public getConfidence(): number {
    return this.currentConfidence;
  }

  /**
   * Get status as human-readable string
   */
  public getStatusMessage(): string {
    switch (this.currentStatus) {
      case SyncStatus.NOT_SYNCED:
        return "Location not found - Look around the area";
      case SyncStatus.SYNCING:
        return "Syncing to location...";
      case SyncStatus.SYNCED:
        return "Ready to capture";
      case SyncStatus.POOR_TRACKING:
        return "Tracking quality low - Move slower";
      case SyncStatus.LOST:
        return "Tracking lost - Return to location";
      default:
        return "Unknown status";
    }
  }

  /**
   * Force re-localization
   */
  public relocalize(): void {
    if (this.trackingComponent) {
      // Reset tracking to force re-localization
      this.updateStatus(SyncStatus.SYNCING, 0.0);
      if (this.debugMode) {
        print("CustomLocationSync: Re-localization requested");
      }
    }
  }
}

/**
 * Sync status enumeration
 */
export enum SyncStatus {
  NOT_SYNCED = 0,
  SYNCING = 1,
  SYNCED = 2,
  POOR_TRACKING = 3,
  LOST = 4,
}
