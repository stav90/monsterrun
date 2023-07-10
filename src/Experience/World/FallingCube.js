import * as THREE from 'three'
import Experience from '../Experience.js'
class RigidBody {
    constructor() {
    }
  
    setRestitution(val) {
      this.body_.setRestitution(val);
    }
  
    setFriction(val) {
      this.body_.setFriction(val);
    }
  
    setRollingFriction(val) {
      this.body_.setRollingFriction(val);
    }
  
    createBox(mass, pos, quat, size) {
      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      this.transform_.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
      this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);
  
      const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
      this.shape_ = new Ammo.btBoxShape(btSize);
      this.shape_.setMargin(0.05);
  
      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      if (mass > 0) {
        this.shape_.calculateLocalInertia(mass, this.inertia_);
      }
  
      this.info_ = new Ammo.btRigidBodyConstructionInfo(
          mass, this.motionState_, this.shape_, this.inertia_);
      this.body_ = new Ammo.btRigidBody(this.info_);
  
      Ammo.destroy(btSize);
    }
  
    createSphere(mass, pos, size) {
      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      this.transform_.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
      this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);
  
      this.shape_ = new Ammo.btSphereShape(size);
      this.shape_.setMargin(0.05);
  
      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      if(mass > 0) {
        this.shape_.calculateLocalInertia(mass, this.inertia_);
      }
  
      this.info_ = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState_, this.shape_, this.inertia_);
      this.body_ = new Ammo.btRigidBody(this.info_);
    }
  }
export default class FallingCube
{
    constructor(physics)
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug
        this.physics = physics
        // Debug
        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('fox')
        }

        // Resource
        this.resource = this.resources.items.foxModel

        
        // this.setAnimation()
        this.setPhysics()
        this.setModel()
    }
    setPhysics() {
        // Ammo().then( function( AmmoLib ) {
        //     Ammo = AmmoLib;
        //     init(Ammo);
        //     // animate();
        // } );
        
        // const init = (Ammo) =>{
        //     this.collisionConfiguration_ = new Ammo.btDefaultCollisionConfiguration();
        //     this.dispatcher_ = new Ammo.btCollisionDispatcher(this.collisionConfiguration_);
        //     this.broadphase_ = new Ammo.btDbvtBroadphase();
        //     this.solver_ = new Ammo.btSequentialImpulseConstraintSolver();
        //     this.physicsWorld_ = new Ammo.btDiscreteDynamicsWorld(
        //     this.dispatcher_, this.broadphase_, this.solver_, this.collisionConfiguration_);
        //     this.physicsWorld_.setGravity(new Ammo.btVector3(0, -100, 0));
        // }
    }
    setModel()
    {
        setTimeout(() => {
            const ground = new THREE.Mesh(
            new THREE.BoxGeometry(100, .1, 100),
            new THREE.MeshStandardMaterial({color: 0x404040}));
            ground.castShadow = false;
            ground.receiveShadow = true;
            this.scene.add(ground);
        
            const rbGround = new RigidBody();
            rbGround.createBox(0, ground.position, ground.quaternion, new THREE.Vector3(100, .1, 100));
            rbGround.setRestitution(0.99);
            this.physics.physicsWorld_.addRigidBody(rbGround.body_);
        
            this.rigidBodies_ = [];
            
            const box = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            new THREE.MeshStandardMaterial({color: 0x808080}));
            box.position.set(0, 10, 0);
            box.castShadow = true;
            box.receiveShadow = true;
            this.scene.add(box);
        
            const rbBox = new RigidBody();
            rbBox.createBox(1, box.position, box.quaternion, new THREE.Vector3(4, 4, 4));
            rbBox.setRestitution(0.25);
            rbBox.setFriction(1);
            rbBox.setRollingFriction(5);
            this.physics.physicsWorld_.addRigidBody(rbBox.body_);
            this.tmpTransform_ = new Ammo.btTransform();
            this.rigidBodies_.push({mesh: box, rigidBody: rbBox});
    }, 1000);
    
    }

    setAnimation()
    {
        this.animation = {}
        
        // Mixer
        this.animation.mixer = new THREE.AnimationMixer(this.model)
        
        // Actions
        this.animation.actions = {}
        
        this.animation.actions.idle = this.animation.mixer.clipAction(this.resource.animations[0])
        this.animation.actions.walking = this.animation.mixer.clipAction(this.resource.animations[1])
        this.animation.actions.running = this.animation.mixer.clipAction(this.resource.animations[2])
        
        this.animation.actions.current = this.animation.actions.idle
        this.animation.actions.current.play()

        // Play the action
        this.animation.play = (name) =>
        {
            const newAction = this.animation.actions[name]
            const oldAction = this.animation.actions.current

            newAction.reset()
            newAction.play()
            newAction.crossFadeFrom(oldAction, 1)

            this.animation.actions.current = newAction
        }

        // Debug
        if(this.debug.active)
        {
            const debugObject = {
                playIdle: () => { this.animation.play('idle') },
                playWalking: () => { this.animation.play('walking') },
                playRunning: () => { this.animation.play('running') }
            }
            this.debugFolder.add(debugObject, 'playIdle')
            this.debugFolder.add(debugObject, 'playWalking')
            this.debugFolder.add(debugObject, 'playRunning')
        }
    }
 

    update()
    {
        // this.animation.mixer.update(this.time.delta * 0.001)
        if( this.physics.physicsWorld_){
            this.physics.physicsWorld_.stepSimulation(this.time.delta * 0.001, 10);
        }
        

        if(this.rigidBodies_){
            for (let i = 0; i < this.rigidBodies_.length; ++i) {
                this.rigidBodies_[i].rigidBody.motionState_.getWorldTransform(this.tmpTransform_);
                const pos = this.tmpTransform_.getOrigin();
                const quat = this.tmpTransform_.getRotation();
                const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
                const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());
          
                this.rigidBodies_[i].mesh.position.copy(pos3);
                this.rigidBodies_[i].mesh.quaternion.copy(quat3);
              }
        }
       
    }
}