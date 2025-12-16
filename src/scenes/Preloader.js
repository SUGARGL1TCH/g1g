import Phaser from 'phaser';
import jsyaml from 'js-yaml';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        this.load.text('storyData', '/structure.yaml');

        // Create a simple loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        const yamlText = this.cache.text.get('storyData');
        if (!yamlText) {
            console.error('Failed to load structure.yaml');
            return;
        }

        try {
            const story = jsyaml.load(yamlText);
            this.loadAssetsForStory(story);
        } catch (e) {
            console.error('Error parsing YAML:', e);
        }
    }

    loadAssetsForStory(story) {
        // We are now in 'create', but we want to load more files.
        // Phaser 3 allows starting a new loader run.

        // 1. Listen for the second complete
        this.load.on('complete', () => {
            this.scene.start('VNScene', { story });
        });

        const scenes = story.scenes;
        let assetsFound = 0;

        for (const key in scenes) {
            const sceneData = scenes[key];
            if (sceneData.background) {
                // Assume backgrounds are in /assets/backgrounds/
                // Use the filename as the key
                const bgName = sceneData.background;
                const bgKey = bgName;
                // Check if already in cache or queue
                if (!this.textures.exists(bgKey)) {
                    this.load.image(bgKey, `/assets/backgrounds/${bgName}`);
                    assetsFound++;
                }
            }
        }

        // Load Character Images
        if (story.characters) {
            for (const charKey in story.characters) {
                const charData = story.characters[charKey];
                if (charData.image) {
                    const imgKey = charKey; // Use character ID as texture key
                    if (!this.textures.exists(imgKey)) {
                        this.load.image(imgKey, charData.image);
                        assetsFound++;
                    }
                }
            }
        }

        if (assetsFound > 0) {
            this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, 'Loading Assets...', { font: '16px Arial', fill: '#ffffff' }).setOrigin(0.5);
            this.load.start();
        } else {
            this.scene.start('VNScene', { story });
        }
    }
}
