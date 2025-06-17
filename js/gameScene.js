/* global Phaser */

// Created by: Peter Zerbinos
// Created on: June 2025
// This is the Game Scene

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'gameScene' })

    this.dino = null
    this.obstacles = null
    this.score = 0
    this.scoreText = null
    this.gameOver = false
    this.gameOverText = null
    this.scoreTextStyle = { font: '65px Arial', fill: '#ffffff', align: 'center' }
    this.gameOverTextStyle = { font: '65px Arial', fill: '#ff0000', align: 'center' }
    this.obstacleTimer = null
    this.dinoFrame = 0
    this.dinoAnimTimer = null
  }

  init() {
    this.cameras.main.setBackgroundColor('#ffffff')
  }

  preload() {
    this.load.image('running1', 'assets/running1.png')
    this.load.image('running2', 'assets/running2.png')
    this.load.image('oneCactus', 'assets/oneCactus.png')
    this.load.image('multiCactus', 'assets/multiCactus.png')
  }

  create() {
    const groundY = this.scale.height - 10
    this.dino = this.physics.add.sprite(150, groundY, 'running1')
    this.dino.setOrigin(0.5, 1)
    this.dino.setCollideWorldBounds(true)
    this.dino.setGravityY(2000)
    this.dino.body.setSize(this.dino.width, this.dino.height)
    this.dino.body.setOffset(0, 0)

    this.dinoFrame = 0
    if (this.dinoAnimTimer) {
      this.dinoAnimTimer.remove(false)
    }
    this.dinoAnimTimer = this.time.addEvent({
      delay: 120,
      callback: () => {
        this.dinoFrame = 1 - this.dinoFrame
        this.dino.setTexture(this.dinoFrame === 0 ? 'running1' : 'running2')
      },
      callbackScope: this,
      loop: true
    })

    this.obstacles = this.physics.add.group()
    this.score = 0
    this.scoreText = this.add.text(10, 10, 'Score: 0', this.scoreTextStyle)
    this.physics.add.collider(this.dino, this.obstacles, this.gameOverSequence, null, this)
    this.input.keyboard.on('keydown-SPACE', this.jump, this)
    this.scheduleNextObstacle()
  }

  update() {
    if (this.gameOver) return

    const groundY = this.scale.height - 10
    if (this.dino.y > groundY) {
      this.dino.y = groundY
      this.dino.setVelocityY(0)
    }

    this.obstacles.children.iterate(obstacle => {
      if (obstacle && obstacle.x < -50) {
        obstacle.destroy()
      }
    })

    this.score += 1
    this.scoreText.setText('Score: ' + Math.floor(this.score / 10))
  }

  jump() {
    const groundY = this.scale.height - 10
    if (this.dino.y >= groundY && this.dino.body.velocity.y === 0) {
      this.dino.setVelocityY(-900)
    }
  }

  spawnObstacle() {
    const groundY = this.scale.height - 10
    const cactusType = Phaser.Math.Between(0, 1) === 0 ? 'oneCactus' : 'multiCactus'
    const obstacle = this.obstacles.create(2000, groundY, cactusType)
    obstacle.setOrigin(0.5, 1)
    obstacle.setVelocityX(-500)
    obstacle.setImmovable(true)
    obstacle.body.allowGravity = false
    this.scheduleNextObstacle()
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(700, 1800)
    if (this.obstacleTimer) {
      this.obstacleTimer.remove(false)
    }
    this.obstacleTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: false
    })
  }

  gameOverSequence() {
    this.gameOver = true
    this.physics.pause()
    this.dino.setTint(0xff0000)
    if (this.dinoAnimTimer) {
      this.dinoAnimTimer.remove(false)
      this.dinoAnimTimer = null
    }
    this.gameOverText = this.add.text(1920 / 2, 1080 / 2, 'Game Over!\nClick to play again.', this.gameOverTextStyle).setOrigin(0.5)
    this.gameOverText.setInteractive({ useHandCursor: true })
    this.gameOverText.on('pointerdown', () => this.scene.restart())
    this.score = 0
  }
}

export default GameScene
