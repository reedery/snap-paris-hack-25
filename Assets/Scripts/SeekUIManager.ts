/**
 * UI Manager for Seek phase gameplay
 * Handles all UI elements during the photo finding experience
 */

import { GameManager, GameState } from "./GameManager";
import { ScoringSystem } from "./ScoringSystem";
import { CustomLocationSync, SyncStatus } from "./CustomLocationSync";

@component
export class SeekUIManager extends BaseScriptComponent {
  @input
  @hint("Reference to GameManager")
  private gameManager: GameManager | null = null;

  @input
  @hint("Reference to ScoringSystem")
  private scoringSystem: ScoringSystem | null = null;

  @input
  @hint("Reference to CustomLocationSync")
  private locationSync: CustomLocationSync | null = null;

  @input
  @hint("Progress text (e.g., 'Photo 3/10')")
  private progressText: Text | null = null;

  @input
  @hint("Timer text showing elapsed time")
  private timerText: Text | null = null;

  @input
  @hint("Current score display")
  private scoreDisplay: Text | null = null;

  @input
  @hint("Streak indicator")
  private streakText: Text | null = null;

  @input
  @hint("Status message text")
  private statusText: Text | null = null;

  @input
  @hint("Sync indicator object")
  private syncIndicator: SceneObject | null = null;

  @input
  @hint("Main action button (capture guess)")
  private actionButton: SceneObject | null = null;

  @input
  @hint("Next photo button")
  private nextButton: SceneObject | null = null;

  @input
  @hint("Pause button")
  private pauseButton: SceneObject | null = null;

  @input
  @hint("Completion panel")
  private completionPanel: SceneObject | null = null;

  @input
  @hint("Final score text")
  private finalScoreText: Text | null = null;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  private updateEvent: UpdateEvent | null = null;
  private gameStartTime: number = 0;
  private currentState: GameState = GameState.LOADING;

  onAwake() {
    this.setupEventHandlers();
    this.hideCompletionPanel();

    // Start update loop
    this.updateEvent = this.createEvent("UpdateEvent");
    this.updateEvent.bind(() => this.update());
  }

  /**
   * Set up event handlers from game manager
   */
  private setupEventHandlers(): void {
    if (this.gameManager) {
      this.gameManager.onGameStateChanged = (state: GameState) => {
        this.onStateChanged(state);
      };

      this.gameManager.onPhotoComplete = (index: number, score: number) => {
        this.onPhotoCompleted(index, score);
      };

      this.gameManager.onGameComplete = (totalScore: number) => {
        this.onGameCompleted(totalScore);
      };
    }
  }

  /**
   * Update UI each frame
   */
  private update(): void {
    this.updateProgress();
    this.updateTimer();
    this.updateScore();
    this.updateStreak();
    this.updateSyncStatus();
  }

  /**
   * Update progress indicator
   */
  private updateProgress(): void {
    if (!this.progressText || !this.gameManager) {
      return;
    }

    const progress = this.gameManager.getProgress();
    this.progressText.text = `Photo ${progress.current + 1}/${progress.total}`;
  }

  /**
   * Update elapsed time display
   */
  private updateTimer(): void {
    if (!this.timerText) {
      return;
    }

    if (this.gameStartTime === 0) {
      this.gameStartTime = Date.now();
    }

    const elapsed = (Date.now() - this.gameStartTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);

    this.timerText.text = `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Update current score display
   */
  private updateScore(): void {
    if (!this.scoreDisplay || !this.scoringSystem) {
      return;
    }

    const totalScore = this.scoringSystem.calculateTotalScore();
    this.scoreDisplay.text = `Score: ${totalScore}`;
  }

  /**
   * Update streak indicator
   */
  private updateStreak(): void {
    if (!this.streakText || !this.scoringSystem) {
      return;
    }

    const streak = this.scoringSystem.getStreakCount();

    if (streak > 0) {
      this.streakText.text = `Streak: ${streak} 🔥`;
      this.streakText.enabled = true;
    } else {
      this.streakText.enabled = false;
    }
  }

  /**
   * Update sync status indicator
   */
  private updateSyncStatus(): void {
    if (!this.syncIndicator || !this.locationSync) {
      return;
    }

    const status = this.locationSync.getStatus();
    const visual = this.syncIndicator.getComponent(
      "RenderMeshVisual"
    ) as RenderMeshVisual;

    if (visual) {
      switch (status) {
        case SyncStatus.SYNCED:
          visual.mainPass.baseColor = new vec4(0, 1, 0, 1); // Green
          break;
        case SyncStatus.SYNCING:
          visual.mainPass.baseColor = new vec4(1, 1, 0, 1); // Yellow
          break;
        case SyncStatus.POOR_TRACKING:
          visual.mainPass.baseColor = new vec4(1, 0.5, 0, 1); // Orange
          break;
        case SyncStatus.LOST:
        case SyncStatus.NOT_SYNCED:
          visual.mainPass.baseColor = new vec4(1, 0, 0, 1); // Red
          break;
      }
    }

    // Update status text
    if (this.statusText) {
      this.statusText.text = this.locationSync.getStatusMessage();
    }
  }

  /**
   * Handle game state changes
   */
  private onStateChanged(state: GameState): void {
    this.currentState = state;

    switch (state) {
      case GameState.LOADING:
        this.showLoadingUI();
        break;
      case GameState.EXPLORING:
        this.showExploringUI();
        break;
      case GameState.SEEKING:
        this.showSeekingUI();
        this.gameStartTime = Date.now();
        break;
      case GameState.COMPLETE:
        // Completion is handled in onGameCompleted() callback
        break;
      case GameState.PAUSED:
        this.showPausedUI();
        break;
    }

    if (this.debugMode) {
      print(`SeekUI: State changed to ${GameState[state]}`);
    }
  }

  /**
   * Handle photo completion
   */
  private onPhotoCompleted(index: number, score: number): void {
    // Brief flash or animation
    if (this.debugMode) {
      print(`SeekUI: Photo ${index + 1} completed with ${score} points`);
    }
  }

  /**
   * Handle game completion
   */
  private onGameCompleted(totalScore: number): void {
    this.showCompletionPanel(totalScore);

    if (this.debugMode) {
      print(`SeekUI: Game completed with ${totalScore} points`);
    }
  }

  /**
   * Show loading UI
   */
  private showLoadingUI(): void {
    if (this.statusText) {
      this.statusText.text = "Loading puzzle...";
    }

    this.hideGameplayUI();
  }

  /**
   * Show exploration UI
   */
  private showExploringUI(): void {
    if (this.statusText) {
      this.statusText.text = "Explore the area!";
    }

    this.hideGameplayUI();
  }

  /**
   * Show seeking phase UI
   */
  private showSeekingUI(): void {
    this.showGameplayUI();

    if (this.statusText) {
      this.statusText.text = "Find the photo location!";
    }
  }

  /**
   * Show paused UI
   */
  private showPausedUI(): void {
    if (this.statusText) {
      this.statusText.text = "PAUSED";
      this.statusText.textFill.color = new vec4(1, 1, 0, 1);
    }
  }

  /**
   * Show/hide gameplay UI elements
   */
  private showGameplayUI(): void {
    if (this.progressText) this.progressText.enabled = true;
    if (this.timerText) this.timerText.enabled = true;
    if (this.scoreDisplay) this.scoreDisplay.enabled = true;
    if (this.actionButton) this.actionButton.enabled = true;
    if (this.pauseButton) this.pauseButton.enabled = true;
  }

  private hideGameplayUI(): void {
    if (this.progressText) this.progressText.enabled = false;
    if (this.timerText) this.timerText.enabled = false;
    if (this.scoreDisplay) this.scoreDisplay.enabled = false;
    if (this.actionButton) this.actionButton.enabled = false;
    if (this.streakText) this.streakText.enabled = false;
  }

  /**
   * Show completion panel with results
   */
  private showCompletionPanel(totalScore: number): void {
    if (!this.completionPanel) {
      return;
    }

    this.completionPanel.enabled = true;
    this.hideGameplayUI();

    // Display final score
    if (this.finalScoreText) {
      this.finalScoreText.text = `Final Score: ${totalScore}`;
    }

    // Show detailed breakdown
    if (this.scoringSystem) {
      const breakdown = this.scoringSystem.generateScoreBreakdown();
      const comparison = this.scoringSystem.compareToParScore();

      if (this.statusText) {
        this.statusText.text = `Performance: ${comparison.performance}\n` +
          `Success Rate: ${(breakdown.successRate * 100).toFixed(0)}%\n` +
          `Avg Time: ${breakdown.averageTime.toFixed(1)}s`;
      }
    }
  }

  /**
   * Hide completion panel
   */
  private hideCompletionPanel(): void {
    if (this.completionPanel) {
      this.completionPanel.enabled = false;
    }
  }

  /**
   * Show status message temporarily
   */
  public showMessage(message: string, duration: number = 2.0): void {
    if (!this.statusText) {
      return;
    }

    this.statusText.text = message;

    const delayEvent = this.createEvent("DelayedCallbackEvent");
    delayEvent.bind(() => {
      if (this.statusText) {
        this.statusText.text = "";
      }
    });
    delayEvent.reset(duration);
  }

  /**
   * Enable/disable action button
   */
  public setActionButtonEnabled(enabled: boolean): void {
    if (this.actionButton) {
      this.actionButton.enabled = enabled;
    }
  }

  /**
   * Show/hide next button
   */
  public setNextButtonVisible(visible: boolean): void {
    if (this.nextButton) {
      this.nextButton.enabled = visible;
    }
  }

  /**
   * Flash UI element for attention
   */
  public flashElement(element: SceneObject, duration: number = 0.5): void {
    if (!element) {
      return;
    }

    const visual = element.getComponent("RenderMeshVisual") as RenderMeshVisual;
    if (visual) {
      const originalColor = visual.mainPass.baseColor;

      // Flash white
      visual.mainPass.baseColor = new vec4(1, 1, 1, 1);

      const delayEvent = this.createEvent("DelayedCallbackEvent");
      delayEvent.bind(() => {
        visual.mainPass.baseColor = originalColor;
      });
      delayEvent.reset(duration);
    }
  }
}

