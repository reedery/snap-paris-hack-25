/**
 * Container for complete photo set - the "puzzle" in Hide & Seek game.
 * Stores all photos from a capture session with metadata about the puzzle.
 */

import { PhotoData } from "./PhotoData";

export interface PuzzleBounds {
  min: vec3;
  max: vec3;
}

export interface PuzzleMetadata {
  createdAt: string;
  photoCount: number;
  estimatedDifficulty: number;
  locationBounds: PuzzleBounds;
  totalCaptureTime: number; // milliseconds
}

export class PuzzleData {
  public puzzleId: string;
  public creatorId: string;
  public customLocationId: string;
  public photos: PhotoData[] = [];
  public metadata: PuzzleMetadata;
  public version: string = "1.0";

  constructor(customLocationId: string, creatorId: string) {
    this.puzzleId = PuzzleData.generateId();
    this.creatorId = creatorId;
    this.customLocationId = customLocationId;
    this.metadata = {
      createdAt: new Date().toISOString(),
      photoCount: 0,
      estimatedDifficulty: 0.0,
      locationBounds: {
        min: new vec3(Infinity, Infinity, Infinity),
        max: new vec3(-Infinity, -Infinity, -Infinity),
      },
      totalCaptureTime: 0,
    };
  }

  /**
   * Add a photo to the puzzle
   */
  public addPhoto(photo: PhotoData): void {
    this.photos.push(photo);
    this.metadata.photoCount = this.photos.length;
    this.updateBounds(photo.transform.position);
    this.updateCaptureTime();
    this.calculateDifficulty();
  }

  /**
   * Update the bounding box to include the new photo position
   */
  private updateBounds(position: vec3): void {
    const bounds = this.metadata.locationBounds;

    bounds.min.x = Math.min(bounds.min.x, position.x);
    bounds.min.y = Math.min(bounds.min.y, position.y);
    bounds.min.z = Math.min(bounds.min.z, position.z);

    bounds.max.x = Math.max(bounds.max.x, position.x);
    bounds.max.y = Math.max(bounds.max.y, position.y);
    bounds.max.z = Math.max(bounds.max.z, position.z);
  }

  /**
   * Update total capture time based on first and last photo timestamps
   */
  private updateCaptureTime(): void {
    if (this.photos.length < 2) {
      this.metadata.totalCaptureTime = 0;
      return;
    }

    const firstPhoto = this.photos[0];
    const lastPhoto = this.photos[this.photos.length - 1];
    this.metadata.totalCaptureTime = lastPhoto.timestamp - firstPhoto.timestamp;
  }

  /**
   * Calculate overall puzzle difficulty as average of all photo difficulties
   */
  private calculateDifficulty(): void {
    if (this.photos.length === 0) {
      this.metadata.estimatedDifficulty = 0.0;
      return;
    }

    const totalDifficulty = this.photos.reduce(
      (sum, photo) => sum + photo.difficulty,
      0
    );
    this.metadata.estimatedDifficulty = totalDifficulty / this.photos.length;
  }

  /**
   * Check if puzzle meets minimum requirements
   */
  public isValid(minPhotos: number): boolean {
    return (
      this.photos.length >= minPhotos &&
      this.photos.every((photo) => photo.isValid()) &&
      this.customLocationId.length > 0
    );
  }

  /**
   * Get puzzle size in terms of spatial coverage
   */
  public getSpatialCoverage(): vec3 {
    const bounds = this.metadata.locationBounds;
    return new vec3(
      bounds.max.x - bounds.min.x,
      bounds.max.y - bounds.min.y,
      bounds.max.z - bounds.min.z
    );
  }

  /**
   * Serialize to JSON format
   */
  public toJSON(): object {
    return {
      puzzleId: this.puzzleId,
      version: this.version,
      customLocation: this.customLocationId,
      creatorId: this.creatorId,
      photos: this.photos.map((photo) => photo.toJSON()),
      metadata: {
        createdAt: this.metadata.createdAt,
        photoCount: this.metadata.photoCount,
        estimatedDifficulty: this.metadata.estimatedDifficulty,
        bounds: {
          min: [
            this.metadata.locationBounds.min.x,
            this.metadata.locationBounds.min.y,
            this.metadata.locationBounds.min.z,
          ],
          max: [
            this.metadata.locationBounds.max.x,
            this.metadata.locationBounds.max.y,
            this.metadata.locationBounds.max.z,
          ],
        },
        totalTime: this.metadata.totalCaptureTime,
      },
    };
  }

  /**
   * Generate unique ID for puzzle
   */
  public static generateId(): string {
    return `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
