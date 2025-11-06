# Hide & Seek Photos - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         HIDE & SEEK PHOTOS                       │
│                     AR Game for Snap Spectacles                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│   PHASE 1: HIDE      │          │   PHASE 2: SEEK      │
│   (Photo Capture)    │──Data──> │   (Photo Finding)    │
└──────────────────────┘          └──────────────────────┘
```

---

## Phase 1: Photo Capture Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPTURE SYSTEM LAYER                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          PhotoCaptureManager (Hub)                    │  │
│  │  - Orchestrates capture flow                          │  │
│  │  - Validates tracking                                 │  │
│  │  - Creates PhotoData objects                          │  │
│  │  - Manages puzzle creation                            │  │
│  └──────────────────────────────────────────────────────┘  │
│           │              │              │                    │
│           ↓              ↓              ↓                    │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐         │
│  │CustomLoc.   │ │PhotoStorage │ │PhotoCaptureUI│         │
│  │Sync         │ │Manager      │ │              │         │
│  │- Monitors   │ │- Saves data │ │- Shows UI    │         │
│  │  tracking   │ │- Loads data │ │- Updates     │         │
│  │- Validates  │ │- Manages    │ │  counters    │         │
│  │  sync       │ │  storage    │ │- Feedback    │         │
│  └─────────────┘ └─────────────┘ └──────────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐    │
│  │ Counter Text │ │ Status Text  │ │  Capture Button │    │
│  │  "3/15"      │ │ "Ready!"     │ │  [📷 Capture]   │    │
│  └──────────────┘ └──────────────┘ └─────────────────┘    │
│                                                              │
│  ┌──────────────────────┐ ┌────────────────────┐           │
│  │   Progress Bar       │ │  Sync Indicator    │           │
│  │  ████████░░░░░░░     │ │     ●  (green)     │           │
│  └──────────────────────┘ └────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA STORAGE LAYER                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              PuzzleData                             │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  PhotoData[]  (Array of photos)              │  │    │
│  │  │  ┌─────────────────────────────────────────┐ │  │    │
│  │  │  │ PhotoData                               │ │  │    │
│  │  │  │ - id: string                            │ │  │    │
│  │  │  │ - imageData: Texture                    │ │  │    │
│  │  │  │ - transform:                            │ │  │    │
│  │  │  │   • position: vec3                      │ │  │    │
│  │  │  │   • rotation: quat                      │ │  │    │
│  │  │  │   • eulerAngles: vec3                   │ │  │    │
│  │  │  │ - timestamp: number                     │ │  │    │
│  │  │  │ - metadata: {...}                       │ │  │    │
│  │  │  └─────────────────────────────────────────┘ │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Photo Seek Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      GAME MANAGEMENT LAYER                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    GameManager (Hub)                        │ │
│  │  - State machine (Loading → Exploring → Seeking → Complete)│ │
│  │  - Event orchestration                                      │ │
│  │  - Flow control                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│         │         │         │         │         │         │      │
└─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┘
          ↓         ↓         ↓         ↓         ↓         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                             │
│                                                                  │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│ │Exploration   │ │Photo         │ │Position      │            │
│ │Phase         │ │Presentation  │ │Matching      │            │
│ │Controller    │ │Controller    │ │Controller    │            │
│ │              │ │              │ │              │            │
│ │- Timer       │ │- Show photo  │ │- Track pos   │            │
│ │- Marking     │ │- Hints       │ │- Ghost guide │            │
│ │- Ready check │ │- Display     │ │- Capture     │            │
│ │              │ │  modes       │ │  guess       │            │
│ └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│ │Scoring       │ │Feedback      │ │SeekUI        │            │
│ │System        │ │Controller    │ │Manager       │            │
│ │              │ │              │ │              │            │
│ │- Calculate   │ │- Show score  │ │- Progress    │            │
│ │  scores      │ │- Visual      │ │- Timer       │            │
│ │- Streaks     │ │  comparison  │ │- Score       │            │
│ │- Bonuses     │ │- Celebrate   │ │- Status      │            │
│ └──────────────┘ └──────────────┘ └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
          ↓              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
│                                                                  │
│  EXPLORATION UI         │  SEEKING UI          │  FEEDBACK UI   │
│  ┌────────────────┐     │  ┌────────────┐     │  ┌──────────┐  │
│  │EXPLORE: 45s    │     │  │Photo 3/10  │     │  │EXCELLENT!│  │
│  │                │     │  │            │     │  │+850 pts  │  │
│  │[Mark Location] │     │  │ [Photo]    │     │  │          │  │
│  │                │     │  │            │     │  │Pos: 0.8m │  │
│  │Tips: Look for  │     │  │[Capture]   │     │  │Rot: 12°  │  │
│  │   corners      │     │  │            │     │  │          │  │
│  │                │     │  │Streak: 2🔥 │     │  │[Next →]  │  │
│  │[Ready →]       │     │  │Score: 2450 │     │  └──────────┘  │
│  └────────────────┘     │  └────────────┘     │                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     EVENT FLOW                              │
└─────────────────────────────────────────────────────────────┘

User Trigger
     │
     ↓
┌────────────────┐
│  Button Press  │
└────────────────┘
     │
     ↓
┌────────────────────┐
│  CaptureButton     │     OR      ┌──────────────────┐
│  Handler           │────────────>│  Interactable    │
│  .onTriggerEnd()   │             │  .onTriggerEnd() │
└────────────────────┘             └──────────────────┘
     │                                      │
     ↓                                      ↓
┌─────────────────────────────────────────────────┐
│               PhotoCaptureManager               │
│                      OR                         │
│            PositionMatchingController           │
└─────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────┐
│            Business Logic Execution             │
│  - Validation                                   │
│  - Data Processing                              │
│  - State Updates                                │
└─────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────┐
│              Event Callbacks                    │
│  - onPhotoCapture()                             │
│  - onGuessCaptured()                            │
│  - onScoreCalculated()                          │
└─────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────┐
│               UI Updates                        │
│  - Update text                                  │
│  - Update visuals                               │
│  - Show feedback                                │
└─────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────┐
│            Visual Feedback                      │
│  - Animations                                   │
│  - Particles                                    │
│  - Haptics                                      │
└─────────────────────────────────────────────────┘
```

---

## State Machine: Game Flow

```
┌──────────────────────────────────────────────────────────┐
│                   GAME STATE MACHINE                      │
└──────────────────────────────────────────────────────────┘

    ┌──────────┐
    │ LOADING  │ (Initial state)
    └─────┬────┘
          │ loadPuzzle()
          │ startExploration()
          ↓
    ┌──────────┐
    │EXPLORING │ (45 second timer)
    └─────┬────┘
          │ timer expires OR
          │ ready button pressed
          ↓
    ┌──────────┐
    │ SEEKING  │ (Main gameplay)
    └─────┬────┘
          │ For each photo:
          │  1. Present photo
          │  2. Track position
          │  3. Capture guess
          │  4. Calculate score
          │  5. Show feedback
          │  6. Next photo
          ↓
    ┌──────────┐
    │ COMPLETE │ (Show results)
    └──────────┘
          │
          │ [Retry]
          └────────> Back to LOADING

    ┌──────────┐
    │  PAUSED  │ (Can pause from any state)
    └──────────┘
          │
          │ [Resume]
          └────────> Return to previous state
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     DATA FLOW                             │
└──────────────────────────────────────────────────────────┘

PHASE 1: CAPTURE
┌──────────┐
│  Camera  │
└────┬─────┘
     │ RGB Image
     ↓
┌─────────────────┐
│ Device Transform│ (Position + Rotation)
└────┬────────────┘
     │
     ↓
┌──────────────────┐         ┌──────────────┐
│   PhotoData      │────────>│  PuzzleData  │
│   - Image        │         │  - Photos[]  │
│   - Transform    │ (Add)   │  - Metadata  │
│   - Metadata     │         │  - Bounds    │
└──────────────────┘         └──────┬───────┘
                                    │
                                    ↓
                             ┌──────────────┐
                             │   Storage    │
                             │  (JSON/File) │
                             └──────────────┘

PHASE 2: SEEK
┌──────────────┐
│   Storage    │
└──────┬───────┘
       │ Load
       ↓
┌──────────────┐         ┌──────────────────┐
│  PuzzleData  │────────>│   GameManager    │
└──────────────┘         └────────┬─────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ↓                 ↓                 ↓
         ┌─────────────┐   ┌─────────────┐  ┌─────────────┐
         │   Display   │   │  Position   │  │   Scoring   │
         │   Photo     │   │  Tracking   │  │   System    │
         └─────────────┘   └─────┬───────┘  └─────┬───────┘
                                 │                 │
                                 ↓                 ↓
                          ┌──────────────┐  ┌──────────────┐
                          │   Captured   │  │    Score     │
                          │   Guess      │  │   Result     │
                          └──────┬───────┘  └──────┬───────┘
                                 │                 │
                                 └────────┬────────┘
                                          ↓
                                   ┌──────────────┐
                                   │   Feedback   │
                                   │   Display    │
                                   └──────────────┘
```

---

## Component Dependency Graph

```
┌──────────────────────────────────────────────────────────┐
│              COMPONENT DEPENDENCIES                       │
└──────────────────────────────────────────────────────────┘

                    GameManager
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ↓                ↓                ↓
CustomLocationSync  PhotoStorage    ScoringSystem
                      Manager
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ↓                ↓                ↓
ExplorationPhase   PhotoPresent.   PositionMatch.
   Controller        Controller      Controller
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                 FeedbackController
                         │
                         ↓
                   SeekUIManager


Dependencies Summary:
• GameManager depends on ALL controllers
• All controllers are independent of each other
• UI Managers depend on their respective controllers
• Data structures (PhotoData, PuzzleData) have NO dependencies
```

---

## File Size & Complexity Matrix

```
┌────────────────────────────────────────────────────────┐
│         SCRIPT COMPLEXITY & SIZE                       │
└────────────────────────────────────────────────────────┘

Script Name                      Lines    Complexity    Role
─────────────────────────────────────────────────────────────
PhotoData.ts                      104     Low          Data
PuzzleData.ts                     162     Low          Data
─────────────────────────────────────────────────────────────
PhotoCaptureManager.ts            411     High         Hub
CustomLocationSync.ts             217     Medium       Monitor
CaptureButtonHandler.ts           226     Low          Handler
PhotoCaptureUI.ts                 304     Medium       UI
PhotoStorageManager.ts            ~150    Medium       Storage
─────────────────────────────────────────────────────────────
GameManager.ts                    370     High         Hub
ExplorationPhaseController.ts     211     Medium       Controller
PhotoPresentationController.ts    287     Medium       Controller
PositionMatchingController.ts     328     High         Controller
ScoringSystem.ts                  318     High         Calculator
FeedbackController.ts             317     Medium       Display
SeekUIManager.ts                  346     Medium       UI
─────────────────────────────────────────────────────────────
TOTAL                            ~3,751   ---          14 Files

Complexity Legend:
Low    - Simple logic, few dependencies
Medium - Moderate logic, some dependencies
High   - Complex logic, many dependencies, critical path
```

---

## AR World Space Layout

```
┌──────────────────────────────────────────────────────────┐
│            AR SPACE (Top-Down View)                       │
└──────────────────────────────────────────────────────────┘

         North
           ↑
           │
    ───────┼───────  Custom Location Boundary
           │
    ● ─────┼───── ● Photo Location 1
           │         (with ghost outline)
           │
           │    ◉   Player Position
    ● ─────┼───── ● Photo Location 2
           │         (target circle on ground)
           │
           │
    ● ─────┼───── ● Photo Location 3
           │
    ───────┼───────
           │

Legend:
  ●  = Photo target location
  ◉  = Player current position
  👻 = Ghost outline (at target)
  ⭕ = Target circle (on ground)
  ↔  = Distance indicator
  ↻  = Rotation indicator

UI Overlay (Screen Space):
┌─────────────────────────┐
│ Photo 3/10    Score:850 │ ← Top HUD
│                         │
│    [Photo Preview]      │ ← Photo display
│                         │
│  Distance: 2.3m away    │ ← Guidance
│  Rotation: 15° left     │
│                         │
│    [CAPTURE GUESS]      │ ← Action button
│                         │
│    Streak: 2 🔥         │ ← Status
└─────────────────────────┘
```

---

## Performance & Optimization Strategy

```
┌──────────────────────────────────────────────────────────┐
│              PERFORMANCE STRATEGY                         │
└──────────────────────────────────────────────────────────┘

UPDATE FREQUENCY:
┌─────────────────────────────────────┐
│ 60 FPS (Every Frame)                │
│  • Position tracking                │
│  • UI updates (throttled)           │
│  • Timer countdowns                 │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 30 FPS (Every Other Frame)          │
│  • Distance calculations            │
│  • Rotation guidance                │
│  • Hint system checks               │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 10 FPS (Every 6 Frames)             │
│  • Sync status checks               │
│  • Storage operations               │
│  • Analytics tracking               │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Event-Driven (As Needed)            │
│  • Photo capture                    │
│  • Guess submission                 │
│  • Feedback display                 │
│  • State transitions                │
└─────────────────────────────────────┘

MEMORY MANAGEMENT:
┌─────────────────────────────────────┐
│ Active in Memory                    │
│  • Current photo only               │
│  • Next 2 photos (preload)          │
│  • Current game state               │
│  • UI elements (visible)            │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Lazy Load                           │
│  • Photo textures (on demand)       │
│  • Feedback visuals (when shown)    │
│  • Ghost outlines (when tracking)   │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Released Immediately                │
│  • Previous photo textures          │
│  • Completed feedback displays      │
│  • Unused UI elements               │
└─────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────┐
│                ERROR HANDLING STRATEGY                    │
└──────────────────────────────────────────────────────────┘

Error Occurs
     │
     ↓
┌─────────────────┐
│ Catch Exception │
└────────┬────────┘
         │
    ┌────┴────┐
    │  Type?  │
    └────┬────┘
         │
    ┌────┼─────────────────────────┐
    ↓    ↓              ↓          ↓
 Tracking  Capture   Storage   Validation
  Lost     Failed    Error     Failed
    │        │          │          │
    ↓        ↓          ↓          ↓
 Pause   Retry 3x   Graceful   User
  Game    Times     Degrade    Message
    │        │          │          │
    ↓        ↓          ↓          ↓
 Guide   Report    Continue   Allow
  User    Error     Without    Retry
    │        │       Feature      │
    └────────┴──────────┴─────────┘
              │
              ↓
      ┌───────────────┐
      │ Log to Debug  │
      │ Console       │
      └───────────────┘
              │
              ↓
      ┌───────────────┐
      │ User Feedback │
      │ (if needed)   │
      └───────────────┘
              │
              ↓
      ┌───────────────┐
      │ Attempt       │
      │ Recovery      │
      └───────────────┘
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Event-driven communication
- ✅ Modular, testable components
- ✅ Scalable design
- ✅ Performance optimization
- ✅ Robust error handling

**All systems operational and ready for deployment! 🚀**

