/**
 * Manages the exploration phase where players study the space
 * before attempting to find photos
 */

@component
export class ExplorationPhaseController extends BaseScriptComponent {
  @input
  @hint("Timer text component")
  private timerText: Text | null = null;

  @input
  @hint("Mark location button scene object")
  private markButton: SceneObject | null = null;

  @input
  @hint("Tips text component")
  private tipsText: Text | null = null;

  @input
  @hint("Ready button to skip remaining time")
  private readyButton: SceneObject | null = null;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  // Events
  public onExplorationComplete: (() => void) | null = null;
  public onTimerUpdate: ((remaining: number) => void) | null = null;

  private timer: number = 0;
  private initialDuration: number = 45;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private markedLocations: vec3[] = [];
  private updateEvent: UpdateEvent | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;

  onAwake() {
    this.setupButtons();
  }

  /**
   * Set up button interactions
   */
  private setupButtons(): void {
    // Setup in actual implementation with Interactable components
  }

  /**
   * Start exploration phase with given duration
   */
  public startExploration(duration: number): void {
    this.initialDuration = duration;
    this.timer = duration;
    this.isActive = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.markedLocations = [];

    // Start update loop
    if (!this.updateEvent) {
      this.updateEvent = this.createEvent("UpdateEvent");
      this.updateEvent.bind(() => this.update());
    }

    // Show UI
    this.showExplorationUI(true);

    if (this.debugMode) {
      print(`ExplorationPhase: Started ${duration}s exploration`);
    }
  }

  /**
   * Update timer each frame
   */
  private update(): void {
    if (!this.isActive || this.isPaused) {
      return;
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    this.timer = Math.max(0, this.initialDuration - elapsed);

    // Update display
    this.updateTimerDisplay();

    // Fire timer event
    if (this.onTimerUpdate) {
      this.onTimerUpdate(this.timer);
    }

    // Check if time expired
    if (this.timer <= 0) {
      this.endExploration();
    }

    // Show urgency warnings
    if (this.timer === 10 || this.timer === 5) {
      this.showUrgencyWarning();
    }
  }

  /**
   * Update timer display
   */
  private updateTimerDisplay(): void {
    if (!this.timerText) {
      return;
    }

    const minutes = Math.floor(this.timer / 60);
    const seconds = Math.floor(this.timer % 60);
    const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    this.timerText.text = `EXPLORE: ${timeString}`;

    // Change color based on urgency
    if (this.timer < 10) {
      this.timerText.textFill.color = new vec4(1, 0, 0, 1); // Red
    } else if (this.timer < 30) {
      this.timerText.textFill.color = new vec4(1, 1, 0, 1); // Yellow
    } else {
      this.timerText.textFill.color = new vec4(1, 1, 1, 1); // White
    }
  }

  /**
   * Mark current location as interesting
   */
  public markLocation(): void {
    const transform = this.getSceneObject().getTransform();
    const position = transform.getWorldPosition();

    this.markedLocations.push(position);

    // Visual feedback - create marker at position
    this.createLocationMarker(position);

    if (this.debugMode) {
      print(
        `ExplorationPhase: Marked location (${this.markedLocations.length} total)`
      );
    }
  }

  /**
   * Create visual marker at marked location
   */
  private createLocationMarker(position: vec3): void {
    // In real implementation, would create a visual AR pin
    // at the marked location
  }

  /**
   * Allow player to skip remaining time
   */
  public skipToSeeking(): void {
    if (this.isActive) {
      this.endExploration();
    }
  }

  /**
   * End exploration phase
   */
  private endExploration(): void {
    this.isActive = false;

    // Hide UI
    this.showExplorationUI(false);

    // Fire completion event
    if (this.onExplorationComplete) {
      this.onExplorationComplete();
    }

    if (this.debugMode) {
      print(
        `ExplorationPhase: Completed with ${this.markedLocations.length} marked locations`
      );
    }
  }

  /**
   * Pause the timer
   */
  public pauseTimer(): void {
    if (this.isActive && !this.isPaused) {
      this.isPaused = true;
      this.pausedTime = Date.now();

      if (this.debugMode) {
        print("ExplorationPhase: Timer paused");
      }
    }
  }

  /**
   * Resume the timer
   */
  public resumeTimer(): void {
    if (this.isActive && this.isPaused) {
      const pauseDuration = Date.now() - this.pausedTime;
      this.startTime += pauseDuration;
      this.isPaused = false;

      if (this.debugMode) {
        print("ExplorationPhase: Timer resumed");
      }
    }
  }

  /**
   * Show/hide exploration UI
   */
  private showExplorationUI(show: boolean): void {
    if (this.timerText) {
      this.timerText.enabled = show;
    }
    if (this.markButton) {
      this.markButton.enabled = show;
    }
    if (this.tipsText) {
      this.tipsText.enabled = show;
    }
    if (this.readyButton) {
      this.readyButton.enabled = show;
    }
  }

  /**
   * Show urgency warning for low time
   */
  private showUrgencyWarning(): void {
    // Visual/audio cue for time running out
    if (this.debugMode) {
      print(`ExplorationPhase: ${this.timer}s warning!`);
    }
  }

  /**
   * Get marked locations
   */
  public getMarkedLocations(): vec3[] {
    return [...this.markedLocations];
  }

  /**
   * Get remaining time
   */
  public getRemainingTime(): number {
    return this.timer;
  }

  /**
   * Check if exploration is active
   */
  public isExploring(): boolean {
    return this.isActive && !this.isPaused;
  }
}

