# Photo Seek Implementation Guide for Snap Spectacles

## Hide & Seek Photos - Phase 2: Seek & Find

---

## Overview

This document provides implementation directions for building the Seek phase in Lens Studio for Snap Spectacles. Players must find where photos were taken within a Custom Location, matching both position and orientation for scoring.

---

## Prerequisites

- [ ] Photo Capture system (Phase 1) completed and tested
- [ ] Puzzle data structure implemented and accessible
- [ ] Custom Location tracking functional
- [ ] Understanding of spatial mathematics for position/rotation comparison

---

## Core Components to Implement

### 1. GameManager Script

**Purpose**: Orchestrates the entire Seek gameplay flow

**Required Properties**:

- `currentPuzzle`: PuzzleData object to solve
- `gameState`: Enum (LOADING, EXPLORING, SEEKING, COMPLETE, PAUSED)
- `explorationDuration`: Number (seconds, default: 45, configurable: 30-60)
- `photosToFind`: Array of PhotoData from puzzle
- `currentPhotoIndex`: Number (0 to n-1)
- `difficultyMode`: Enum (EASY, NORMAL, HARD)

**Required Methods**:

- `loadPuzzle(puzzleId)`: Load puzzle data and prepare game
- `startExploration()`: Begin exploration phase
- `startSeeking()`: Transition to photo finding phase
- `presentPhoto(index)`: Display photo to find
- `captureGuess()`: Record player's position/rotation guess
- `calculateScore()`: Compute accuracy and points
- `nextPhoto()`: Advance to next photo
- `endGame()`: Finalize scoring and show results
- `pauseGame()`: Handle interruptions
- `resumeGame()`: Continue from pause

**State Transitions**:

```
LOADING → EXPLORING → SEEKING → COMPLETE
         ↑__________|_(retry)
```

---

### 2. ExplorationPhaseController

**Purpose**: Manage the exploration phase where players study the space

**Required Properties**:

- `timer`: Countdown timer (45 → 0 seconds)
- `markedLocations`: Array of positions player finds interesting
- `heatmapData`: Track where player spends time
- `movementSpeed`: Track player movement patterns

**Required Methods**:

- `startExploration()`: Initialize timer and tracking
- `updateTimer()`: Countdown and display remaining time
- `allowMarking()`: Let player mark interesting spots
- `recordMovement()`: Track exploration patterns for analytics
- `showExplorationHints()`: Optional guided exploration
- `endExploration()`: Transition to seeking phase

**UI Elements**:

- Countdown timer (prominent, e.g., "EXPLORE: 45s")
- "Mark Location" button or gesture
- Mini-map showing explored areas (optional)
- Ready button to skip remaining time
- Tips carousel (e.g., "Look for unique features!")

**Visual Indicators**:

- Pulsing boundary of play area
- Breadcrumb trail of movement (optional)
- Marked locations as AR pins
- Countdown urgency (color change < 10s)

---

### 3. PhotoPresentationController

**Purpose**: Display photos and guide player to find them

**Required Properties**:

- `currentPhoto`: Active PhotoData object
- `displayMode`: Enum (FULL, CROPPED, SILHOUETTE)
- `hintLevel`: Number (0-3, increases over time)
- `photoTransparency`: Number (0.5-1.0 for AR overlay)

**Required Methods**:

- `showPhoto(photoData)`: Display photo to player
- `toggleViewMode()`: Switch between full/AR overlay
- `addHint()`: Progressive hint system
- `hidePhoto()`: Remove from view after guess
- `showPhotoInWorld()`: AR overlay at correct position (post-guess)

**Display Modes**:

- **Full View**: Entire photo visible
- **AR Overlay**: Semi-transparent in field of view
- **Corner Peek**: Small preview in corner
- **World-Locked**: Photo appears at its actual location (for feedback)

**Progressive Hints** (if player struggles):

1. No hint (0-15 seconds)
2. Warm/cold indicator (15-30 seconds)
3. Directional arrow (30-45 seconds)
4. Distance meter (45+ seconds)

---

### 4. PositionMatchingController

**Purpose**: Handle player positioning and guess capture

**Required Properties**:

- `playerTransform`: Current device position/rotation
- `targetTransform`: Correct photo position/rotation
- `guessTransform`: Player's submitted guess
- `positionTolerance`: Acceptable error margin (meters)
- `rotationTolerance`: Acceptable error margin (degrees)

**Required Methods**:

- `trackPlayerPosition()`: Continuous position monitoring
- `captureGuess()`: Lock in current position as guess
- `calculatePositionError()`: Distance between guess and target
- `calculateRotationError()`: Angular difference in orientation
- `isWithinTolerance()`: Check if guess is "close enough"
- `provideGuidance()`: Help player improve position

**Guidance Systems**:

- **Position Guidance**:

  - Ghost outline at correct position
  - Distance meter ("2.5m away")
  - Directional arrows in peripheral vision
  - Ground circle showing target area

- **Rotation Guidance**:
  - Rotation indicator (compass-style)
  - Alignment brackets that align when correct
  - Color gradient (red → green as improving)
  - Gyroscope visualization

**Capture Mechanisms**:

- Button press (physical or virtual)
- Dwell time (stay still for 2 seconds)
- Voice command ("Capture!")
- Gesture recognition (specific hand gesture)

---

### 5. ScoringSystem

**Purpose**: Calculate and track player performance

**Required Properties**:

- `totalTime`: Elapsed time for all photos
- `photoScores`: Array of individual photo scores
- `streakCounter`: Consecutive perfect matches
- `bonusMultiplier`: Current bonus level

**Scoring Formula**:

```
Photo Score = Base Points - (Position Error² + Rotation Error²) - Time Penalty
Total Score = Σ(Photo Scores) + Streak Bonuses + Speed Bonuses

Where:
- Base Points = 1000 per photo
- Position Error = meters from correct position
- Rotation Error = degrees from correct orientation / 10
- Time Penalty = seconds taken / 10
- Streak Bonus = 100 × streak count
- Speed Bonus = 500 if under par time
```

**Required Methods**:

- `calculatePhotoScore(guess, target, time)`: Score single photo
- `updateStreak(isSuccess)`: Track consecutive successes
- `calculateTotalScore()`: Final score with bonuses
- `generateScoreBreakdown()`: Detailed scoring explanation
- `compareToParScore()`: Show performance vs expected

**Score Categories**:

- **Perfect**: < 0.5m position, < 5° rotation
- **Excellent**: < 1m position, < 10° rotation
- **Good**: < 2m position, < 20° rotation
- **Fair**: < 3m position, < 30° rotation
- **Miss**: Beyond thresholds

---

### 6. FeedbackController

**Purpose**: Provide immediate feedback after each guess

**Required Properties**:

- `feedbackDuration`: Time to show feedback (default: 3 seconds)
- `feedbackDetail`: Level of information shown
- `comparisonMode`: Visual comparison style

**Required Methods**:

- `showImmediateFeedback(score)`: Quick score display
- `showDetailedFeedback(errors)`: Position/rotation errors
- `showVisualComparison()`: AR overlay of correct vs guess
- `celebrateSuccess()`: Perfect match effects
- `encourageOnMiss()`: Motivational feedback

**Feedback Types**:

**Immediate Feedback** (0.5 seconds):

- Score points animation
- Success/fail indicator
- Error measurements

**Visual Comparison** (2-3 seconds):

- Ghost image at correct position
- Line connecting guess to correct
- Split-screen comparison
- Rotation arc showing difference

**Detailed Breakdown** (optional):

- Position error: "1.2m too far left"
- Rotation error: "15° too far right"
- Time taken: "8 seconds"
- Points earned: "+650"

---

### 7. UIManager

**Purpose**: Handle all UI elements during gameplay

**Required UI Layouts**:

**Exploration Phase UI**:

```
┌─────────────────────────┐
│  EXPLORE: 45s           │  <- Countdown timer
│                         │
│  [Mark Spot]            │  <- Action button
│                         │
│  Tips: Look for corners │  <- Helpful hints
└─────────────────────────┘
```

**Seeking Phase UI**:

```
┌─────────────────────────┐
│ Photo 3/10   Time: 2:45 │  <- Progress
│ ┌─────────┐             │
│ │ [Photo] │             │  <- Photo to find
│ └─────────┘             │
│                         │
│ [CAPTURE GUESS]         │  <- Main action
│                         │
│ Streak: 2 🔥            │  <- Motivation
└─────────────────────────┘
```

**Feedback UI**:

```
┌─────────────────────────┐
│     EXCELLENT!          │
│     +850 points         │
│                         │
│ Position: 0.8m off ✓    │
│ Rotation: 12° off ✓     │
│                         │
│ [NEXT PHOTO →]          │
└─────────────────────────┘
```

---

## Implementation Flow

### Game Start Sequence

1. Player selects puzzle to solve
2. Load puzzle data and verify integrity
3. Sync to Custom Location
4. Display puzzle info (photo count, difficulty)
5. Show exploration phase instructions
6. Begin exploration countdown

### Exploration Phase Flow

1. Start countdown timer (45 seconds)
2. Enable free movement in space
3. Allow marking of notable locations
4. Track player movement patterns
5. Show countdown warnings (10s, 5s)
6. Auto-transition to seeking phase at 0s
7. (Optional) Allow early skip to seeking

### Seeking Phase Flow

```
For each photo in puzzle:
  1. Present photo to player
  2. Start photo timer
  3. Track player movement
  4. Wait for capture trigger
  5. Record guess transform
  6. Calculate errors
  7. Compute score
  8. Show feedback
  9. Wait for acknowledgment
  10. Load next photo or end game
```

### Game Completion Flow

1. Calculate final score
2. Show score breakdown
3. Display completion time
4. Compare to best scores
5. Award achievements
6. Save to leaderboard
7. Offer retry or new puzzle

---

## Difficulty Variations

### Easy Mode

- Full color, uncropped photos
- Longer exploration time (60s)
- Position tolerance: 2m
- Rotation tolerance: 30°
- Hints enabled after 10s
- AR overlay assistance available

### Normal Mode

- Full photos, some cropping
- Standard exploration (45s)
- Position tolerance: 1m
- Rotation tolerance: 15°
- Hints after 20s
- No AR overlay

### Hard Mode

- Heavily cropped photos
- Short exploration (30s)
- Position tolerance: 0.5m
- Rotation tolerance: 10°
- No hints
- Time pressure bonus

### Expert Mode

- Black & white photos
- No exploration phase
- Position tolerance: 0.25m
- Rotation tolerance: 5°
- Time limit per photo
- Negative scoring for errors

---

## Performance Optimizations

### Memory Management

- Load photos progressively (not all at once)
- Downscale photos for display (keep aspect ratio)
- Release photo memory after each guess
- Cache only next 2 photos
- Compress feedback recordings

### Tracking Optimization

- Reduce tracking frequency during non-critical moments
- Use predictive tracking for smooth movement
- Implement tracking confidence threshold
- Graceful degradation if tracking degrades

### Battery Optimization

- Dim display during thinking time
- Reduce particle effects on low battery
- Simplified rendering mode option
- Auto-pause on low battery warning

---

## Analytics to Track

### Player Behavior

- Exploration patterns (heatmap)
- Average time per photo
- Guess accuracy distribution
- Hint usage frequency
- Retry patterns
- Abandonment points

### Puzzle Difficulty

- Average completion time
- Success rate per photo
- Which photos are hardest
- Correlation of photo features to difficulty

### Performance Metrics

- Frame rate during gameplay
- Tracking loss incidents
- Load times
- Memory usage peaks
- Battery drain rate

---

## Error Handling

### Tracking Loss

- Pause game immediately
- Show "Tracking Lost" overlay
- Guide player to regain tracking
- Resume from exact same state
- Don't penalize time during loss

### Photo Loading Failure

- Skip corrupted photo
- Adjust scoring for fewer photos
- Log error for debugging
- Notify player of issue
- Continue with remaining photos

### Score Calculation Errors

- Fallback to simple scoring
- Save raw data for later calculation
- Allow manual score adjustment
- Prevent negative scores
- Cap maximum errors

---

## Testing Checklist

### Functional Tests

- [ ] All photos in puzzle load correctly
- [ ] Exploration timer works properly
- [ ] Each photo can be found and scored
- [ ] Scoring matches formula exactly
- [ ] Feedback displays accurately
- [ ] Game completes successfully

### Edge Cases

- [ ] Single photo puzzle
- [ ] Maximum photo puzzle (20+)
- [ ] Player leaves Custom Location
- [ ] Tracking loss during guess
- [ ] Rapid guess submissions
- [ ] Pause/resume during each phase
- [ ] Network loss during leaderboard sync

### User Experience Tests

- [ ] Instructions are clear
- [ ] Feedback is helpful
- [ ] Difficulty feels appropriate
- [ ] Progression is smooth
- [ ] UI is readable in AR
- [ ] Controls are responsive

---

## Configuration Parameters

### Timing Defaults

```
EXPLORATION_DURATION: 45
MIN_PHOTO_TIME: 5
MAX_PHOTO_TIME: 60
FEEDBACK_DURATION: 3
TRANSITION_DURATION: 1
HINT_DELAY: 15
```

### Scoring Defaults

```
BASE_POINTS: 1000
POSITION_ERROR_WEIGHT: 100
ROTATION_ERROR_WEIGHT: 10
TIME_PENALTY_WEIGHT: 5
STREAK_BONUS: 100
PERFECT_BONUS: 500
SPEED_BONUS: 250
```

### Tolerance Defaults

```
POSITION_TOLERANCE_EASY: 2.0
POSITION_TOLERANCE_NORMAL: 1.0
POSITION_TOLERANCE_HARD: 0.5
ROTATION_TOLERANCE_EASY: 30
ROTATION_TOLERANCE_NORMAL: 15
ROTATION_TOLERANCE_HARD: 10
```

---

## Next Steps

After implementing Seek phase:

1. Integrate with Photo Capture system
2. Implement leaderboard system
3. Add multiplayer challenges
4. Create achievement system
5. Build puzzle sharing mechanism
6. Add replay/spectator mode
7. Implement tournament system

---

## Notes for Claude Code

- Prioritize responsive controls for time-pressure gameplay
- Ensure feedback is immediate and clear
- Make scoring transparent to build trust
- Consider accessibility for different play styles
- Test with various puzzle difficulties
- Implement smooth transitions between states
- Cache frequently used calculations
- Validate all spatial math carefully
- Handle Custom Location boundaries properly
- Consider spectator experience for multiplayer
