import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { VNScene } from './scenes/VNScene';

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 576,
    parent: 'app',
    scene: [Preloader, VNScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

export default new Phaser.Game(config);
