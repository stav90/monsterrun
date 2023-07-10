import Experience from '../Experience.js'
import Environment from './Environment.js'
import Floor from './Floor.js'
import Fox from './Fox.js'

import MIKDude from './MIKDude'
// import FallingCube from './FallingCube.js'
// import Physics from './WorldPhysics'
// import AnimatedCharacter from './AnimatedCharacter'
// import RapierExample from './RapierExample'
export default class World
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () =>
        {
            // Setup
            // this.floor = new Floor()
            // this.physics = new Physics()
            // this.fallingCube = new FallingCube(this.physics)
            this.MIKDude = new MIKDude()
            this.environment = new Environment()
        })
        
    }

    update()
    {
        if(this.MIKDude)
            this.MIKDude.update()
        if(this.fallingCube)
            this.fallingCube.update()
    }
}