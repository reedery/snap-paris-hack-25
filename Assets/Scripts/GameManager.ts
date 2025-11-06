/**
 * Main Game Manager for Hide & Seek Photos - Phase 2: Seek
 * Orchestrates the entire gameplay flow from loading to completion
 */

import { PuzzleData } from "./PuzzleData";
import { PhotoData } from "./PhotoData";
import { CustomLocationSync, SyncStatus } from "./CustomLocationSync";
import { ExplorationPhaseController } from "./ExplorationPhaseController";
import { PhotoPresentationController } from "./PhotoPresentationController";
import { PositionMatchingController } from "./PositionMatchingController";
import { ScoringSystem } from "./ScoringSystem";
import { FeedbackController } from "./FeedbackController";
import { PhotoStorageManager } from "./PhotoStorageManager";

export enum GameState {
  LOADING = 0,
  EXPLORING = 1,
  SEEKING = 2,
  COMPLETE = 3,
  PAUSED = 4,
}

export enum DifficultyMode {
  EASY = 0,
  NORMAL = 1,
  HARD = 2,
  EXPERT = 3,
}

@component
export class GameManager extends BaseScriptComponent {
  @input
  @hint("Exploration phase duration in seconds")
  private explorationDuration: number = 45;

  @input("int")
  @hint("Difficulty mode for the game (0=Easy, 1=Normal, 2=Hard, 3=Expert)")
  private difficultyMode: DifficultyMode = DifficultyMode.NORMAL;

  @input
  @hint("Reference to CustomLocationSync")
  private locationSync: CustomLocationSync | null = null;

  @input
  @hint("Reference to ExplorationPhaseController")
  private explorationController: ExplorationPhaseController | null = null;

  @input
  @hint("Reference to PhotoPresentationController")
  private photoPresentationController: PhotoPresentationController | null = null;

  @input
  @hint("Reference to PositionMatchingController")
  private positionMatchingController: PositionMatchingController | null = null;

  @input
  @hint("Reference to ScoringSystem")
  private scoringSystem: ScoringSystem | null = null;

  @input
  @hint("Reference to FeedbackController")
  private feedbackController: FeedbackController | null = null;

  @input
  @hint("Reference to PhotoStorageManager")
  private storageManager: PhotoStorageManager | null = null;

  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  // Events
  public onGameStateChanged: ((state: GameState) => void) | null = null;
  public onPhotoComplete: ((index: number, score: number) => void) | null = null;
  public onGameComplete: ((totalScore: number) => void) | null = null;

  private currentPuzzle: PuzzleData | null = null;
  private gameState: GameState = GameState.LOADING;
  private photosToFind: PhotoData[] = [];
  private currentPhotoIndex: number = 0;
  private gameStartTime: number = 0;
  private photoStartTime: number = 0;

  onAwake() {
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for child controllers
   */
  private setupEventHandlers(): void {
    // Exploration phase completion
    if (this.explorationController) {
      this.explorationController.onExplorationComplete = () => {
        this.startSeeking();
      };
    }

    // Position guess captured
    if (this.positionMatchingController) {
      this.positionMatchingController.onGuessCaptured = (transform) => {
        this.processGuess(transform);
      };
    }

    // Feedback acknowledged
    if (this.feedbackController) {
      this.feedbackController.onFeedbackComplete = () => {
        this.nextPhoto();
      };
    }
  }

  /**
   * Load a puzzle by ID and prepare the game
   */
  public loadPuzzle(puzzleId: string): boolean {
    if (!this.storageManager) {
      print("GameManager: Storage manager not assigned");
      return false;
    }

    this.setState(GameState.LOADING);

    // Load puzzle data from storage
    const puzzle = this.storageManager.loadPuzzle(puzzleId);

    if (!puzzle) {
      print(`GameManager: Failed to load puzzle ${puzzleId}`);
      return false;
    }

    this.currentPuzzle = puzzle;
    this.photosToFind = [...puzzle.photos];

    // Shuffle photos for variety
    this.shufflePhotos();

    if (this.debugMode) {
      print(
        `GameManager: Loaded puzzle with ${this.photosToFind.length} photos`
      );
    }

    return true;
  }

  /**
   * Start the exploration phase
   */
  public startExploration(): boolean {
    if (!this.currentPuzzle) {
      print("GameManager: No puzzle loaded");
      return false;
    }

    if (!this.locationSync || !this.locationSync.isReadyForCapture()) {
      print("GameManager: Custom Location not synced");
      return false;
    }

    this.setState(GameState.EXPLORING);
    this.gameStartTime = Date.now();

    if (this.explorationController) {
      this.explorationController.startExploration(this.explorationDuration);
    }

    if (this.debugMode) {
      print("GameManager: Exploration phase started");
    }

    return true;
  }

  /**
   * Transition to seeking phase
   */
  public startSeeking(): boolean {
    if (this.gameState !== GameState.EXPLORING) {
      print("GameManager: Can only start seeking from exploration phase");
      return false;
    }

    this.setState(GameState.SEEKING);
    this.currentPhotoIndex = 0;

    // Present first photo
    this.presentPhoto(0);

    if (this.debugMode) {
      print("GameManager: Seeking phase started");
    }

    return true;
  }

  /**
   * Present a photo to the player
   */
  private presentPhoto(index: number): void {
    if (index >= this.photosToFind.length) {
      this.endGame();
      return;
    }

    const photo = this.photosToFind[index];
    this.photoStartTime = Date.now();

    if (this.photoPresentationController) {
      this.photoPresentationController.showPhoto(photo);
    }

    if (this.positionMatchingController) {
      this.positionMatchingController.startTracking(photo);
    }

    if (this.debugMode) {
      print(
        `GameManager: Presenting photo ${index + 1}/${this.photosToFind.length}`
      );
    }
  }

  /**
   * Process a player's position guess
   */
  private processGuess(guessTransform: Transform): void {
    if (!this.scoringSystem || this.currentPhotoIndex >= this.photosToFind.length) {
      return;
    }

    const currentPhoto = this.photosToFind[this.currentPhotoIndex];
    const timeSpent = (Date.now() - this.photoStartTime) / 1000; // Convert to seconds

    // Calculate score
    const result = this.scoringSystem.calculatePhotoScore(
      guessTransform,
      currentPhoto.transform,
      timeSpent
    );

    // Update streak
    this.scoringSystem.updateStreak(result.isSuccess);

    // Show feedback
    if (this.feedbackController && this.positionMatchingController) {
      this.feedbackController.showFeedback(
        result,
        guessTransform,
        currentPhoto.transform
      );
    }

    // Fire photo complete event
    if (this.onPhotoComplete) {
      this.onPhotoComplete(this.currentPhotoIndex, result.score);
    }

    if (this.debugMode) {
      print(
        `GameManager: Photo ${this.currentPhotoIndex + 1} scored ${result.score} points`
      );
    }
  }

  /**
   * Advance to next photo
   */
  private nextPhoto(): void {
    this.currentPhotoIndex++;

    if (this.currentPhotoIndex >= this.photosToFind.length) {
      this.endGame();
    } else {
      this.presentPhoto(this.currentPhotoIndex);
    }
  }

  /**
   * End the game and show results
   */
  private endGame(): void {
    this.setState(GameState.COMPLETE);

    if (!this.scoringSystem) {
      return;
    }

    const totalScore = this.scoringSystem.calculateTotalScore();
    const gameTime = (Date.now() - this.gameStartTime) / 1000;

    if (this.onGameComplete) {
      this.onGameComplete(totalScore);
    }

    if (this.debugMode) {
      print(
        `GameManager: Game complete! Score: ${totalScore}, Time: ${gameTime}s`
      );
    }
  }

  /**
   * Pause the game
   */
  public pauseGame(): void {
    if (this.gameState === GameState.PAUSED) {
      return;
    }

    const previousState = this.gameState;
    this.setState(GameState.PAUSED);

    // Pause timers in active controllers
    if (this.gameState === GameState.EXPLORING && this.explorationController) {
      this.explorationController.pauseTimer();
    }

    if (this.debugMode) {
      print("GameManager: Game paused");
    }
  }

  /**
   * Resume the game from pause
   */
  public resumeGame(): void {
    if (this.gameState !== GameState.PAUSED) {
      return;
    }

    // Resume from previous state
    if (this.explorationController) {
      this.explorationController.resumeTimer();
    }

    if (this.debugMode) {
      print("GameManager: Game resumed");
    }
  }

  /**
   * Get current game progress
   */
  public getProgress(): { current: number; total: number } {
    return {
      current: this.currentPhotoIndex,
      total: this.photosToFind.length,
    };
  }

  /**
   * Get current game state
   */
  public getState(): GameState {
    return this.gameState;
  }

  /**
   * Set game state and fire event
   */
  private setState(newState: GameState): void {
    const oldState = this.gameState;
    this.gameState = newState;

    if (oldState !== newState && this.onGameStateChanged) {
      this.onGameStateChanged(newState);
    }
  }

  /**
   * Shuffle photos array for variety
   */
  private shufflePhotos(): void {
    for (let i = this.photosToFind.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.photosToFind[i], this.photosToFind[j]] = [
        this.photosToFind[j],
        this.photosToFind[i],
      ];
    }
  }

  /**
   * Get difficulty settings
   */
  public getDifficultySettings(): {
    positionTolerance: number;
    rotationTolerance: number;
  } {
    switch (this.difficultyMode) {
      case DifficultyMode.EASY:
        return { positionTolerance: 2.0, rotationTolerance: 30 };
      case DifficultyMode.NORMAL:
        return { positionTolerance: 1.0, rotationTolerance: 15 };
      case DifficultyMode.HARD:
        return { positionTolerance: 0.5, rotationTolerance: 10 };
      case DifficultyMode.EXPERT:
        return { positionTolerance: 0.25, rotationTolerance: 5 };
      default:
        return { positionTolerance: 1.0, rotationTolerance: 15 };
    }
  }
}

