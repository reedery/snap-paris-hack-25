/**
 * Data structure for individual photo information in the Hide & Seek game.
 * Each photo captures RGB data, device transform, and metadata at a specific location.
 */

export interface PhotoTransform {
  position: vec3;
  rotation: quat;
  eulerAngles: vec3;
}

export interface PhotoMetadata {
  customLocationId: string;
  deviceInfo: string;
  lightingConditions: number; // 0.0 - 1.0 ambient light level
  captureIndex: number;
}

export class PhotoData {
  public id: string;
  public imageData: Texture | null = null;
  public transform: PhotoTransform;
  public timestamp: number;
  public metadata: PhotoMetadata;
  public thumbnail: Texture | null = null;
  public difficulty: number = 0.0;

  constructor(
    id: string,
    transform: PhotoTransform,
    metadata: PhotoMetadata
  ) {
    this.id = id;
    this.transform = transform;
    this.timestamp = Date.now();
    this.metadata = metadata;
  }

  /**
   * Validate that the photo has all required data
   */
  public isValid(): boolean {
    return (
      this.id !== null &&
      this.id.length > 0 &&
      this.imageData !== null &&
      this.transform !== null &&
      this.transform.position !== null &&
      this.transform.rotation !== null &&
      this.timestamp > 0 &&
      this.metadata !== null &&
      this.metadata.customLocationId.length > 0
    );
  }

  /**
   * Calculate difficulty based on image features
   * Higher difficulty = more complex image (edges, contrast, features)
   */
  public calculateDifficulty(): void {
    // Placeholder for difficulty calculation
    // In real implementation, this would analyze the image
    // for features like edge density, color variance, etc.
    this.difficulty = Math.random() * 0.5 + 0.3; // 0.3 - 0.8 range
  }

  /**
   * Serialize to JSON-compatible object
   */
  public toJSON(): object {
    return {
      id: this.id,
      transform: {
        position: [
          this.transform.position.x,
          this.transform.position.y,
          this.transform.position.z,
        ],
        rotation: [
          this.transform.rotation.x,
          this.transform.rotation.y,
          this.transform.rotation.z,
          this.transform.rotation.w,
        ],
        euler: [
          this.transform.eulerAngles.x,
          this.transform.eulerAngles.y,
          this.transform.eulerAngles.z,
        ],
      },
      timestamp: this.timestamp,
      metadata: this.metadata,
      difficulty: this.difficulty,
    };
  }

  /**
   * Generate unique ID for photo
   */
  public static generateId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
