# Photo Capture Setup Guide for Lens Studio
## Hide & Seek Photos - Complete Implementation Guide

This guide walks you through setting up the photo capture system in Lens Studio after the code has been implemented.

---

## Table of Contents
1. [Overview](#overview)
2. [Scene Setup](#scene-setup)
3. [Component Configuration](#component-configuration)
4. [UI Setup](#ui-setup)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The photo capture system consists of 6 main TypeScript components:
- **PhotoData.ts** - Data structure for individual photos
- **PuzzleData.ts** - Container for complete photo sets
- **CustomLocationSync.ts** - Location tracking monitor
- **PhotoStorageManager.ts** - Persistent storage handler
- **PhotoCaptureManager.ts** - Main capture controller
- **PhotoCaptureUI.ts** - User interface controller

---

## Scene Setup

### Step 1: Import Scripts

1. Open your Lens Studio project: `CustomLocationsExample.esproj`
2. Verify all 6 TypeScript files are in `Assets/Scripts/`:
   ```
   Assets/Scripts/
   ├── PhotoData.ts
   ├── PuzzleData.ts
   ├── CustomLocationSync.ts
   ├── PhotoStorageManager.ts
   ├── PhotoCaptureManager.ts
   └── PhotoCaptureUI.ts
   ```
3. Lens Studio should automatically compile these files
4. Check the **Logger** panel (Windows → Logger) for any compilation errors

### Step 2: Create Scene Hierarchy

Create the following scene object hierarchy:

```
Scene
├── Camera (existing)
├── Custom Location (existing - your location asset)
│   └── LocationTracking Component
├── PhotoCaptureSystem [new SceneObject]
│   ├── Managers [new SceneObject]
│   │   ├── PhotoCaptureManager [new SceneObject]
│   │   ├── CustomLocationSync [new SceneObject]
│   │   └── PhotoStorageManager [new SceneObject]
│   └── UI [new SceneObject]
│       ├── PhotoCaptureUI [new SceneObject]
│       ├── CounterText [new SceneObject]
│       ├── StatusText [new SceneObject]
│       ├── ProgressBar [new SceneObject]
│       ├── SyncIndicator [new SceneObject]
│       └── CaptureButton [new SceneObject]
```

**To create this hierarchy:**

1. **Right-click** in Objects panel → **Create New** → **Empty Object**
2. Rename it to "PhotoCaptureSystem"
3. Repeat to create child objects as shown above
4. Use drag-and-drop to arrange the hierarchy

---

## Component Configuration

### Step 3: Attach Script Components

#### 3.1 PhotoCaptureManager Component

1. Select the **PhotoCaptureManager** scene object
2. In Inspector panel, click **Add Component**
3. Choose **Script Component**
4. In the Script field, select **PhotoCaptureManager**

**Configure Inspector Properties:**

| Property | Value | Description |
|----------|-------|-------------|
| Max Photos | 15 | Maximum photos per puzzle |
| Min Photos | 5 | Minimum required photos |
| Capture Delay | 0.5 | Cooldown in seconds |
| Auto Save Interval | 3 | Save every N photos |
| Location Sync | *(drag reference)* | Drag CustomLocationSync object here |
| Storage Manager | *(drag reference)* | Drag PhotoStorageManager object here |
| Camera | *(drag reference)* | Drag Camera object here |
| Custom Location Id | "your_location_id" | Your Custom Location's ID |
| Debug Mode | ✓ | Enable for testing |

**To get Custom Location ID:**
- Select your Custom Location asset
- Look in Inspector for the Location ID field
- Copy and paste into Custom Location Id field

#### 3.2 CustomLocationSync Component

1. Select the **CustomLocationSync** scene object
2. Add Component → Script Component → **CustomLocationSync**

**Configure Inspector Properties:**

| Property | Value | Description |
|----------|-------|-------------|
| Custom Location | *(drag asset)* | Drag your Custom Location asset from Assets panel |
| Min Confidence | 0.7 | Tracking quality threshold (0.0-1.0) |
| Debug Mode | ✓ | Enable for testing |

#### 3.3 PhotoStorageManager Component

1. Select the **PhotoStorageManager** scene object
2. Add Component → Script Component → **PhotoStorageManager**

**Configure Inspector Properties:**

| Property | Value | Description |
|----------|-------|-------------|
| Debug Mode | ✓ | Enable for testing |
| Max Storage MB | 50 | Maximum storage size |

#### 3.4 PhotoCaptureUI Component

1. Select the **PhotoCaptureUI** scene object
2. Add Component → Script Component → **PhotoCaptureUI**

**Configure Inspector Properties:**

| Property | Value | Description |
|----------|-------|-------------|
| Capture Manager | *(drag reference)* | Drag PhotoCaptureManager object |
| Location Sync | *(drag reference)* | Drag CustomLocationSync object |
| Counter Text | *(drag reference)* | Drag CounterText object (set up next) |
| Status Text | *(drag reference)* | Drag StatusText object (set up next) |
| Progress Bar | *(drag reference)* | Drag ProgressBar object (set up next) |
| Sync Indicator | *(drag reference)* | Drag SyncIndicator object (set up next) |
| Capture Button | *(drag reference)* | Drag CaptureButton object (set up next) |
| Enable Haptics | ✓ | Enable haptic feedback |
| Debug Mode | ✓ | Enable for testing |

---

## UI Setup

### Step 4: Create UI Elements

#### 4.1 Counter Text

1. Select **CounterText** scene object
2. Add Component → **Screen Transform**
   - Set Anchors: Top Center
   - Position Y: -100 (adjust as needed)
3. Add Component → **Text**
   - Font: Choose a clear font from Assets
   - Size: 60
   - Text Color: White
   - Initial Text: "0/15 photos"
   - Horizontal Alignment: Center

#### 4.2 Status Text

1. Select **StatusText** scene object
2. Add Component → **Screen Transform**
   - Set Anchors: Top Center
   - Position Y: -200
3. Add Component → **Text**
   - Size: 40
   - Text Color: White
   - Initial Text: "Syncing to location..."
   - Horizontal Alignment: Center

#### 4.3 Progress Bar

1. Select **ProgressBar** scene object
2. Add Component → **Screen Transform**
   - Set Anchors: Bottom Stretch
   - Height: 20
   - Position Y: 50
3. Add Component → **Image**
   - Stretch Mode: Stretch
   - Color: Green
4. Add a child object "ProgressBar Background":
   - Add Screen Transform (same size)
   - Add Image component
   - Color: Gray
   - Send to back (Layer order)

#### 4.4 Sync Indicator

1. Select **SyncIndicator** scene object
2. Add Component → **Screen Transform**
   - Set Anchors: Top Left
   - Position: (50, -50)
   - Size: (100, 100)
3. Add Component → **Image**
   - Image: Circle texture (create or import)
   - Initial Color: Red
   - Or use 3D sphere mesh for spatial indicator

#### 4.5 Capture Button

1. Select **CaptureButton** scene object
2. Add Component → **Screen Transform**
   - Set Anchors: Bottom Center
   - Position Y: 150
   - Size: (200, 200)
3. Add Component → **Image**
   - Image: Circle or camera icon
   - Color: White
4. Add Component → **Interactable** (from Spectacles Interaction Kit)
   - Enable Hand Interaction
   - Enable Tap interaction

**Create Button Material:**
1. Assets panel → Right-click → Create New → Material
2. Name it "CaptureButtonMaterial"
3. Drag to Status Material field in PhotoCaptureUI component

---

## Step 5: Wire Up Capture Button

The capture button needs to trigger the `capturePhoto()` method:

1. Select **CaptureButton** scene object
2. Add Component → **Script Component** → Create new script "CaptureButtonHandler.ts"

**Create this script:**

```typescript
import { PhotoCaptureManager } from "./PhotoCaptureManager";

@component
export class CaptureButtonHandler extends BaseScriptComponent {
  @input
  private captureManager: PhotoCaptureManager | null = null;

  @input
  private interactable: Interactable | null = null;

  onAwake() {
    if (this.interactable) {
      this.interactable.onTap.add(() => {
        this.onButtonTapped();
      });
    }
  }

  private onButtonTapped(): void {
    if (this.captureManager) {
      const success = this.captureManager.capturePhoto();
      if (success) {
        print("Photo captured!");
      }
    }
  }
}
```

3. In Inspector, drag **PhotoCaptureManager** to the Capture Manager field
4. Drag the **Interactable** component to the Interactable field

---

## Step 6: Configure Camera for Capture

1. Select your **Camera** object
2. Ensure it has a **Camera** component
3. Add **Render Target** for capturing:
   - Assets panel → Right-click → Create New → Render Target
   - Name it "PhotoCaptureTarget"
   - Set Size: 1024x1024 or higher
   - Assign to Camera's Render Target property

---

## Testing

### Step 7: Test in Lens Studio Preview

1. **Set Device Simulation:**
   - Preview panel → Device Type Override → **Spectacles (2024)**

2. **Initial State Check:**
   - Counter should show "0/15 photos"
   - Status should show sync status
   - Sync indicator should be red/yellow

3. **Simulate Location Sync:**
   - For testing without actual Custom Location:
   - In CustomLocationSync.ts, temporarily modify `getTrackingQuality()` to return 0.9
   - This simulates good tracking

4. **Test Capture Flow:**
   - Click/tap the capture button
   - Counter should increment: "1/15 photos"
   - Progress bar should fill
   - Button should show cooldown briefly

5. **Check Logger:**
   - Windows → Logger
   - Look for debug messages:
     - "PhotoCaptureManager: Initialized session"
     - "PhotoCaptureManager: Captured photo X/15"
     - "PhotoStorageManager: Saved puzzle"

### Step 8: Test on Spectacles Device

1. **Deploy to Device:**
   - Preview panel → Connected Spectacles device
   - Click **Push to Device**

2. **Physical Location Test:**
   - Go to your mapped Custom Location
   - Wait for location sync (indicator turns green)
   - Status text should show "Ready to capture"
   - Capture multiple photos while moving around

3. **Validate Transforms:**
   - Photos should capture correct positions
   - Check storage persistence by restarting lens

---

## Troubleshooting

### Common Issues

#### Issue: "Required components missing"
**Solution:**
- Check all component references in Inspector
- Ensure drag-and-drop connections are made
- Look for red warning triangles in Inspector

#### Issue: "Custom Location not synced"
**Solution:**
- Verify Custom Location asset is properly configured
- Check you're in the correct physical location
- Ensure LocationTracking component is active
- Try `locationSync.relocalize()` to force re-sync

#### Issue: Capture button not responding
**Solution:**
- Check Interactable component is enabled
- Verify CaptureButtonHandler script is attached
- Check captureManager reference is connected
- Enable hand tracking in scene

#### Issue: Photos not saving
**Solution:**
- Check PhotoStorageManager is initialized
- Verify persistent storage is available
- Check available storage space
- Look for errors in Logger panel

#### Issue: UI not updating
**Solution:**
- Verify all UI component references in PhotoCaptureUI
- Check Text components have valid fonts
- Ensure Screen Transforms are properly configured
- Look for null reference errors in Logger

#### Issue: Tracking confidence always 0
**Solution:**
- Verify Custom Location asset is assigned
- Check LocationTracking component exists
- Ensure device has location permissions
- Test in actual Custom Location area

### Debug Tips

1. **Enable All Debug Modes:**
   - Set all Debug Mode checkboxes to ✓
   - Check Logger for detailed output

2. **Test Components Individually:**
   - Test CustomLocationSync first
   - Then test PhotoCaptureManager
   - Finally test full UI integration

3. **Monitor Performance:**
   - Windows → Performance panel
   - Watch for frame drops during capture
   - Check memory usage with multiple photos

4. **Storage Inspection:**
   - Add temporary button to log all puzzle IDs
   - Verify puzzles are being saved correctly
   - Test loading saved puzzles

---

## Advanced Configuration

### Difficulty Modes

Modify PhotoCaptureManager properties for different difficulties:

**Easy Mode:**
```
Max Photos: 5
Capture Delay: 1.0
Min Photos: 3
```

**Normal Mode (Default):**
```
Max Photos: 15
Capture Delay: 0.5
Min Photos: 5
```

**Hard Mode:**
```
Max Photos: 20
Capture Delay: 0.2
Min Photos: 10
```

### Custom Location Tips

For best tracking:
- Map location in good lighting
- Include distinctive visual features
- Cover area where photos will be taken
- Test sync in various conditions

---

## Next Steps

After successful photo capture implementation:

1. **Implement Photo Review:**
   - Add UI to browse captured photos
   - Show thumbnails and metadata
   - Allow deletion of bad photos

2. **Implement Seek/Find Phase:**
   - Load puzzle data
   - Display target photo
   - Match user position to photo position
   - Calculate accuracy score

3. **Add Multiplayer:**
   - Share puzzles with friends
   - Compete for best finding times
   - Leaderboard integration

4. **Optimize Performance:**
   - Compress photos further
   - Lazy load thumbnails
   - Background processing for saves

---

## Support

If you encounter issues not covered here:

1. Check Lens Studio documentation: https://developers.snap.com/lens-studio
2. Review Spectacles-specific APIs: https://developers.snap.com/spectacles
3. Check the Logger panel for specific error messages
4. Verify all TypeScript files compiled without errors

---

## Summary Checklist

Before testing, verify:

- [ ] All 6 TypeScript files are in Assets/Scripts/
- [ ] No compilation errors in Logger panel
- [ ] Scene hierarchy matches structure above
- [ ] All script components attached to correct objects
- [ ] All Inspector references connected via drag-and-drop
- [ ] UI elements have Screen Transform and Text/Image components
- [ ] Capture button has Interactable component
- [ ] CaptureButtonHandler script created and connected
- [ ] Camera has Render Target assigned
- [ ] Custom Location asset properly configured
- [ ] Debug mode enabled on all components
- [ ] Device set to Spectacles (2024) in Preview

---

**Happy Capturing!** 📸
