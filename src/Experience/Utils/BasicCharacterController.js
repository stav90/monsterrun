import * as THREE from 'three'
import BasicCharacterControllerInput from '../Utils/BasicCharacterControllerInput'
import CharacterFSM from './CharacterFSM';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

class BasicCharacterControllerProxy {
    constructor(animations) {
      this._animations = animations;
    
    }
  
    get animations() {
      return this._animations;
    }
};
export default class BasicCharacterController {
    constructor(model, animations) {
      this._Init(model, animations);
      
    }
  
    _Init( model, animations) {
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
      this._velocity = new THREE.Vector3(0, 0, 0);

      this.model = model
      this.animations = animations

      this._animations = {};
      this._input = new BasicCharacterControllerInput();
      
      this._stateMachine = new CharacterFSM(
          new BasicCharacterControllerProxy(this.animations));
  
      this.setStateMachineDefault();
    }
  
    setStateMachineDefault() {
        this._target = this.model;
        this._stateMachine.SetState('idle');
    }
  
    Update(timeInSeconds) {
      if (!this._target) {
        return;
      }
  
      this._stateMachine.Update(timeInSeconds, this._input);
  
      const velocity = this._velocity;
      const frameDecceleration = new THREE.Vector3(
          velocity.x * this._decceleration.x,
          velocity.y * this._decceleration.y,
          velocity.z * this._decceleration.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
          Math.abs(frameDecceleration.z), Math.abs(velocity.z));
  
      velocity.add(frameDecceleration);
  
      const controlObject = this._target;
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = controlObject.quaternion.clone();
  
      const acc = this._acceleration.clone();
      if (this._input._keys.shift) {
        acc.multiplyScalar(3.0);
      }
      setTimeout(() => {
            if (this._stateMachine._currentState.Name == 'dance') {
            acc.multiplyScalar(0.0);
      }
      }, 1000);
  
  
      if (this._input._keys.forward) {
        velocity.z += acc.z * timeInSeconds;
      }
      if (this._input._keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
      }
      if (this._input._keys.left) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }
      if (this._input._keys.right) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }
  
      controlObject.quaternion.copy(_R);
  
      const oldPosition = new THREE.Vector3();
      oldPosition.copy(controlObject.position);
  
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(controlObject.quaternion);
      forward.normalize();
  
      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(controlObject.quaternion);
      sideways.normalize();
  
      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);
  
      controlObject.position.add(forward);
      controlObject.position.add(sideways);
  
      oldPosition.copy(controlObject.position);

    }
  };
  