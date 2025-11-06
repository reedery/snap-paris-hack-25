/**
 * Scoring system for the Hide & Seek game
 * Calculates scores based on position/rotation accuracy and time
 */

import { PhotoTransform } from "./PhotoData";

export enum ScoreCategory {
  PERFECT = 0,
  EXCELLENT = 1,
  GOOD = 2,
  FAIR = 3,
  MISS = 4,
}

export interface PhotoScoreResult {
  score: number;
  positionError: number;
  rotationError: number;
  timeSpent: number;
  category: ScoreCategory;
  isSuccess: boolean;
}

@component
export class ScoringSystem extends BaseScriptComponent {
  @input
  @hint("Base points per photo")
  private basePoints: number = 1000;

  @input
  @hint("Position error weight in scoring")
  private positionErrorWeight: number = 100;

  @input
  @hint("Rotation error weight in scoring")
  private rotationErrorWeight: number = 10;

  @input
  @hint("Time penalty weight")
  private timePenaltyWeight: number = 5;

  @input
  @hint("Streak bonus per consecutive success")
  private streakBonus: number = 100;

  @input
  @hint("Perfect match bonus")
  private perfectBonus: number = 500;

  @input
  @hint("Speed bonus for quick completion")
  private speedBonus: number = 250;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  private photoScores: PhotoScoreResult[] = [];
  private streakCounter: number = 0;
  private bonusMultiplier: number = 1.0;
  private totalTime: number = 0;

  /**
   * Calculate score for a single photo attempt
   */
  public calculatePhotoScore(
    guessTransform: Transform,
    targetTransform: PhotoTransform,
    timeSpent: number
  ): PhotoScoreResult {
    // Calculate errors
    const positionError = this.calculatePositionError(
      guessTransform.getWorldPosition(),
      targetTransform.position
    );

    const rotationError = this.calculateRotationError(
      guessTransform.getWorldRotation(),
      targetTransform.rotation
    );

    // Calculate base score with penalties
    let score = this.basePoints;

    // Position penalty (quadratic to emphasize accuracy)
    score -= Math.pow(positionError, 2) * this.positionErrorWeight;

    // Rotation penalty (quadratic)
    score -= Math.pow(rotationError / 10, 2) * this.rotationErrorWeight;

    // Time penalty
    score -= timeSpent * this.timePenaltyWeight;

    // Apply streak multiplier
    score *= this.bonusMultiplier;

    // Ensure score is not negative
    score = Math.max(0, Math.floor(score));

    // Determine category and success
    const category = this.determineCategory(positionError, rotationError);
    const isSuccess = category !== ScoreCategory.MISS;

    // Add perfect bonus
    if (category === ScoreCategory.PERFECT) {
      score += this.perfectBonus;
    }

    const result: PhotoScoreResult = {
      score,
      positionError,
      rotationError,
      timeSpent,
      category,
      isSuccess,
    };

    // Store result
    this.photoScores.push(result);
    this.totalTime += timeSpent;

    if (this.debugMode) {
      print(
        `Scoring: ${score} pts (Pos: ${positionError.toFixed(2)}m, Rot: ${rotationError.toFixed(1)}°, Time: ${timeSpent.toFixed(1)}s)`
      );
    }

    return result;
  }

  /**
   * Calculate position error in meters
   */
  private calculatePositionError(guess: vec3, target: vec3): number {
    return guess.distance(target);
  }

  /**
   * Calculate rotation error in degrees
   */
  private calculateRotationError(guess: quat, target: quat): number {
    // Calculate angle between quaternions
    const dot = Math.abs(
      guess.x * target.x + guess.y * target.y + guess.z * target.z + guess.w * target.w
    );

    const angle = 2 * Math.acos(Math.min(1, dot)) * (180 / Math.PI);

    return angle;
  }

  /**
   * Determine score category based on errors
   */
  private determineCategory(
    positionError: number,
    rotationError: number
  ): ScoreCategory {
    if (positionError < 0.5 && rotationError < 5) {
      return ScoreCategory.PERFECT;
    } else if (positionError < 1.0 && rotationError < 10) {
      return ScoreCategory.EXCELLENT;
    } else if (positionError < 2.0 && rotationError < 20) {
      return ScoreCategory.GOOD;
    } else if (positionError < 3.0 && rotationError < 30) {
      return ScoreCategory.FAIR;
    } else {
      return ScoreCategory.MISS;
    }
  }

  /**
   * Update streak counter
   */
  public updateStreak(isSuccess: boolean): void {
    if (isSuccess) {
      this.streakCounter++;
      this.bonusMultiplier = 1.0 + this.streakCounter * 0.1; // 10% per streak

      if (this.debugMode) {
        print(`Scoring: Streak increased to ${this.streakCounter}`);
      }
    } else {
      this.streakCounter = 0;
      this.bonusMultiplier = 1.0;

      if (this.debugMode) {
        print("Scoring: Streak reset");
      }
    }
  }

  /**
   * Calculate total score with bonuses
   */
  public calculateTotalScore(): number {
    let total = 0;

    // Sum all photo scores
    for (const result of this.photoScores) {
      total += result.score;
    }

    // Add streak bonuses
    const streakBonusTotal = this.streakCounter * this.streakBonus;
    total += streakBonusTotal;

    // Add speed bonus if under par time
    const parTime = this.photoScores.length * 30; // 30 seconds per photo
    if (this.totalTime < parTime) {
      total += this.speedBonus;
    }

    if (this.debugMode) {
      print(
        `Scoring: Total ${total} (Base: ${total - streakBonusTotal}, Streak Bonus: ${streakBonusTotal})`
      );
    }

    return Math.floor(total);
  }

  /**
   * Generate detailed score breakdown
   */
  public generateScoreBreakdown(): {
    photoScores: PhotoScoreResult[];
    streakBonus: number;
    speedBonus: number;
    totalScore: number;
    averageTime: number;
    successRate: number;
  } {
    const streakBonusTotal = this.streakCounter * this.streakBonus;
    const parTime = this.photoScores.length * 30;
    const speedBonusApplied = this.totalTime < parTime ? this.speedBonus : 0;

    const successCount = this.photoScores.filter((r) => r.isSuccess).length;
    const successRate = this.photoScores.length > 0 
      ? successCount / this.photoScores.length 
      : 0;

    return {
      photoScores: [...this.photoScores],
      streakBonus: streakBonusTotal,
      speedBonus: speedBonusApplied,
      totalScore: this.calculateTotalScore(),
      averageTime: this.photoScores.length > 0 
        ? this.totalTime / this.photoScores.length 
        : 0,
      successRate,
    };
  }

  /**
   * Compare to par score (expected performance)
   */
  public compareToParScore(): {
    playerScore: number;
    parScore: number;
    difference: number;
    performance: string;
  } {
    const playerScore = this.calculateTotalScore();
    // Par score assumes GOOD performance on all photos
    const parScore = this.photoScores.length * 600; // Approximate good score per photo

    const difference = playerScore - parScore;

    let performance = "Average";
    if (difference > parScore * 0.5) {
      performance = "Exceptional";
    } else if (difference > parScore * 0.2) {
      performance = "Excellent";
    } else if (difference > 0) {
      performance = "Above Average";
    } else if (difference > -parScore * 0.2) {
      performance = "Average";
    } else {
      performance = "Below Average";
    }

    return {
      playerScore,
      parScore,
      difference,
      performance,
    };
  }

  /**
   * Get current streak count
   */
  public getStreakCount(): number {
    return this.streakCounter;
  }

  /**
   * Get all photo scores
   */
  public getPhotoScores(): PhotoScoreResult[] {
    return [...this.photoScores];
  }

  /**
   * Get total time spent
   */
  public getTotalTime(): number {
    return this.totalTime;
  }

  /**
   * Reset scoring system for new game
   */
  public reset(): void {
    this.photoScores = [];
    this.streakCounter = 0;
    this.bonusMultiplier = 1.0;
    this.totalTime = 0;

    if (this.debugMode) {
      print("Scoring: System reset");
    }
  }

  /**
   * Get category name as string
   */
  public static getCategoryName(category: ScoreCategory): string {
    switch (category) {
      case ScoreCategory.PERFECT:
        return "PERFECT";
      case ScoreCategory.EXCELLENT:
        return "EXCELLENT";
      case ScoreCategory.GOOD:
        return "GOOD";
      case ScoreCategory.FAIR:
        return "FAIR";
      case ScoreCategory.MISS:
        return "MISS";
      default:
        return "UNKNOWN";
    }
  }
}

