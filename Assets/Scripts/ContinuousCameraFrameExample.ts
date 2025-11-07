import { ContainerFrame } from "SpectaclesInteractionKit.lspkg/Components/UI/ContainerFrame/ContainerFrame"

const LAST_POSITION = 'lastPos';

const POSITIONS_STORE_KEY = 'positions'
const ROTATIONS_STORE_KEY = 'rotations'

@component
export class ContinuousCameraFrameExample extends BaseScriptComponent {
  private cameraModule: CameraModule = require('LensStudio:CameraModule');
  private gestureModule: GestureModule = require('LensStudio:GestureModule');
  private cameraRequest: CameraModule.CameraRequest;
  private cameraTexture: Texture;
  private cameraTextureProvider: CameraTextureProvider;

  private lastPosition: vec3 | undefined;
  private lastRotation: quat | undefined;

  private disableGettingImages: boolean = false;

  private currentImage: number = 0;

  @input
  private images: Image[] = [];

  @input
  private backgrounds: SceneObject[] = [];

  @input
  texts: Text[] | undefined;

  private positions: vec3[] = [];
  private rotations: quat[] = [];

  @input
  @hint('The image in the scene that will be showing the captured frame.')
  uiImage: Image | undefined;

  @input
  camera: SceneObject | undefined;

  @input
  text: Text | undefined;

  @input
  center: SceneObject | undefined;

  @input
  panel: SceneObject | undefined;

  @input
  greenMaterial: Material | undefined;

  @input
  whitePrefab: ObjectPrefab | undefined;

  private canTakeSnapshot : boolean = true;

  getRelativePositionToCenter(sceneObject) : vec3 {
    let worldPosition = sceneObject.getTransform().getWorldPosition();
    let relativePositionToCenter = this.center.getTransform().getInvertedWorldTransform().multiplyPoint(worldPosition)
    return relativePositionToCenter
  }

  getRelativeRotationToCenter(sceneObject) : quat {
    let worldRotation = sceneObject.getTransform().getWorldRotation();
    let relativeRotationToCenter = this.center.getTransform().getWorldRotation().invert().multiply(worldRotation)
    return relativeRotationToCenter
  }

  getStore() {
    return global.persistentStorageSystem.store;
  }

  savePositions() {
    this.getStore().putVec3Array(POSITIONS_STORE_KEY, this.positions);
  }

  loadPositions() {
    this.positions = this.getStore().getVec3Array(POSITIONS_STORE_KEY);

  }

  saveRotations() {
    this.getStore().putQuatArray(ROTATIONS_STORE_KEY, this.rotations);
  }

  loadRotations() {
    this.rotations = this.getStore().getQuatArray(ROTATIONS_STORE_KEY);
  }

  detachImages() {
    for (const image of this.images) {
      image.sceneObject.getParent().getParent().setParentPreserveWorldTransform(this.camera.getParent())

      let panel = image.sceneObject.getParent().getParent()
      let containerFrame = panel.getComponent(ContainerFrame.getTypeName())
      // containerFrame.updateMaterial(this.greenMaterial)
      let manipulation = containerFrame.getInteractableManipulation()
      manipulation.enabled = true
      manipulation.setCanRotate(true)
    }
    
    
    this.panel.destroy()
  }

  // TODO save and load Textures

  onAwake() {
    let store = global.persistentStorageSystem.store;

    for (const image of this.images) {
      image.mainMaterial = image.mainMaterial.clone()
    }

    for (const background of this.backgrounds) {
      const visual = background.getComponent("Component.MeshVisual")
      visual.mainMaterial = visual.mainMaterial.clone()
    }

    this.loadPositions()
    this.loadRotations()
    // loadImages()

    const lastPos = store.getVec3(LAST_POSITION)
    if (!lastPos.equal(vec3.zero())) {
      this.lastPosition = lastPos
      print('recorded last position'+this.lastPosition)
    }
    
    this.createEvent('OnStartEvent').bind(() => {
      const imageRequest = CameraModule.createImageRequest();
      
      this.gestureModule
        .getPinchDownEvent(GestureModule.HandType.Left)
        .add(async (pinchDownArgs: PinchDownArgs) => {
          print('Right Hand Pinch Down');

          if (this.disableGettingImages || !this.canTakeSnapshot) {
            return
          }

          this.canTakeSnapshot = false

          // TODO only enable pinch inside the recorded space

          // let camera = global.deviceInfoSystem.getTrackingCameraForId(
          //   CameraModule.CameraId.Left_Color
          // );
          
          try {
            const relativePositionToCenter = this.getRelativePositionToCenter(this.camera);
            this.positions[this.currentImage] = relativePositionToCenter

            const relativeRotationToCenter = this.getRelativeRotationToCenter(this.camera);
            this.rotations[this.currentImage] = relativeRotationToCenter

            var whiteInstance = this.whitePrefab.instantiate(this.getSceneObject());
            whiteInstance.getTransform().setWorldPosition(this.camera.getTransform().getWorldPosition());
            whiteInstance.getTransform().setWorldRotation(this.camera.getTransform().getWorldRotation());

            if (this.currentImage >= this.images.length - 1) {
              this.disableGettingImages = true; // ensure before await getting image
            }

            const imageFrame = await this.cameraModule.requestImage(imageRequest);

            // TODO store image
            // https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.Base64.html

            // TODO ensure not the same texture for each one?
            this.images[this.currentImage].mainPass.baseTex = imageFrame.texture;

            this.currentImage = (this.currentImage + 1) % this.images.length;

            if (this.currentImage === 0) {
              // this.disableGettingImages = true;
              this.detachImages()
            }

            const delay = this.createEvent("DelayedCallbackEvent")
            delay.bind((eventData) => {
                this.canTakeSnapshot = true
            })
            delay.reset(3.0);
          

            // E.g, use the texture in some visual
            // if (this.uiImage) {
              
            //   let relativePositionToCenter = this.getRelativePositionToCenter(this.camera);

            //   // TODO rotation
            //   // this.lastRotation = this.camera.getTransform().getWorldRotation();

            //   this.lastPosition = relativePositionToCenter
            //   store.putVec3(LAST_POSITION, this.lastPosition)

            //   // this.uiImage.mainPass.baseTex = imageFrame.texture;
            // }
            
            // let timestamp = imageFrame.timestampMillis; // scene-relative time
          } catch (error) {
            print(`Still image request failed: ${error}`);
          }
        });

        // How to get realtime camera
        // this.cameraRequest = CameraModule.createCameraRequest();
        // this.cameraRequest.cameraId = CameraModule.CameraId.Default_Color;

        // this.cameraTexture = this.cameraModule.requestCamera(this.cameraRequest);
        // this.cameraTextureProvider = this.cameraTexture.control as CameraTextureProvider;
        // this.cameraTextureProvider.onNewFrame.add((cameraFrame) => {
        //   if (this.uiImage && this.isPinching) {
        //     this.uiImage.mainPass.baseTex = this.cameraTexture;
        //     this.isPinching = false;
        //   }
        // });
    });

    this.createEvent('UpdateEvent').bind(() => {
      // TODO
      // foreach sceneobject that contains an image
      // compare it to its relative position and rotation to center
      // apply effect on success and lock it
      for (let i = 0; i < this.images.length; ++i) {

        if (!this.positions[i]) continue

        let relativePositionToCenter = this.getRelativePositionToCenter(this.images[i].sceneObject);
        let distance = this.positions[i].distance(relativePositionToCenter);
        this.texts[i].text = distance.toFixed(2)

        

        if (distance < 10) {
          this.backgrounds[i].getComponent("Component.MeshVisual").mainMaterial.mainPass.baseColor = new vec4(0,255,0,1)
          this.texts[i].text += "Success";
        } else {
          this.texts[i].text += "Too far";
        }
      }


      // if (this.lastPosition) {
      //   let relativePositionToCenter = this.getRelativePositionToCenter(this.camera);
      //   let distance = this.lastPosition.distance(relativePositionToCenter);
      //   this.text.text = distance.toFixed(2)
        
      //   if (distance < 10) {
      //     this.text.text += "Success";
      //   } else {
      //     this.text.text += "Too far";
      //   }
      // }
    });
  }
}