/* global Phaser */

// Created by: Peter Zerbinos
// Created on: June 2025
// This is the Game Scene

class GameScene extends Phaser.Scene {
  constructor () {
    super({ key: 'gameScene' })

    // Main game objects
    this.dino = null
    this.obstacles = null
    this.clouds = null

    // UI and score
    this.score = 0
    this.highScore = 0
    this.lastPointSoundScore = 0
    this.lastModeSwitchScore = 0
    this.scoreText = null
    this.highScoreText = null
    this.scoreTextStyle = { font: '65px Arial', fill: '#ffffff', align: 'center' }
    this.gameOverTextStyle = { font: '65px Arial', fill: '#ff0000', align: 'center' }

    // Game state
    this.gameOver = false
    this.gameOverText = null
    this.isDarkMode = false

    // Animation and timers
    this.dinoFrame = 0
    this.dinoAnimTimer = null
    this.obstacleTimer = null
    this.spawnCloudTimer = null
  }

  init () {
    this.cameras.main.setBackgroundColor('#000000')
  }

  preload () {
    // Load all assets (images and sounds) needed for the game
    this.load.image('running1', 'assets/running1.png')
    this.load.image('running2', 'assets/running2.png')
    this.load.image('oneCactus', 'assets/oneCactus.png')
    this.load.image('multiCactus', 'assets/multiCactus.png')
    this.load.audio('jump', 'assets/jump.wav')
    this.load.audio('point', 'assets/point.wav')
    this.load.audio('die', 'assets/die.wav')
    this.load.image('cloud', 'assets/cloud.png')
  }

  create () {
    // Always start in light mode
    this.isDarkMode = false
    this.lastModeSwitchScore = 0
    this.cameras.main.setBackgroundColor('#ffffff')
    this.scoreTextStyle = { font: '65px Arial', fill: '#000000', align: 'center' }
    this.gameOverTextStyle = { font: '65px Arial', fill: '#ff0000', align: 'center' }

    // Set up dino at ground level and running animation
    const groundY = this.scale.height - 10
    this.dino = this.physics.add.sprite(150, groundY, 'running1')
    this.dino.setOrigin(0.5, 1)
    this.dino.setCollideWorldBounds(true)
    this.dino.setGravityY(2000)
    // Make hitbox smaller for more forgiving collisions
    this.dino.body.setSize(this.dino.width * 0.6, this.dino.height * 0.7)
    this.dino.body.setOffset(this.dino.width * 0.2, this.dino.height * 0.3)

    // Dino running animation timer
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

    // Groups for obstacles and clouds
    this.obstacles = this.physics.add.group()
    this.clouds = this.add.group()

    // Reset score and game state
    this.score = 0
    this.gameOver = false
    this.lastPointSoundScore = 0

    // Display score and high score at top right
    this.scoreText = this.add.text(this.scale.width - 30, 30, 'Score: 0', this.scoreTextStyle).setOrigin(1, 0)
    this.highScoreText = this.add.text(this.scale.width - 30, 110, 'High: ' + Math.floor(this.highScore), this.scoreTextStyle).setOrigin(1, 0)

    // End game if dino collides with obstacle
    this.physics.add.collider(this.dino, this.obstacles, this.gameOverSequence, null, this)

    // Listen for jump input
    this.input.keyboard.on('keydown-SPACE', this.jump, this)

    // Start obstacle spawning
    this.scheduleNextObstacle()

    // Start cloud spawning
    this.spawnCloudTimer = this.time.addEvent({
      delay: Phaser.Math.Between(1200, 2500),
      callback: this.spawnCloud,
      callbackScope: this,
      loop: true
    })
  }

  update () {
    if (this.gameOver) return

    // Snap dino to ground if falling below
    const groundY = this.scale.height - 10
    if (this.dino.y > groundY && this.dino.body.velocity.y >= 0) {
      this.dino.y = groundY
      this.dino.setVelocityY(0)
    }

    // Remove obstacles that have left the screen
    this.obstacles.children.iterate(obstacle => {
      if (obstacle && obstacle.x < -50) {
        obstacle.destroy()
      }
    })

    // Score increases as player survives
    this.score += 1
    const displayScore = Math.floor(this.score / 10)
    this.scoreText.setText('Score: ' + displayScore)

    // Update high score if needed
    if (displayScore > this.highScore) {
      this.highScore = displayScore
      this.highScoreText.setText('High: ' + this.highScore)
    }

    // Play point sound every 50 points (only once per threshold)
    if (displayScore > 0 && displayScore % 50 === 0 && this.lastPointSoundScore !== displayScore) {
      this.sound.play('point')
      this.lastPointSoundScore = displayScore
    }

    // Alternate background and text color every 100 points, with fade effect
    if (displayScore > 0 && displayScore % 100 === 0 && this.lastModeSwitchScore !== displayScore) {
      this.isDarkMode = !this.isDarkMode
      this.lastModeSwitchScore = displayScore
      // Fade out, then change background and text color, then fade in
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.isDarkMode) {
          this.cameras.main.setBackgroundColor('#000000')
          this.scoreText.setStyle({ fill: '#ffffff' })
          this.highScoreText.setStyle({ fill: '#ffffff' })
        } else {
          this.cameras.main.setBackgroundColor('#ffffff')
          this.scoreText.setStyle({ fill: '#000000' })
          this.highScoreText.setStyle({ fill: '#000000' })
        }
        this.cameras.main.fadeIn(500, 0, 0, 0)
      })
    }

    // Move clouds and destroy if off screen
    this.clouds.children.iterate(cloud => {
      if (cloud) {
        cloud.x += cloud.speed
        if (cloud.x < -cloud.width) {
          cloud.destroy()
        }
      }
    })
  }

  jump () {
    // Only jump if dino is on the ground
    const groundY = this.scale.height - 10
    if (this.dino.y >= groundY && this.dino.body.velocity.y === 0) {
      this.dino.setVelocityY(-900)
      this.sound.play('jump')
    }
  }

  spawnObstacle () {
    // Spawn a cactus at the ground, random type
    const groundY = this.scale.height - 10
    const cactusType = Phaser.Math.Between(0, 1) === 0 ? 'oneCactus' : 'multiCactus'
    const obstacle = this.obstacles.create(2000, groundY, cactusType)
    obstacle.setOrigin(0.5, 1)
    obstacle.setVelocityX(-500)
    obstacle.setImmovable(true)
    obstacle.body.allowGravity = false
    this.scheduleNextObstacle()
  }

  scheduleNextObstacle () {
    // Schedule next obstacle at a random interval
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

  gameOverSequence () {
    // Handle game over: stop game, show message, allow restart
    this.gameOver = true
    this.physics.pause()
    this.dino.setTint(0xff0000)
    this.sound.play('die')
    if (this.dinoAnimTimer) {
      this.dinoAnimTimer.remove(false)
      this.dinoAnimTimer = null
    }
    this.gameOverText = this.add.text(1920 / 2, 1080 / 2, 'Game Over!\nClick to play again.', this.gameOverTextStyle).setOrigin(0.5)
    this.gameOverText.setInteractive({ useHandCursor: true })
    this.gameOverText.on('pointerdown', () => this.scene.restart())
  }

  spawnCloud () {
    // Spawn a cloud at a random height and speed
    const y = Phaser.Math.Between(50, this.scale.height / 2)
    const cloud = this.add.image(this.scale.width + 100, y, 'cloud')
    cloud.setDepth(-1)
    cloud.speed = -Phaser.Math.Between(1, 3) // slow speed
    this.clouds.add(cloud)
    // Randomize next spawn
    this.spawnCloudTimer.reset({
      delay: Phaser.Math.Between(1200, 2500),
      callback: this.spawnCloud,
      callbackScope: this,
      loop: true
    })
  }
}

export default GameScene
