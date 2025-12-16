import Phaser from 'phaser';

export class VNScene extends Phaser.Scene {
    constructor() {
        super('VNScene');
    }

    init(data) {
        this.story = data.story;
        this.currentSceneId = 'start';
        this.currentDialogueIndex = 0;
        this.isWaitingForChoice = false;
    }

    create() {
        // 1. Background Layer
        this.bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, '').setOrigin(0.5);
        // Scale bg to cover
        this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // 2. Character Layer
        // Positioned at the center-bottom, initially invisible
        this.charSprite = this.add.image(this.cameras.main.centerX, this.cameras.main.height, '').setOrigin(0.5, 1);
        this.charSprite.setVisible(false);

        // 3. UI Layer
        this.createUI();

        // 4. Start Story
        this.loadScene(this.currentSceneId);

        // Input
        this.input.on('pointerdown', this.handleInput, this);
    }

    createUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Dialogue Box
        this.dialogueBox = this.add.graphics();
        this.dialogueBox.fillStyle(0x000000, 0.7);
        this.dialogueBox.fillRect(20, height - 200, width - 40, 180);

        // Character Name Text
        this.nameText = this.add.text(40, height - 190, '', {
            font: 'bold 24px Arial',
            fill: '#ffd700',
        });

        // Dialogue Text
        this.mainText = this.add.text(40, height - 150, '', {
            font: '20px Arial',
            fill: '#ffffff',
            wordWrap: { width: width - 80 }
        });

        // Choice Container
        this.choiceContainer = this.add.container(0, 0);
    }

    loadScene(sceneId) {
        const sceneData = this.story.scenes[sceneId];
        if (!sceneData) {
            console.error(`Scene ${sceneId} not found!`);
            return;
        }

        this.currentSceneData = sceneData;
        this.currentDialogueIndex = 0;
        this.isWaitingForChoice = false;

        // Update Background
        if (sceneData.background) {
            this.bg.setTexture(sceneData.background);
            // Rescale in case texture changed
            this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        }

        // Clear previous choices
        this.choiceContainer.removeAll(true);

        this.updateDialogue();
    }

    updateDialogue() {
        const dialogueList = this.currentSceneData.dialogue;

        // Check if we reached the end of dialogue
        if (this.currentDialogueIndex >= dialogueList.length) {
            this.onDialogueEnd();
            return;
        }

        const line = dialogueList[this.currentDialogueIndex];

        // Get Character Name
        const charId = line.character;
        const charData = this.story.characters[charId];
        const charName = charData ? charData.name : charId;

        this.nameText.setText(charName);
        this.mainText.setText(line.text);

        // Update Character Sprite
        // If the narrator is speaking, maybe hide the sprite? 
        // Or if the character speaking has an image, show it.
        if (charData && charData.image) {
            this.charSprite.setTexture(charId);
            this.charSprite.setVisible(true);

            // Optional: rudimentary scaling if it's too big
            // Ideally we'd have standard sizes, but let's constrain height to 80% screen
            const maxHeight = this.cameras.main.height * 0.8;
            if (this.charSprite.height > maxHeight) {
                const scale = maxHeight / this.charSprite.height;
                this.charSprite.setScale(scale);
            } else {
                this.charSprite.setScale(1);
            }
        } else {
            // If narrator or no image, hide sprite? 
            // For now, let's only hide if it's explicitly 'narrator' 
            if (charId === 'narrator') {
                this.charSprite.setVisible(false);
            }
            // If it's a character without an image, we might keep the previous sprite 
            // or hide it. Let's hide it to be safe.
            else {
                this.charSprite.setVisible(false);
            }
        }
    }

    handleInput() {
        if (this.isWaitingForChoice) return;

        this.currentDialogueIndex++;
        this.updateDialogue();
    }

    onDialogueEnd() {
        // Check for choices or goto
        if (this.currentSceneData.choices && this.currentSceneData.choices.length > 0) {
            this.showChoices();
        } else if (this.currentSceneData.goto) {
            this.currentSceneId = this.currentSceneData.goto;
            this.loadScene(this.currentSceneId);
        } else {
            // End of game or implicit end (as seen in ending_friendship)
            console.log("End of scene/game");
            // Could show a "Return to Title" button?
        }
    }

    showChoices() {
        this.isWaitingForChoice = true;
        this.mainText.setText("");
        this.nameText.setText("");

        const choices = this.currentSceneData.choices;
        const width = this.cameras.main.width;
        let yPos = this.cameras.main.centerY - (choices.length * 40);

        choices.forEach((choice) => {
            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x444444, 0.9);
            btnBg.fillRoundedRect(width / 4, yPos, width / 2, 50, 10);

            const btnText = this.add.text(width / 2, yPos + 25, choice.text, {
                font: '20px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);

            // Hit area
            const zone = this.add.zone(width / 2, yPos + 25, width / 2, 50).setInteractive({ cursor: 'pointer' });

            zone.on('pointerover', () => {
                btnText.setColor('#ffff00');
                btnBg.clear();
                btnBg.fillStyle(0x666666, 0.9);
                btnBg.fillRoundedRect(width / 4, yPos, width / 2, 50, 10);
            });

            zone.on('pointerout', () => {
                btnText.setColor('#ffffff');
                btnBg.clear();
                btnBg.fillStyle(0x444444, 0.9);
                btnBg.fillRoundedRect(width / 4, yPos, width / 2, 50, 10);
            });

            zone.on('pointerdown', () => {
                this.currentSceneId = choice.goto;
                this.loadScene(this.currentSceneId);
            });

            this.choiceContainer.add([btnBg, btnText, zone]);
            yPos += 70;
        });
    }
}
