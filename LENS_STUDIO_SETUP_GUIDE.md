# Lens Studio Setup Guide: Hide & Seek Photos

## Complete Integration Guide for Photo Capture and Photo Seek Systems

---

## Table of Contents

1. [Project Structure Overview](#project-structure-overview)
2. [Phase 1: Photo Capture Setup](#phase-1-photo-capture-setup)
3. [Phase 2: Photo Seek Setup](#phase-2-photo-seek-setup)
4. [Scene Hierarchy Setup](#scene-hierarchy-setup)
5. [Component Connections](#component-connections)
6. [UI Element Setup](#ui-element-setup)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Project Structure Overview

### Scripts Created

**Phase 1 - Photo Capture:**

- `PhotoData.ts` - Data structure for individual photos
- `PuzzleData.ts` - Data structure for puzzle collections
- `PhotoCaptureManager.ts` - Main capture controller
- `CustomLocationSync.ts` - Location tracking monitor
- `CaptureButtonHandler.ts` - Button interaction handler
- `PhotoCaptureUI.ts` - Capture phase UI controller
- `PhotoStorageManager.ts` - Data persistence handler

**Phase 2 - Photo Seek:**

- `GameManager.ts` - Main game orchestrator
- `ExplorationPhaseController.ts` - Exploration phase handler
- `PhotoPresentationController.ts` - Photo display controller
- `PositionMatchingController.ts` - Position/rotation matching
- `ScoringSystem.ts` - Score calculation system
- `FeedbackController.ts` - Feedback display controller
- `SeekUIManager.ts` - Seek phase UI controller

---

## Phase 1: Photo Capture Setup

### Scene Object Hierarchy for Capture Mode

```
[Root]
├── Custom Location
│   └── DeviceLocationTrackingComponent (component)
├── CaptureSystem (Empty Scene Object)
│   ├── PhotoCaptureManager (script component)
│   ├── CustomLocationSync (script component)
│   └── PhotoStorageManager (script component)
├── CaptureUI (Canvas or Screen Transform)
│   ├── PhotoCaptureUI (script component)
│   ├── CounterText (Text component)
│   ├── StatusText (Text component)
│   ├── ProgressBar (Image/Mesh)
│   ├── SyncIndicator (Mesh + Material)
│   └── CaptureButton (Scene Object)
│       ├── Interactable (SpectaclesInteractionKit component)
│       ├── CaptureButtonHandler (script component)
│       └── Visual (Mesh/Image)
└── Camera
    └── Camera (component)
```

### Step-by-Step: Photo Capture Integration

#### 1. Custom Location Setup

1. **Import Custom Location Asset:**

   - Add your Custom Location asset to the project
   - Note the Custom Location ID

2. **Add DeviceLocationTrackingComponent:**
   - Create a Scene Object called "Custom Location"
   - Add Component → Custom → `DeviceLocationTrackingComponent`
   - Assign your Location Asset

#### 2. CustomLocationSync Setup

1. **Create CaptureSystem Parent:**
   - Add Scene Object → Name: "CaptureSystem"
2. **Add CustomLocationSync Script:**
   - Add Script Component to CaptureSystem
   - Select `CustomLocationSync.ts`
3. **Configure Inspector Properties:**
   - **Custom Location**: Drag the LocationAsset from Resources
   - **Min Confidence**: 0.7 (default)
   - **Debug Mode**: ✓ (check for testing)

#### 3. PhotoStorageManager Setup

1. **Add PhotoStorageManager Script:**
   - Add Script Component to CaptureSystem
   - Select `PhotoStorageManager.ts`
2. **Configure Inspector Properties:**
   - **Max Storage MB**: 50
   - **Auto Cleanup Enabled**: ✓
   - **Debug Mode**: ✓

#### 4. PhotoCaptureManager Setup

1. **Add PhotoCaptureManager Script:**

   - Add Script Component to CaptureSystem
   - Select `PhotoCaptureManager.ts`

2. **Configure Inspector Properties:**
   - **Max Photos**: 15
   - **Min Photos**: 5
   - **Capture Delay**: 0.5
   - **Auto Save Interval**: 3
   - **Location Sync**: Drag CustomLocationSync from CaptureSystem
   - **Storage Manager**: Drag PhotoStorageManager from CaptureSystem
   - **Camera**: Drag Camera from scene
   - **Custom Location Id**: Enter your location ID string
   - **Debug Mode**: ✓

#### 5. Capture UI Setup

1. **Create UI Canvas:**

   - Add Scene Object → Name: "CaptureUI"
   - Add Component → Screen Transform (or Canvas)

2. **Add PhotoCaptureUI Script:**

   - Add Script Component to CaptureUI
   - Select `PhotoCaptureUI.ts`

3. **Create UI Elements:**

   **Counter Text:**

   - Add → Text → Name: "CounterText"
   - Parent to CaptureUI
   - Set position (top center recommended)
   - Default text: "0/15 photos"

   **Status Text:**

   - Add → Text → Name: "StatusText"
   - Parent to CaptureUI
   - Set position (below counter)
   - Default text: "Ready to capture"

   **Progress Bar:**

   - Add → Image → Name: "ProgressBar"
   - Parent to CaptureUI
   - Set as horizontal bar
   - Anchor to bottom

   **Sync Indicator:**

   - Add → Mesh (Sphere or custom) → Name: "SyncIndicator"
   - Parent to CaptureUI
   - Add Material with PBR shader
   - Scale small (indicator light)

4. **Configure PhotoCaptureUI Properties:**
   - **Capture Manager**: Drag PhotoCaptureManager from CaptureSystem
   - **Location Sync**: Drag CustomLocationSync from CaptureSystem
   - **Counter Text**: Drag CounterText
   - **Status Text**: Drag StatusText
   - **Progress Bar**: Drag ProgressBar scene object
   - **Sync Indicator**: Drag SyncIndicator scene object
   - **Status Material**: Drag material from SyncIndicator
   - **Enable Haptics**: ✓
   - **Debug Mode**: ✓

#### 6. Capture Button Setup

1. **Create Button Object:**

   - Add Scene Object → Name: "CaptureButton"
   - Parent to CaptureUI
   - Position in comfortable reach zone

2. **Add Visual:**

   - Add child Mesh or Image for button visual
   - Style as needed (circle/icon)

3. **Add Interactable Component:**

   - Add Component → Spectacles Interaction Kit → `Interactable`
   - Configure interaction settings

4. **Add CaptureButtonHandler Script:**

   - Add Script Component to CaptureButton
   - Select `CaptureButtonHandler.ts`

5. **Configure CaptureButtonHandler Properties:**
   - **Capture Manager**: Drag PhotoCaptureManager from CaptureSystem
   - **Interactable**: Drag Interactable component from same object
   - **Enable Haptics**: ✓
   - **Debug Mode**: ✓

---

## Phase 2: Photo Seek Setup

### Scene Object Hierarchy for Seek Mode

```
[Root]
├── Custom Location
│   └── DeviceLocationTrackingComponent
├── GameSystem (Empty Scene Object)
│   ├── GameManager (script component)
│   ├── CustomLocationSync (script component)
│   ├── PhotoStorageManager (script component)
│   ├── ExplorationPhaseController (script component)
│   ├── PhotoPresentationController (script component)
│   ├── PositionMatchingController (script component)
│   ├── ScoringSystem (script component)
│   └── FeedbackController (script component)
├── SeekUI (Canvas)
│   ├── SeekUIManager (script component)
│   ├── ProgressText (Text)
│   ├── TimerText (Text)
│   ├── ScoreDisplay (Text)
│   ├── StreakText (Text)
│   ├── StatusText (Text)
│   ├── SyncIndicator (Mesh)
│   ├── ActionButton (Interactable)
│   ├── PauseButton (Interactable)
│   └── CompletionPanel (Scene Object)
│       ├── FinalScoreText (Text)
│       └── ResultsText (Text)
├── ExplorationUI (Canvas)
│   ├── TimerText (Text)
│   ├── MarkButton (Interactable)
│   ├── TipsText (Text)
│   └── ReadyButton (Interactable)
├── PhotoDisplay (Scene Object)
│   ├── PhotoImage (Image component)
│   ├── AROverlay (Scene Object + Image)
│   ├── CornerPreview (Scene Object + Image)
│   └── HintText (Text)
├── PositionGuidance (Scene Object)
│   ├── GhostOutline (Mesh with transparent material)
│   ├── DistanceText (Text)
│   ├── RotationIndicator (Mesh)
│   └── TargetCircle (Mesh on ground plane)
└── FeedbackDisplay (Scene Object)
    ├── FeedbackPanel (Canvas)
    │   ├── ScoreText (Text)
    │   ├── CategoryText (Text)
    │   ├── PositionErrorText (Text)
    │   ├── RotationErrorText (Text)
    │   └── TimeText (Text)
    ├── CorrectPositionGhost (Mesh)
    ├── ConnectionLine (Mesh)
    └── PerfectEffect (VFX/Particle System)
```

### Step-by-Step: Photo Seek Integration

#### 1. GameManager Setup

1. **Create GameSystem Parent:**

   - Add Scene Object → Name: "GameSystem"

2. **Add GameManager Script:**

   - Add Script Component to GameSystem
   - Select `GameManager.ts`

3. **Configure Inspector Properties:**
   - **Exploration Duration**: 45
   - **Difficulty Mode**: Normal (1)
   - **Location Sync**: Drag CustomLocationSync
   - **Storage Manager**: Drag PhotoStorageManager
   - **Debug Mode**: ✓

#### 2. ExplorationPhaseController Setup

1. **Add ExplorationPhaseController Script:**

   - Add Script Component to GameSystem
   - Select `ExplorationPhaseController.ts`

2. **Create Exploration UI:**

   - Add Scene Object → "ExplorationUI" → Screen Transform
   - Add Text components: TimerText, TipsText
   - Add Interactable buttons: MarkButton, ReadyButton

3. **Configure Properties:**

   - **Timer Text**: Drag from ExplorationUI
   - **Mark Button**: Drag MarkButton scene object
   - **Tips Text**: Drag TipsText
   - **Ready Button**: Drag ReadyButton
   - **Debug Mode**: ✓

4. **Link to GameManager:**
   - In GameManager Inspector:
   - **Exploration Controller**: Drag ExplorationPhaseController

#### 3. PhotoPresentationController Setup

1. **Create PhotoDisplay Parent:**

   - Add Scene Object → "PhotoDisplay"
   - Position in player's view

2. **Create Display Elements:**

   **Full Display Image:**

   - Add Image component → Name: "PhotoImage"
   - Parent to PhotoDisplay
   - Size appropriately

   **AR Overlay:**

   - Add Scene Object → "AROverlay"
   - Add Image component
   - Set semi-transparent

   **Corner Preview:**

   - Add Scene Object → "CornerPreview"
   - Add Image component
   - Position in corner
   - Scale smaller

   **Hint Text:**

   - Add Text → "HintText"
   - Parent to PhotoDisplay

3. **Add PhotoPresentationController Script:**

   - Add Script Component to PhotoDisplay
   - Select `PhotoPresentationController.ts`

4. **Configure Properties:**

   - **Photo Image**: Drag PhotoImage
   - **AR Overlay**: Drag AROverlay scene object
   - **Corner Preview**: Drag CornerPreview scene object
   - **Hint Text**: Drag HintText
   - **Photo Transparency**: 0.6
   - **Enable Hints**: ✓
   - **Debug Mode**: ✓

5. **Link to GameManager:**
   - In GameManager Inspector:
   - **Photo Presentation Controller**: Drag PhotoPresentationController

#### 4. PositionMatchingController Setup

1. **Create PositionGuidance Parent:**

   - Add Scene Object → "PositionGuidance"

2. **Create Guidance Elements:**

   **Ghost Outline:**

   - Add Mesh (human silhouette or camera icon)
   - Name: "GhostOutline"
   - Add transparent/ghost material
   - Parent to PositionGuidance

   **Distance Text:**

   - Add Text → "DistanceText"
   - Parent to PositionGuidance
   - World-locked positioning

   **Rotation Indicator:**

   - Add Mesh (arrow or compass)
   - Name: "RotationIndicator"
   - Add colored material
   - Parent to PositionGuidance

   **Target Circle:**

   - Add Mesh (torus or circle)
   - Name: "TargetCircle"
   - Scale to indicate target area
   - Parent to PositionGuidance

3. **Add PositionMatchingController Script:**

   - Add Script Component to PositionGuidance
   - Select `PositionMatchingController.ts`

4. **Configure Properties:**

   - **Device Tracking**: Find and drag DeviceTracking component
   - **Position Tolerance**: 1.0 (will be set by GameManager)
   - **Rotation Tolerance**: 15.0 (will be set by GameManager)
   - **Ghost Outline**: Drag GhostOutline
   - **Distance Text**: Drag DistanceText
   - **Rotation Indicator**: Drag RotationIndicator
   - **Target Circle**: Drag TargetCircle
   - **Debug Mode**: ✓

5. **Link to GameManager:**
   - In GameManager Inspector:
   - **Position Matching Controller**: Drag PositionMatchingController

#### 5. ScoringSystem Setup

1. **Add ScoringSystem Script:**

   - Add Script Component to GameSystem
   - Select `ScoringSystem.ts`

2. **Configure Properties (use defaults or customize):**

   - **Base Points**: 1000
   - **Position Error Weight**: 100
   - **Rotation Error Weight**: 10
   - **Time Penalty Weight**: 5
   - **Streak Bonus**: 100
   - **Perfect Bonus**: 500
   - **Speed Bonus**: 250
   - **Debug Mode**: ✓

3. **Link to GameManager:**
   - In GameManager Inspector:
   - **Scoring System**: Drag ScoringSystem

#### 6. FeedbackController Setup

1. **Create FeedbackDisplay Parent:**

   - Add Scene Object → "FeedbackDisplay"

2. **Create Feedback Panel:**

   - Add Scene Object → "FeedbackPanel"
   - Add Screen Transform or Canvas
   - Parent to FeedbackDisplay

3. **Add Text Elements to Panel:**

   - ScoreText - Large, prominent
   - CategoryText - Bold, colored
   - PositionErrorText - Detail line
   - RotationErrorText - Detail line
   - TimeText - Detail line

4. **Create Visual Feedback Elements:**

   **Correct Position Ghost:**

   - Add Mesh → "CorrectPositionGhost"
   - Transparent material
   - Parent to FeedbackDisplay

   **Connection Line:**

   - Add Mesh (cylinder) → "ConnectionLine"
   - Thin, colored material
   - Parent to FeedbackDisplay

   **Perfect Effect:**

   - Add VFX Component or Particle System
   - Name: "PerfectEffect"
   - Configure celebration particles
   - Parent to FeedbackDisplay

5. **Add FeedbackController Script:**

   - Add Script Component to FeedbackDisplay
   - Select `FeedbackController.ts`

6. **Configure Properties:**

   - **Feedback Duration**: 3
   - **Score Text**: Drag ScoreText
   - **Category Text**: Drag CategoryText
   - **Position Error Text**: Drag PositionErrorText
   - **Rotation Error Text**: Drag RotationErrorText
   - **Time Text**: Drag TimeText
   - **Correct Position Ghost**: Drag ghost object
   - **Connection Line**: Drag line object
   - **Perfect Effect**: Drag particle system
   - **Feedback Panel**: Drag FeedbackPanel
   - **Debug Mode**: ✓

7. **Link to GameManager:**
   - In GameManager Inspector:
   - **Feedback Controller**: Drag FeedbackController

#### 7. SeekUIManager Setup

1. **Create SeekUI Canvas:**

   - Add Scene Object → "SeekUI"
   - Add Screen Transform or Canvas component

2. **Create UI Text Elements:**

   - ProgressText → "Photo 1/10"
   - TimerText → "Time: 0:00"
   - ScoreDisplay → "Score: 0"
   - StreakText → "Streak: 0"
   - StatusText → "Find the photo!"

3. **Create UI Buttons:**

   - ActionButton (Capture Guess)
   - NextButton (hidden by default)
   - PauseButton

   For each button:

   - Add Scene Object
   - Add Interactable component
   - Add visual representation
   - Configure interactions

4. **Create Sync Indicator:**

   - Add Mesh (sphere/circle)
   - Add material
   - Parent to SeekUI

5. **Create Completion Panel:**

   - Add Scene Object → "CompletionPanel"
   - Initially disabled
   - Add FinalScoreText
   - Add ResultsText (for breakdown)

6. **Add SeekUIManager Script:**

   - Add Script Component to SeekUI
   - Select `SeekUIManager.ts`

7. **Configure Properties:**
   - **Game Manager**: Drag GameManager from GameSystem
   - **Scoring System**: Drag ScoringSystem from GameSystem
   - **Location Sync**: Drag CustomLocationSync from GameSystem
   - **Progress Text**: Drag ProgressText
   - **Timer Text**: Drag TimerText
   - **Score Display**: Drag ScoreDisplay
   - **Streak Text**: Drag StreakText
   - **Status Text**: Drag StatusText
   - **Sync Indicator**: Drag indicator object
   - **Action Button**: Drag ActionButton
   - **Next Button**: Drag NextButton
   - **Pause Button**: Drag PauseButton
   - **Completion Panel**: Drag CompletionPanel
   - **Final Score Text**: Drag FinalScoreText
   - **Debug Mode**: ✓

---

## Scene Hierarchy Setup

### Recommended Layer Organization

1. **System Layer** (Bottom)

   - CaptureSystem/GameSystem
   - Location tracking components

2. **Gameplay Layer**

   - Photo display
   - Position guidance
   - Feedback display

3. **UI Layer** (Top)
   - All UI canvases
   - Text elements
   - Buttons

### Scene Object Naming Conventions

Use clear, descriptive names:

- `[System]` prefix for core systems
- `[UI]` prefix for user interface
- `[Gameplay]` prefix for game mechanics
- `[Visual]` prefix for visual effects

Example: `[System]GameManager`, `[UI]CaptureButton`, `[Gameplay]GhostOutline`

---

## Component Connections

### Critical Connection Checklist

**GameManager must connect to:**

- ✓ CustomLocationSync
- ✓ ExplorationPhaseController
- ✓ PhotoPresentationController
- ✓ PositionMatchingController
- ✓ ScoringSystem
- ✓ FeedbackController
- ✓ PhotoStorageManager

**PhotoCaptureManager must connect to:**

- ✓ CustomLocationSync
- ✓ PhotoStorageManager
- ✓ Camera
- ✓ Custom Location ID (string)

**All UI Managers must connect to:**

- ✓ Their respective controllers
- ✓ All UI elements they control
- ✓ Any visual indicators

### Event Flow Diagram

```
GameManager
    ↓
ExplorationPhaseController
    ↓ (onExplorationComplete)
GameManager.startSeeking()
    ↓
PhotoPresentationController.showPhoto()
    ↓
PositionMatchingController.startTracking()
    ↓ (user captures guess)
PositionMatchingController.onGuessCaptured
    ↓
GameManager.processGuess()
    ↓
ScoringSystem.calculatePhotoScore()
    ↓
FeedbackController.showFeedback()
    ↓ (onFeedbackComplete)
GameManager.nextPhoto() or endGame()
```

---

## UI Element Setup

### Text Styling Recommendations

**Counter/Progress Text:**

- Font Size: 24-32
- Position: Top center
- Color: White with dark outline
- Always visible

**Timer:**

- Font Size: 20-24
- Position: Top right
- Color: White (changes to red when urgent)

**Score Display:**

- Font Size: 28-36
- Position: Top left
- Color: Gold/Yellow
- Bold weight

**Status Messages:**

- Font Size: 18-22
- Position: Center or bottom
- Color: Context-dependent
- Semi-transparent background

**Feedback Score:**

- Font Size: 48-60
- Position: Center
- Color: Category-based
- Animated entrance

### Button Design

All interactive buttons should have:

1. **Interactable component** from Spectacles Interaction Kit
2. **Visual feedback** on hover/press
3. **Clear affordance** (looks clickable)
4. **Appropriate size** for hand interaction
5. **Haptic feedback** when pressed

### Material Setup

**Ghost Materials:**

- Base Color: White with 50% transparency
- Emission: Slight glow
- Render Queue: Transparent

**Indicator Materials:**

- Base Color: Status-dependent (Red/Yellow/Green)
- Emission: High for visibility
- Metallic: 0, Roughness: 0.5

**Connection Line:**

- Base Color: Cyan or Yellow
- Emission: Medium
- Width: 0.01-0.02 units

---

## Testing Checklist

### Phase 1: Photo Capture Testing

- [ ] Custom Location syncs successfully
- [ ] Sync indicator shows correct status colors
- [ ] Capture button responds to interaction
- [ ] Photos are captured when tracking is good
- [ ] Capture blocked when tracking is poor
- [ ] Counter updates after each photo
- [ ] Progress bar fills correctly
- [ ] Auto-save triggers every N photos
- [ ] Puzzle finalizes at max photos
- [ ] Data persists between sessions

### Phase 2: Photo Seek Testing

**Exploration Phase:**

- [ ] Timer counts down correctly
- [ ] Marked locations are tracked
- [ ] Ready button skips to seeking
- [ ] Auto-transition at 0 seconds

**Seeking Phase:**

- [ ] Photo displays correctly
- [ ] Position guidance shows distance
- [ ] Ghost appears at correct position
- [ ] Rotation indicator works
- [ ] Hints appear progressively
- [ ] Guess capture works
- [ ] Score calculated correctly
- [ ] Feedback displays accurately

**Game Flow:**

- [ ] All photos cycle through
- [ ] Streak tracking works
- [ ] Final score calculation correct
- [ ] Completion panel shows
- [ ] Can restart new game

### Performance Testing

- [ ] Frame rate stable (60+ FPS)
- [ ] No memory leaks
- [ ] UI responsive
- [ ] Tracking doesn't degrade
- [ ] Battery drain acceptable

---

## Troubleshooting

### Common Issues and Solutions

#### "Custom Location not syncing"

**Problem:** Sync indicator stays red, photos can't be captured

**Solutions:**

1. Verify Custom Location asset is imported
2. Check DeviceLocationTrackingComponent has correct LocationAsset assigned
3. Ensure you're physically in the mapped Custom Location
4. Try re-localizing by looking at distinctive features
5. Check CustomLocationSync.minConfidence (lower if needed)

#### "Button doesn't respond"

**Problem:** CaptureButton or ActionButton not triggering

**Solutions:**

1. Verify Interactable component is added
2. Check Interactable is enabled in hierarchy
3. Ensure SpectaclesInteractionKit package is imported
4. Verify CaptureButtonHandler script has Interactable reference
5. Check script is using `onTriggerEnd` not `onTap`

#### "Photos not saving"

**Problem:** Data doesn't persist between sessions

**Solutions:**

1. Verify PhotoStorageManager is assigned in PhotoCaptureManager
2. Check debug logs for storage errors
3. Ensure device has sufficient storage space
4. Verify savePuzzle() is being called
5. Check file permissions if applicable

#### "UI elements not visible"

**Problem:** Text or UI components don't show

**Solutions:**

1. Check UI layer is in front of other layers
2. Verify Screen Transform is configured correctly
3. Ensure text has appropriate size and color
4. Check component.enabled = true
5. Verify parent scene objects are enabled

#### "Scoring seems wrong"

**Problem:** Scores don't match expected values

**Solutions:**

1. Check ScoringSystem weights in Inspector
2. Verify position/rotation error calculations
3. Enable debug mode to see score breakdown
4. Test with known positions (teleport to exact target)
5. Check for formula errors in ScoringSystem.ts

#### "Game state stuck"

**Problem:** Game doesn't transition between phases

**Solutions:**

1. Check event handlers are properly connected
2. Verify onExplorationComplete fires
3. Ensure GameManager has all controller references
4. Check for exceptions in console
5. Verify state transition logic in GameManager

#### "Tracking guidance not showing"

**Problem:** Ghost, distance text, or indicators missing

**Solutions:**

1. Verify PositionMatchingController has all references
2. Check scene objects are enabled
3. Ensure materials are visible (not fully transparent)
4. Verify startTracking() is being called
5. Check object positions (might be off-screen)

### Debug Mode Usage

Enable **Debug Mode** in all components during development:

- Prints detailed logs to console
- Shows state transitions
- Displays calculation values
- Helps identify where failures occur

**To enable:**

- Check "Debug Mode" in Inspector for each script
- Watch Console for log messages
- Look for error patterns

### Performance Optimization Tips

If experiencing performance issues:

1. **Reduce resolution** of photo textures
2. **Limit particle effects** in feedback
3. **Simplify ghost outline** meshes
4. **Reduce update frequency** in some controllers
5. **Batch UI updates** instead of per-frame
6. **Disable unused visual effects**
7. **Profile with Lens Studio tools**

---

## Quick Start Steps

### Minimum Viable Setup (Capture Only)

1. Import Custom Location asset
2. Add DeviceLocationTrackingComponent
3. Create CaptureSystem with:
   - CustomLocationSync
   - PhotoStorageManager
   - PhotoCaptureManager
4. Create simple UI with counter and button
5. Connect PhotoCaptureManager to all required refs
6. Test capture flow

### Minimum Viable Setup (Seek Only)

1. Use saved puzzle from Phase 1
2. Create GameSystem with:
   - GameManager
   - ScoringSystem
   - All controllers
3. Create basic SeekUI with:
   - Photo display
   - Action button
   - Score text
4. Connect GameManager to all controllers
5. Test game flow

---

## Additional Resources

### Spectacles Documentation

- Spectacles Interaction Kit: [Link to official docs]
- Custom Location Tracking: [Link to official docs]
- Device Tracking API: [Link to official docs]

### Lens Studio Tutorials

- Working with Screen Transform
- Creating Interactive Buttons
- Material and Shader Setup
- Performance Optimization

---

## Version History

- **v1.0** - Initial implementation with Phase 1 & 2
- Future: Add multiplayer support, leaderboards, shared puzzles

---

## Support

For issues or questions:

1. Check Troubleshooting section above
2. Enable Debug Mode and check console
3. Review official Spectacles documentation
4. Test each component individually before integration

---

**Note:** This guide assumes familiarity with Lens Studio basics. For complete beginners, start with official Lens Studio tutorials before attempting this integration.

**Important:** Always test in the actual Custom Location on real Spectacles hardware. Simulation may not accurately represent tracking behavior.
