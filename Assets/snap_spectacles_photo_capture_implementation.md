# Photo Capture Implementation Guide for Snap Spectacles
## Hide & Seek Photos - Phase 1: Photo Capture

---

## Overview
This document provides implementation directions for building the photo capture system in Lens Studio for Snap Spectacles. The system allows users to take multiple photos within a Custom Location, storing RGB data, device transform, and metadata for later use in the game.

---

## Prerequisites
- [ ] Lens Studio with Spectacles support enabled
- [ ] Custom Location already configured and tested
- [ ] Spectacles device paired and ready for testing
- [ ] Understanding of Lens Studio's Component system and TypeScript

---

## Core Components to Implement

### 1. PhotoCaptureManager Script
**Purpose**: Main controller for the photo capture session

**Required Properties**:
- `maxPhotos`: Number (configurable in Inspector, default: 10-15)
- `minPhotos`: Number (minimum required to create valid puzzle, default: 5)
- `captureDelay`: Number (cooldown between captures in seconds, default: 0.5)
- `autoSaveInterval`: Number (saves progress every N photos, default: 3)

**Required Methods**:
- `initialize()`: Set up the capture session, verify Custom Location sync
- `capturePhoto()`: Handle single photo capture with all metadata
- `validateCapture()`: Ensure photo has valid data before storing
- `saveProgress()`: Auto-save current captures to prevent data loss
- `finalizePuzzle()`: Package all photos into puzzle format
- `reset()`: Clear current session for new capture set

**State Management**:
- Track current photo count
- Maintain capture enabled/disabled state
- Monitor Custom Location sync status
- Handle memory management for multiple photos

---

### 2. PhotoData Structure
**Purpose**: Data container for individual photo information

**Required Fields**:
- `id`: Unique identifier (UUID recommended)
- `imageData`: RGB texture/image buffer
- `transform`: Device world transform at capture time
  - `position`: Vec3 (x, y, z in Custom Location space)
  - `rotation`: Quat (quaternion for full orientation)
  - `eulerAngles`: Vec3 (human-readable rotation)
- `timestamp`: Capture time (milliseconds since session start)
- `metadata`:
  - `customLocationId`: Reference to which Custom Location
  - `deviceInfo`: Spectacles model/version
  - `lightingConditions`: Ambient light sensor data if available
  - `captureIndex`: Order in sequence (1 of N)
- `thumbnail`: Low-res preview (64x64 or 128x128)
- `difficulty`: Auto-calculated based on image features

---

### 3. PuzzleData Structure
**Purpose**: Container for complete photo set

**Required Fields**:
- `puzzleId`: Unique puzzle identifier
- `creatorId`: User/device identifier
- `customLocationId`: Which Custom Location this puzzle belongs to
- `photos`: Array of PhotoData objects
- `metadata`:
  - `createdAt`: Timestamp of puzzle creation
  - `photoCount`: Total number of photos
  - `estimatedDifficulty`: Overall puzzle difficulty rating
  - `locationBounds`: Bounding box of all photo positions
  - `totalCaptureTime`: Time from first to last photo
- `version`: Data structure version for compatibility

---

### 4. CustomLocationSync Component
**Purpose**: Ensure proper Custom Location tracking before capture

**Required Functionality**:
- Monitor Custom Location tracking status
- Provide visual/audio feedback for sync quality
- Block photo capture if tracking is poor
- Re-localize if tracking is lost
- Display confidence level to user

**Status Indicators**:
- NOT_SYNCED: Custom Location not yet found
- SYNCING: Actively localizing to Custom Location  
- SYNCED: Ready for capture
- POOR_TRACKING: Degraded tracking quality
- LOST: Tracking lost, need to re-sync

---

### 5. UI Controller
**Purpose**: Visual feedback and user guidance

**Required UI Elements**:
- Photo counter display (e.g., "3/10 photos taken")
- Capture button or gesture trigger
- Current status indicator (ready/processing/saved)
- Progress bar for session completion
- Sync status indicator
- Preview of last captured photo (optional)

**Feedback Systems**:
- Visual flash or frame effect on capture
- Success haptic feedback
- Error states (tracking lost, memory full)
- Completion celebration when all photos taken

---

### 6. Storage Manager
**Purpose**: Handle data persistence and memory management

**Required Functionality**:
- Serialize PhotoData to efficient format
- Compress image data without losing quality
- Store to Spectacles persistent storage
- Handle storage limits gracefully
- Implement cleanup for old/incomplete puzzles
- Export/import puzzle data

**Storage Strategy**:
- Keep current session in memory
- Write to persistent storage at intervals
- Compress completed puzzles
- Maintain index of all puzzles

---

## Implementation Flow

### Initialization Sequence
1. User launches Lens in Custom Location
2. System checks for Custom Location availability
3. Begin Custom Location synchronization
4. Display sync progress to user
5. Once synced, enable photo capture interface
6. Initialize PhotoCaptureManager with settings
7. Ready for first photo

### Photo Capture Sequence
1. User triggers capture (button/gesture)
2. Validate tracking quality
3. Capture current camera feed
4. Record device transform
5. Generate timestamp
6. Create PhotoData object
7. Validate all data present
8. Add to current puzzle array
9. Update UI counter
10. Save progress if interval reached
11. Check if puzzle complete

### Puzzle Completion Sequence
1. Final photo captured
2. Validate minimum photos taken
3. Calculate puzzle statistics
4. Generate puzzle metadata
5. Create PuzzleData object
6. Serialize to storage format
7. Save to persistent storage
8. Display completion UI
9. Option to create new puzzle or exit

---

## User Experience Considerations

### Visual Feedback
- Clear indication when ready to capture
- Visible photo counter always present
- Success confirmation for each photo
- Warning if leaving area with unsaved puzzle
- Celebration animation on puzzle completion

### Error Handling
- Graceful degradation if tracking fails
- Clear messages for user actions needed
- Auto-recovery from temporary tracking loss
- Prevent data loss from app crashes
- Validation before marking puzzle complete

### Performance Optimization
- Lazy loading of image previews
- Efficient memory management for multiple photos
- Background processing for non-critical tasks
- Progressive quality for real-time preview
- Batch operations for better performance

---

## Testing Checklist

### Functional Tests
- [ ] Can capture minimum number of photos
- [ ] Can capture maximum number of photos
- [ ] Transforms are accurate to real position
- [ ] Timestamps are sequential and correct
- [ ] Photos are stored with all metadata
- [ ] Puzzle is created successfully
- [ ] Data persists between sessions

### Edge Cases
- [ ] Tracking loss during capture
- [ ] Memory pressure with many photos
- [ ] Rapid capture attempts
- [ ] Leaving Custom Location mid-session
- [ ] App backgrounding during capture
- [ ] Storage full scenarios
- [ ] Network connectivity loss

### Performance Tests
- [ ] Capture responds within 100ms
- [ ] No frame drops during capture
- [ ] Memory usage stays within limits
- [ ] Storage writes don't block UI
- [ ] Can handle maximum photos smoothly

---

## Configuration Parameters

### Recommended Defaults
```
MAX_PHOTOS: 15
MIN_PHOTOS: 5
CAPTURE_DELAY_MS: 500
AUTO_SAVE_INTERVAL: 3
IMAGE_QUALITY: 0.8 (80% JPEG quality)
THUMBNAIL_SIZE: 128x128
MAX_PUZZLE_SIZE_MB: 50
TRACKING_CONFIDENCE_THRESHOLD: 0.7
```

### Adjustable Difficulty Settings
```
EASY_MODE:
  - MAX_PHOTOS: 5
  - CAPTURE_DELAY_MS: 1000
  - Show photo preview after each capture
  
NORMAL_MODE:
  - MAX_PHOTOS: 10
  - CAPTURE_DELAY_MS: 500
  - Show count only
  
HARD_MODE:
  - MAX_PHOTOS: 20
  - CAPTURE_DELAY_MS: 200
  - No preview, minimal UI
```

---

## Data Export Format

### JSON Structure for Puzzle
```
{
  "puzzleId": "uuid",
  "version": "1.0",
  "customLocation": "location_id",
  "photos": [
    {
      "id": "photo_uuid",
      "transform": {
        "position": [x, y, z],
        "rotation": [x, y, z, w],
        "euler": [pitch, yaw, roll]
      },
      "timestamp": 1234567890,
      "imageData": "base64_or_reference",
      "difficulty": 0.0-1.0
    }
  ],
  "metadata": {
    "createdAt": "ISO_timestamp",
    "deviceId": "device_uuid",
    "totalTime": 12345,
    "bounds": {
      "min": [x, y, z],
      "max": [x, y, z]
    }
  }
}
```

---

## Next Steps
After implementing Photo Capture:
1. Test thoroughly in actual Custom Location
2. Optimize performance based on device limits
3. Implement Phase 2: Seek/Find functionality
4. Add multiplayer puzzle sharing
5. Create difficulty analysis algorithm
6. Build leaderboard system

---

## Notes for Claude Code
- Focus on robust error handling for Spectacles-specific constraints
- Prioritize performance given device limitations
- Ensure all transforms are in Custom Location coordinate space
- Implement progressive degradation for tracking issues
- Consider battery impact of continuous capture
- Make UI accessible for hands-free interaction
- Test with various lighting conditions
- Implement data validation at every step
- Plan for offline functionality
- Consider privacy implications of location data
