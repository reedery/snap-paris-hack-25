/**
 * Provides immediate and detailed feedback after each photo guess
 * Shows score, errors, and visual comparisons
 */

import { PhotoScoreResult, ScoreCategory, ScoringSystem } from "./ScoringSystem";
import { PhotoTransform } from "./PhotoData";

@component
export class FeedbackController extends BaseScriptComponent {
  @input
  @hint("Feedback display duration in seconds")
  private feedbackDuration: number = 3;

  @input
  @hint("Score text component")
  private scoreText: Text | null = null;

  @input
  @hint("Category text component")
  private categoryText: Text | null = null;

  @input
  @hint("Position error text")
  private positionErrorText: Text | null = null;

  @input
  @hint("Rotation error text")
  private rotationErrorText: Text | null = null;

  @input
  @hint("Time taken text")
  private timeText: Text | null = null;

  @input
  @hint("Ghost object showing correct position")
  private correctPositionGhost: SceneObject | null = null;

  @input
  @hint("Line connecting guess to correct")
  private connectionLine: SceneObject | null = null;

  @input
  @hint("Particle effect for perfect match")
  private perfectEffect: SceneObject | null = null;

  @input
  @hint("Feedback panel scene object")
  private feedbackPanel: SceneObject | null = null;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  // Events
  public onFeedbackComplete: (() => void) | null = null;

  private isShowingFeedback: boolean = false;

  onAwake() {
    this.hideFeedbackPanel();
  }

  /**
   * Show feedback for a photo guess
   */
  public showFeedback(
    result: PhotoScoreResult,
    guessTransform: Transform,
    correctTransform: PhotoTransform
  ): void {
    this.isShowingFeedback = true;

    // Show feedback panel
    this.showFeedbackPanel(true);

    // Display immediate feedback
    this.showImmediateFeedback(result);

    // Display detailed feedback
    this.showDetailedFeedback(result);

    // Show visual comparison
    this.showVisualComparison(guessTransform, correctTransform);

    // Show celebration or encouragement
    if (result.category === ScoreCategory.PERFECT) {
      this.celebrateSuccess();
    } else if (result.category === ScoreCategory.MISS) {
      this.encourageOnMiss();
    }

    // Auto-hide after duration
    const delayEvent = this.createEvent("DelayedCallbackEvent");
    delayEvent.bind(() => {
      this.hideFeedback();
    });
    delayEvent.reset(this.feedbackDuration);

    if (this.debugMode) {
      print(`Feedback: Showing ${ScoringSystem.getCategoryName(result.category)}`);
    }
  }

  /**
   * Show immediate score and category
   */
  private showImmediateFeedback(result: PhotoScoreResult): void {
    // Display score
    if (this.scoreText) {
      this.scoreText.text = `+${result.score} points`;
      this.scoreText.enabled = true;

      // Animate score
      this.animateScoreText();
    }

    // Display category
    if (this.categoryText) {
      const categoryName = ScoringSystem.getCategoryName(result.category);
      this.categoryText.text = categoryName;
      this.categoryText.enabled = true;

      // Color code by category
      this.categoryText.textFill.color = this.getCategoryColor(result.category);
    }
  }

  /**
   * Show detailed error breakdown
   */
  private showDetailedFeedback(result: PhotoScoreResult): void {
    // Position error
    if (this.positionErrorText) {
      const direction = this.getPositionDirection(result.positionError);
      this.positionErrorText.text = `Position: ${result.positionError.toFixed(2)}m ${direction}`;
      this.positionErrorText.enabled = true;

      // Check mark or X
      if (result.positionError < 1.0) {
        this.positionErrorText.text += " ✓";
      }
    }

    // Rotation error
    if (this.rotationErrorText) {
      this.rotationErrorText.text = `Rotation: ${result.rotationError.toFixed(1)}° off`;
      this.rotationErrorText.enabled = true;

      // Check mark or X
      if (result.rotationError < 15) {
        this.rotationErrorText.text += " ✓";
      }
    }

    // Time taken
    if (this.timeText) {
      this.timeText.text = `Time: ${result.timeSpent.toFixed(1)}s`;
      this.timeText.enabled = true;
    }
  }

  /**
   * Show visual comparison of guess vs correct
   */
  private showVisualComparison(
    guessTransform: Transform,
    correctTransform: PhotoTransform
  ): void {
    // Show ghost at correct position
    if (this.correctPositionGhost) {
      const ghostTransform = this.correctPositionGhost.getTransform();
      ghostTransform.setWorldPosition(correctTransform.position);
      ghostTransform.setWorldRotation(correctTransform.rotation);
      this.correctPositionGhost.enabled = true;
    }

    // Show line connecting guess to correct
    if (this.connectionLine) {
      this.drawConnectionLine(
        guessTransform.getWorldPosition(),
        correctTransform.position
      );
      this.connectionLine.enabled = true;
    }
  }

  /**
   * Draw line from guess to correct position
   */
  private drawConnectionLine(from: vec3, to: vec3): void {
    if (!this.connectionLine) {
      return;
    }

    const lineTransform = this.connectionLine.getTransform();

    // Position at midpoint
    const midpoint = from.add(to).uniformScale(0.5);
    lineTransform.setWorldPosition(midpoint);

    // Scale to distance
    const distance = from.distance(to);
    const scale = lineTransform.getLocalScale();
    scale.y = distance;
    lineTransform.setLocalScale(scale);

    // Rotate to point from source to target
    const direction = to.sub(from).normalize();
    // Create rotation (simplified - would need proper look-at calculation)
    lineTransform.setWorldPosition(midpoint);
  }

  /**
   * Celebrate perfect match
   */
  private celebrateSuccess(): void {
    if (this.perfectEffect) {
      this.perfectEffect.enabled = true;

      // Disable after brief display
      const delayEvent = this.createEvent("DelayedCallbackEvent");
      delayEvent.bind(() => {
        if (this.perfectEffect) {
          this.perfectEffect.enabled = false;
        }
      });
      delayEvent.reset(2);
    }

    if (this.debugMode) {
      print("Feedback: Perfect match celebration!");
    }
  }

  /**
   * Encourage player on miss
   */
  private encourageOnMiss(): void {
    if (this.categoryText) {
      // Add encouraging message
      const encouragements = [
        "Keep trying!",
        "You'll get the next one!",
        "Almost there!",
        "Don't give up!",
      ];
      const randomMsg =
        encouragements[Math.floor(Math.random() * encouragements.length)];

      // Show briefly
      const delayEvent = this.createEvent("DelayedCallbackEvent");
      delayEvent.bind(() => {
        if (this.categoryText) {
          this.categoryText.text += `\n${randomMsg}`;
        }
      });
      delayEvent.reset(0.5);
    }
  }

  /**
   * Hide feedback and clean up
   */
  private hideFeedback(): void {
    this.showFeedbackPanel(false);

    // Hide ghost and line
    if (this.correctPositionGhost) {
      this.correctPositionGhost.enabled = false;
    }
    if (this.connectionLine) {
      this.connectionLine.enabled = false;
    }

    this.isShowingFeedback = false;

    // Fire completion event
    if (this.onFeedbackComplete) {
      this.onFeedbackComplete();
    }

    if (this.debugMode) {
      print("Feedback: Hidden");
    }
  }

  /**
   * Show/hide feedback panel
   */
  private showFeedbackPanel(show: boolean): void {
    if (this.feedbackPanel) {
      this.feedbackPanel.enabled = show;
    }

    // Enable/disable all text components
    if (this.scoreText) this.scoreText.enabled = show;
    if (this.categoryText) this.categoryText.enabled = show;
    if (this.positionErrorText) this.positionErrorText.enabled = show;
    if (this.rotationErrorText) this.rotationErrorText.enabled = show;
    if (this.timeText) this.timeText.enabled = show;
  }

  /**
   * Hide feedback panel
   */
  private hideFeedbackPanel(): void {
    this.showFeedbackPanel(false);
  }

  /**
   * Animate score text (scale up then normal)
   */
  private animateScoreText(): void {
    if (!this.scoreText) {
      return;
    }

    const textObj = this.scoreText.getSceneObject();
    const transform = textObj.getTransform();
    const originalScale = transform.getLocalScale();

    // Scale up
    transform.setLocalScale(originalScale.uniformScale(1.5));

    // Scale back down
    const delayEvent = this.createEvent("DelayedCallbackEvent");
    delayEvent.bind(() => {
      transform.setLocalScale(originalScale);
    });
    delayEvent.reset(0.3);
  }

  /**
   * Get color for score category
   */
  private getCategoryColor(category: ScoreCategory): vec4 {
    switch (category) {
      case ScoreCategory.PERFECT:
        return new vec4(1, 0.84, 0, 1); // Gold
      case ScoreCategory.EXCELLENT:
        return new vec4(0, 1, 0, 1); // Green
      case ScoreCategory.GOOD:
        return new vec4(0.5, 1, 0.5, 1); // Light green
      case ScoreCategory.FAIR:
        return new vec4(1, 1, 0, 1); // Yellow
      case ScoreCategory.MISS:
        return new vec4(1, 0, 0, 1); // Red
      default:
        return new vec4(1, 1, 1, 1); // White
    }
  }

  /**
   * Get position direction hint
   */
  private getPositionDirection(error: number): string {
    if (error < 0.5) {
      return "spot on!";
    } else if (error < 1.0) {
      return "very close";
    } else if (error < 2.0) {
      return "close";
    } else {
      return "off";
    }
  }

  /**
   * Check if currently showing feedback
   */
  public isShowing(): boolean {
    return this.isShowingFeedback;
  }

  /**
   * Force hide feedback (for emergency situations)
   */
  public forceHide(): void {
    this.hideFeedback();
  }
}

