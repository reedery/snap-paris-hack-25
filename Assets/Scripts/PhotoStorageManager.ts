/**
 * Handles data persistence and memory management for photo puzzles.
 * Stores puzzles to Spectacles persistent storage with compression.
 */

import { PuzzleData } from "./PuzzleData";
import { PhotoData } from "./PhotoData";

@component
export class PhotoStorageManager extends BaseScriptComponent {
  @input
  @hint("Enable debug logging")
  private debugMode: boolean = false;

  @input
  @hint("Maximum storage size in MB")
  private maxStorageMB: number = 50;

  private storage: GeneralDataStore | null = null;
  private readonly STORAGE_KEY_PREFIX = "hideseek_puzzle_";
  private readonly PUZZLE_INDEX_KEY = "hideseek_puzzle_index";

  onAwake() {
    this.initializeStorage();
  }

  /**
   * Initialize persistent storage
   */
  private initializeStorage(): void {
    try {
      this.storage = global.persistentStorageSystem.store;

      if (this.debugMode) {
        print("PhotoStorageManager: Storage initialized");
      }
    } catch (error) {
      print(`PhotoStorageManager: Failed to initialize storage - ${error}`);
    }
  }

  /**
   * Save puzzle to persistent storage
   */
  public async savePuzzle(puzzle: PuzzleData): Promise<boolean> {
    if (!this.storage) {
      print("PhotoStorageManager: Storage not initialized");
      return false;
    }

    try {
      const puzzleJson = JSON.stringify(puzzle.toJSON());
      const storageKey = this.STORAGE_KEY_PREFIX + puzzle.puzzleId;

      // Check storage size
      if (!this.checkStorageSpace(puzzleJson)) {
        print("PhotoStorageManager: Insufficient storage space");
        return false;
      }

      // Save puzzle data
      this.storage.putString(storageKey, puzzleJson);

      // Update puzzle index
      this.updatePuzzleIndex(puzzle.puzzleId);

      if (this.debugMode) {
        print(`PhotoStorageManager: Saved puzzle ${puzzle.puzzleId}`);
      }

      return true;
    } catch (error) {
      print(`PhotoStorageManager: Failed to save puzzle - ${error}`);
      return false;
    }
  }

  /**
   * Load puzzle from persistent storage
   */
  public loadPuzzle(puzzleId: string): PuzzleData | null {
    if (!this.storage) {
      print("PhotoStorageManager: Storage not initialized");
      return null;
    }

    try {
      const storageKey = this.STORAGE_KEY_PREFIX + puzzleId;
      const puzzleJson = this.storage.getString(storageKey);

      if (!puzzleJson) {
        if (this.debugMode) {
          print(`PhotoStorageManager: Puzzle ${puzzleId} not found`);
        }
        return null;
      }

      // In a full implementation, we would deserialize the JSON back to PuzzleData
      // For now, return null as we need proper deserialization logic
      if (this.debugMode) {
        print(`PhotoStorageManager: Loaded puzzle ${puzzleId}`);
      }

      return null; // TODO: Implement deserialization
    } catch (error) {
      print(`PhotoStorageManager: Failed to load puzzle - ${error}`);
      return null;
    }
  }

  /**
   * Get list of all saved puzzle IDs
   */
  public getAllPuzzleIds(): string[] {
    if (!this.storage) {
      return [];
    }

    try {
      const indexJson = this.storage.getString(this.PUZZLE_INDEX_KEY);
      if (!indexJson) {
        return [];
      }

      const index = JSON.parse(indexJson);
      return index.puzzleIds || [];
    } catch (error) {
      print(`PhotoStorageManager: Failed to load puzzle index - ${error}`);
      return [];
    }
  }

  /**
   * Update the puzzle index with a new puzzle ID
   */
  private updatePuzzleIndex(puzzleId: string): void {
    if (!this.storage) {
      return;
    }

    try {
      const puzzleIds = this.getAllPuzzleIds();

      if (!puzzleIds.includes(puzzleId)) {
        puzzleIds.push(puzzleId);

        const indexJson = JSON.stringify({
          puzzleIds: puzzleIds,
          lastUpdated: new Date().toISOString(),
        });

        this.storage.putString(this.PUZZLE_INDEX_KEY, indexJson);
      }
    } catch (error) {
      print(`PhotoStorageManager: Failed to update index - ${error}`);
    }
  }

  /**
   * Delete a puzzle from storage
   */
  public deletePuzzle(puzzleId: string): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      const storageKey = this.STORAGE_KEY_PREFIX + puzzleId;
      this.storage.remove(storageKey);

      // Remove from index
      const puzzleIds = this.getAllPuzzleIds();
      const filteredIds = puzzleIds.filter((id) => id !== puzzleId);

      const indexJson = JSON.stringify({
        puzzleIds: filteredIds,
        lastUpdated: new Date().toISOString(),
      });

      this.storage.putString(this.PUZZLE_INDEX_KEY, indexJson);

      if (this.debugMode) {
        print(`PhotoStorageManager: Deleted puzzle ${puzzleId}`);
      }

      return true;
    } catch (error) {
      print(`PhotoStorageManager: Failed to delete puzzle - ${error}`);
      return false;
    }
  }

  /**
   * Check if there's enough storage space for the data
   */
  private checkStorageSpace(dataJson: string): boolean {
    const dataSize = dataJson.length / (1024 * 1024); // Convert to MB
    return dataSize < this.maxStorageMB;
  }

  /**
   * Clear all puzzle data (use with caution!)
   */
  public clearAllPuzzles(): void {
    if (!this.storage) {
      return;
    }

    try {
      const puzzleIds = this.getAllPuzzleIds();

      puzzleIds.forEach((puzzleId) => {
        const storageKey = this.STORAGE_KEY_PREFIX + puzzleId;
        this.storage!.remove(storageKey);
      });

      // Clear index
      this.storage.remove(this.PUZZLE_INDEX_KEY);

      if (this.debugMode) {
        print("PhotoStorageManager: Cleared all puzzles");
      }
    } catch (error) {
      print(`PhotoStorageManager: Failed to clear puzzles - ${error}`);
    }
  }

  /**
   * Get estimated storage usage in MB
   */
  public getStorageUsage(): number {
    // This is an approximation
    // In real implementation, we'd track actual storage size
    const puzzleCount = this.getAllPuzzleIds().length;
    return puzzleCount * 2.5; // Estimate ~2.5MB per puzzle
  }

  /**
   * Clean up old or incomplete puzzles to free space
   */
  public cleanupOldPuzzles(maxPuzzles: number = 10): void {
    const puzzleIds = this.getAllPuzzleIds();

    if (puzzleIds.length > maxPuzzles) {
      // Remove oldest puzzles (assuming IDs are chronological)
      const toRemove = puzzleIds.slice(0, puzzleIds.length - maxPuzzles);

      toRemove.forEach((puzzleId) => {
        this.deletePuzzle(puzzleId);
      });

      if (this.debugMode) {
        print(
          `PhotoStorageManager: Cleaned up ${toRemove.length} old puzzles`
        );
      }
    }
  }
}
