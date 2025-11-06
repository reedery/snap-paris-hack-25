@component
export class ContinuousCameraFrameExample extends BaseScriptComponent {
  private cameraModule: CameraModule = require('LensStudio:CameraModule');
  private gestureModule: GestureModule = require('LensStudio:GestureModule');
  private cameraRequest: CameraModule.CameraRequest;
  private cameraTexture: Texture;
  private cameraTextureProvider: CameraTextureProvider;

  private lastPosition: vec3 | undefined;

  @input
  @hint('The image in the scene that will be showing the captured frame.')
  uiImage: Image | undefined;

  @input
  camera: Camera | undefined;

  @input
  text: Text | undefined;

  onAwake() {
    this.createEvent('OnStartEvent').bind(() => {
      this.cameraRequest = CameraModule.createCameraRequest();
      this.cameraRequest.cameraId = CameraModule.CameraId.Default_Color;

      this.cameraTexture = this.cameraModule.requestCamera(this.cameraRequest);
      this.cameraTextureProvider = this.cameraTexture
        .control as CameraTextureProvider;

      this.gestureModule
        .getPinchDownEvent(GestureModule.HandType.Right)
        .add(async (pinchDownArgs: PinchDownArgs) => {
          print('Right Hand Pinch Down');

          let camera = global.deviceInfoSystem.getTrackingCameraForId(
            CameraModule.CameraId.Left_Color
          );

          // Retrieve camera properties
          // let focalLength = camera.focalLength;
          // let principalPoint = camera.principalPoint;
          // let resolution = camera.resolution;
          // let pose = camera.pose;
          // print(pose);
          
          let imageRequest = CameraModule.createImageRequest();

          try {
            let imageFrame = await this.cameraModule.requestImage(imageRequest);

            // E.g, use the texture in some visual
            if (this.uiImage) {
              this.lastPosition = this.camera.getTransform().getWorldPosition();
              this.uiImage.mainPass.baseTex = imageFrame.texture;
            }
            
            // let timestamp = imageFrame.timestampMillis; // scene-relative time
          } catch (error) {
            print(`Still image request failed: ${error}`);
          }
        });

      // this.cameraTextureProvider.onNewFrame.add((cameraFrame) => {
      //   if (this.uiImage && this.isPinching) {
      //     this.uiImage.mainPass.baseTex = this.cameraTexture;
      //     this.isPinching = false;
      //   }
      // });

      
    });

    this.createEvent('UpdateEvent').bind(() => {
      if (this.lastPosition) {
        let distance = this.lastPosition.distance(this.camera.getTransform().getWorldPosition());
        this.text.text = distance.toFixed(2)
        // if (distance < .5) {
        //   this.text.text = "Success";
        // } else {
        //   this.text.text = "Too far";
        // }
        
      }
    });
  }
}