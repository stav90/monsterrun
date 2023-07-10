import * as THREE from 'three'
import Experience from '../Experience.js'
import BasicCharacterController from '../Utils/BasicCharacterController'
import { AmbientLight, BoxBufferGeometry, MeshPhongMaterial } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CharacterControls, CONTROLLER_BODY_RADIUS } from '../Utils/CharacterController';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KeyDisplay } from '../Utils/utils';
 
export default class MikCharacter
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug
        this._mixers = [];

        // Debug
        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('fox')
        }

        // Resource
        this.resource = this.resources.items.mikDude

        this.setModel()
        this.setAnimation()
        this.setUpCharacterControls()
    

    }
    setUpCharacterControls() {
        import('@dimforge/rapier3d').then(RAPIER => {
            
            function body(scene, world,
                bodyType,
                colliderType, dimension,
                translation,
                rotation,
                color) {
                    
                let bodyDesc
        
                if (bodyType === 'dynamic') {
                    bodyDesc = RAPIER.RigidBodyDesc.dynamic();
                } else if (bodyType === 'kinematicPositionBased') {
                    bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
                } else if (bodyType === 'static') {
                    bodyDesc = RAPIER.RigidBodyDesc.fixed();
                    bodyDesc.setCanSleep(false);
                }
        
                if (translation) {
                    bodyDesc.setTranslation(translation.x, translation.y, translation.z)
                }
                if(rotation) {
                    const q = new THREE.Quaternion().setFromEuler(
                        new THREE.Euler( rotation.x, rotation.y, rotation.z, 'XYZ' )
                    )
                    bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
                }
        
                let rigidBody = world.createRigidBody(bodyDesc);
        
                let collider;
                if (colliderType === 'cube') {
                    collider = RAPIER.ColliderDesc.cuboid(dimension.hx, dimension.hy, dimension.hz);
                } else if (colliderType === 'sphere') {
                    collider = RAPIER.ColliderDesc.ball(dimension.radius);
                } else if (colliderType === 'cylinder') {
                    collider = RAPIER.ColliderDesc.cylinder(dimension.hh, dimension.radius);
                } else if (colliderType === 'cone') {
                    collider = RAPIER.ColliderDesc.cone(dimension.hh, dimension.radius);
                    // cone center of mass is at bottom
                    collider.centerOfMass = {x:0, y:0, z:0}
                }
                world.createCollider(collider, rigidBody.handle);
        
                let bufferGeometry;
                if (colliderType === 'cube') {
                    bufferGeometry = new BoxBufferGeometry(dimension.hx * 2, dimension.hy * 2, dimension.hz * 2);
                } else if (colliderType === 'sphere') {
                    bufferGeometry = new THREE.SphereBufferGeometry(dimension.radius, 32, 32);
                } else if (colliderType === 'cylinder') {
                    bufferGeometry = new THREE.CylinderBufferGeometry(dimension.radius, 
                        dimension.radius, dimension.hh * 2,  32, 32);
                } else if (colliderType === 'cone') {
                    bufferGeometry = new THREE.ConeBufferGeometry(dimension.radius, dimension.hh * 2,  
                        32, 32);
                }
        
                const threeMesh = new THREE.Mesh(bufferGeometry, new MeshPhongMaterial({ color: color }));
                threeMesh.castShadow = true;
                threeMesh.receiveShadow = true;
                scene.add(threeMesh);
        
                return { rigid: rigidBody, mesh: threeMesh };
            }
            const generateTerrain = (nsubdivs, scale) =>{
                let heights= []
            
                // three plane
                const threeFloor = new THREE.Mesh(
                    new THREE.PlaneBufferGeometry(scale.x, scale.z, nsubdivs, nsubdivs),
                    new THREE.MeshStandardMaterial({
                        //  map: loadTexture('/textures/grass/Grass_005_BaseColor.jpg'),
                        //  normalMap: loadTexture('/textures/grass/Grass_005_Normal.jpg'),
                        //  aoMap: loadTexture('/textures/grass/Grass_005_AmbientOcclusion.jpg'),
                        //  roughnessMap: loadTexture('/textures/grass/Grass_005_Roughness.jpg'),
                         roughness: 0.6
                    }));
                threeFloor.rotateX(- Math.PI / 2);
                threeFloor.receiveShadow = true;
                threeFloor.castShadow = true;
                this.scene.add(threeFloor);
            
                // add height data to plane
                const vertices = threeFloor.geometry.attributes.position.array;
                const dx = scale.x / nsubdivs;
                const dy = scale.z / nsubdivs;
                // store height data in map column-row map
                const columsRows = new Map();
                for (let i = 0; i < vertices.length; i += 3) {
                    // translate into colum / row indices
                    let row = Math.floor(Math.abs((vertices)[i] + (scale.x / 2)) / dx);
                    let column = Math.floor(Math.abs((vertices)[i + 1] - (scale.z / 2)) / dy);
                    // generate height for this column & row
                    const randomHeight = 0;
                    (vertices)[i + 2] = scale.y * randomHeight;
                    // store height
                    if (!columsRows.get(column)) {
                        columsRows.set(column, new Map());
                    }
                    columsRows.get(column).set(row, randomHeight);
                }
                threeFloor.geometry.computeVertexNormals();
        
                // store height data into column-major-order matrix array
                for (let i = 0; i <= nsubdivs; ++i) {
                    for (let j = 0; j <= nsubdivs; ++j) {
                        heights.push(columsRows.get(j).get(i));
                    }
                }
            
                let groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
                let groundBody = this.world.createRigidBody(groundBodyDesc);
                let groundCollider = RAPIER.ColliderDesc.heightfield(
                    nsubdivs, nsubdivs, new Float32Array(heights), scale
                );
                this.world.createCollider(groundCollider, groundBody.handle);
            }
             // Use the RAPIER module here.



            let gravity = { x: 0.0, y: -9.81, z: 0.0 };
            this.world = new RAPIER.World(gravity);
            // Bodys
       
            // Create Ground.
            let nsubdivs = 20;
            let scale = new RAPIER.Vector3(70.0, 3.0, 70.0);
            this.bodys = []
            generateTerrain(nsubdivs, scale);

            // const staticB = body(this.scene, this.world, 'static', 'cube',
            //     { hx: 10, hy: 0.8, hz: 10 }, { x: 10, y: .5, z: 0 },
            //     { x: 0, y: 0, z:  0.3 }, 'pink');
            // this.bodys.push(staticB);

            // const cubeBody = body(this.scene, this.world, 'dynamic', 'cube',
            //     { hx: 2.5, hy: 2.5, hz: 2.5 }, { x: -10, y: 2.5, z: 0 },
            //     { x: 0, y: 0.0, z: 0.0 }, 'orange');
            // this.bodys.push(cubeBody);

            // const sphereBody = body(this.scene, this.world, 'dynamic', 'sphere',
            //     { radius: 0.7 }, { x: 4, y: 15, z: 2 },
            //     { x: 0, y: 1, z: 0 }, 'blue');
            // this.bodys.push(sphereBody);

            const sphereBody2 = body(this.scene, this.world, 'dynamic', 'sphere',
                { radius: 0.7 }, { x: 0, y: 15, z: 0 },
                { x: 0, y: 1, z: 0 }, 'red');
            this.bodys.push(sphereBody2);

            const cylinderBody = body(this.scene, this.world, 'dynamic', 'cylinder',
                { hh: 1.0, radius: 0.7 }, { x: -7, y: 15, z: 8 },
                { x: 0, y: 1, z: 0 }, 'green');
            this.bodys.push(cylinderBody);

            const coneBody = body(this.scene, this.world, 'dynamic', 'cone',
                { hh: 1.0, radius: 1 }, { x: 7, y: 15, z: -8 },
                { x: 0, y: 1, z: 0 }, 'purple');
            this.bodys.push(coneBody);
            
             // RIGID BODY
            let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(-1, 3, 1)
            let rigidBody = this.world.createRigidBody(bodyDesc);
            let dynamicCollider = RAPIER.ColliderDesc.ball(CONTROLLER_BODY_RADIUS);
            this.world.createCollider(dynamicCollider, rigidBody.handle);
    
            this.characterControls = new CharacterControls(this.model, mixer, 
                animationsMap, this.experience.camera.controls, 
                this.experience.camera.instance,  'Idle',
                new RAPIER.Ray( 
                    { x: 0, y: 0, z: 0 },
                    { x: 0, y: -1, z: 0},

                ), 
               rigidBody,
               new RAPIER.Ray( 
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 0, z: 1},

            ), )
        })
        // Use the RAPIER module here.
    

       

        // this._controls = new BasicCharacterController(this.model, this.animations);

        const gltfAnimations = this.resource.animations;
        const mixer = new THREE.AnimationMixer(this.model);
        const animationsMap = new Map()
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })

        // this.characterControls = new CharacterControls(this.model, mixer, animationsMap, this.experience.camera.controls, this.experience.camera.instance,  'Idle')
        
        // CONTROL KEYS
        this.keysPressed = {  }
        document.addEventListener('keydown', (event) => {
            if (event.shiftKey && characterControls) {
                characterControls.switchRunToggle()
            } else {
                (this.keysPressed )[event.key.toLowerCase()] = true
            }
        }, false);
        document.addEventListener('keyup', (event) => {
            (this.keysPressed )[event.key.toLowerCase()] = false
        }, false);

        /////
    }
    setModel()
    {
        // var characterControls
        this.model = this.resource.scene
        this.model.scale.set(1, 1, 1)
        this.model.position.set(0, .2,0)
        this.scene.add(this.model)

        this.model.traverse((child) =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.castShadow = true
            }
        })
   
    }

    setAnimation()
    {
        this.animation = {}
        
        // Mixer
        this.mixer = new THREE.AnimationMixer(this.model)


        this.animations = {
            'dance': {
                clip: this.resource.animations[0],
                action: this.mixer.clipAction(this.resource.animations[0])
            },
            'idle': {
                clip: this.resource.animations[0],
                action: this.mixer.clipAction(this.resource.animations[0])
            },
            'run': {
                clip: this.resource.animations[0],
                action: this.mixer.clipAction(this.resource.animations[0])
            },
            'walk': {
                clip: this.resource.animations[0],
                action: this.mixer.clipAction(this.resource.animations[1])
            }
        }

    }


    update()
    {
        // this.mixer.update(this.time.delta * 0.001)
        // if (this._controls) {
        //     this._controls.Update(this.time.delta * 0.001);
        // }
        // if (this.characterControls) {
        //     this.characterControls.update(this.time.delta * 0.001, this.keysPressed);
        // }

        if (this.characterControls) {
            this.characterControls.update(this.world, this.time.delta * 0.001, this.keysPressed);
        }

        // Step the simulation forward.  

        if(this.world !== undefined) {

            this.world.step();
            // update 3d world with physical world
            this.bodys.forEach(body => {
                let position = body.rigid.translation();
                let rotation = body.rigid.rotation();

                body.mesh.position.x = position.x
                body.mesh.position.y = position.y
                body.mesh.position.z = position.z

                body.mesh.setRotationFromQuaternion(
                    new THREE.Quaternion(rotation.x,
                        rotation.y,
                        rotation.z,
                        rotation.w));
            });
        }  
         
      
        

      
    }
}