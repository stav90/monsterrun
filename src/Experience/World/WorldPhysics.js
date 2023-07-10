import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Physics
{
    constructor()
    {
        this.experience = new Experience()
        this.time = this.experience.time

        this.setPhysics()
    }
    setPhysics() {
        Ammo().then( function( AmmoLib ) {
            Ammo = AmmoLib;
            init();
            // animate();
        } );
        
        const init = () =>{
            this.collisionConfiguration_ = new Ammo.btDefaultCollisionConfiguration();
            this.dispatcher_ = new Ammo.btCollisionDispatcher(this.collisionConfiguration_);
            this.broadphase_ = new Ammo.btDbvtBroadphase();
            this.solver_ = new Ammo.btSequentialImpulseConstraintSolver();
            this.physicsWorld_ = new Ammo.btDiscreteDynamicsWorld(
            this.dispatcher_, this.broadphase_, this.solver_, this.collisionConfiguration_);
            this.physicsWorld_.setGravity(new Ammo.btVector3(0, -100, 0));
        }
        
    }
    

    update()
    {
        // this.physicsWorld_.stepSimulation(this.time.delta * 0.001, 10);
    }
}