const game = new Phaser.Game(800, 600, Phaser.AUTO, "corona-invasores", {
  preload: preload,
  create: create,
  update: update,
  render: render,
});

function preload() {
  game.load.image("syringe", "assets/syringe-32x32.png");
  game.load.image("bullet", "assets/pill-25x25.png");
  game.load.image("enemyBullet", "assets/microbe-15x15.png");
  game.load.image("invader", "assets/microbe-32x32.png");
  game.load.image("ship", "assets/hospital-32x32.png");
  game.load.image("kaboom", "assets/collision-32x32.png");
  game.load.image("starfield", "assets/starfield.png");
}

let player;
let aliens;
let bullets;
let bulletTime = 0;
let cursors;
let fireButton;
let explosions;
let starfield;
let score = 0;
let scoreString = "";
let scoreText;
let lives;
let enemyBullet;
let enemyBullets;
let firingTimer = 0;
let stateText;
let livingEnemies = [];

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  //  The scrolling starfield background
  starfield = game.add.tileSprite(
    0,
    0,
    game.world.width,
    game.world.height,
    "starfield"
  );

  //  Our bullet group
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, "bullet");
  bullets.setAll("anchor.x", 0.5);
  bullets.setAll("anchor.y", 1);
  bullets.setAll("outOfBoundsKill", true);
  bullets.setAll("checkWorldBounds", true);

  // The enemy's bullets
  enemyBullets = game.add.group();
  enemyBullets.enableBody = true;
  enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
  enemyBullets.createMultiple(30, "enemyBullet");
  enemyBullets.setAll("anchor.x", 0.5);
  enemyBullets.setAll("anchor.y", 1);
  enemyBullets.setAll("outOfBoundsKill", true);
  enemyBullets.setAll("checkWorldBounds", true);

  //  The hero!
  player = game.add.sprite(game.world.centerX, game.world.height - 50, "ship");
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);

  //  The baddies!
  aliens = game.add.group();
  aliens.enableBody = true;
  aliens.physicsBodyType = Phaser.Physics.ARCADE;

  createAliens();

  //  The score
  scoreString = "Puntaje : ";
  scoreText = game.add.text(10, 10, scoreString + score, {
    font: "34px Arial",
    fill: "#fff",
  });

  //  Lives
  lives = game.add.group();
  game.add.text(game.world.width - 220, 10, "Vidas : ", {
    font: "34px Arial",
    fill: "#fff",
  });

  //  Text
  stateText = game.add.text(game.world.centerX, game.world.centerY, " ", {
    font: "70px Arial",
    fill: "#fff",
  });
  stateText.anchor.setTo(0.5, 0.5);
  stateText.visible = false;

  for (let i = 3; i > 0; i--) {
    let x = game.world.width - 120 + 30 * i;
    let ship = lives.create(x, 30, "syringe");
    ship.anchor.setTo(0.5, 0.5);
  }

  //  An explosion pool
  explosions = game.add.group();
  explosions.createMultiple(30, "kaboom");
  explosions.forEach(setupInvader, this);

  //  And some controls to play the game with
  cursors = game.input.keyboard.createCursorKeys();
  fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function createAliens() {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 10; x++) {
      let alien = aliens.create(x * 48, y * 50, "invader");
      alien.anchor.setTo(0.5, 0.5);
      alien.animations.add("fly", [0, 1, 2, 3], 20, true);
      alien.play("fly");
      alien.body.moves = false;
    }
  }

  aliens.x = 100;
  aliens.y = 100;

  //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
  let tween = game.add
    .tween(aliens)
    .to({ x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

  //  When the tween loops it calls descend
  tween.onLoop.add(descend, this);
}

function setupInvader(invader) {
  invader.anchor.x = 0;
  invader.anchor.y = 0;
  invader.animations.add("kaboom");
}

function descend() {
  aliens.y += 10;
}

function update() {
  //  Scroll the background
  starfield.tilePosition.y += 2;

  if (player.alive) {
    //  Reset the player, then check for movement keys
    player.body.velocity.setTo(0, 0);

    if (cursors.left.isDown) {
      player.body.velocity.x = -200;
    } else if (cursors.right.isDown) {
      player.body.velocity.x = 200;
    }

    //  Firing?
    if (fireButton.isDown) {
      fireBullet();
    }

    if (game.time.now > firingTimer) {
      enemyFires();
    }

    //  Run collision
    game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);
    game.physics.arcade.overlap(
      enemyBullets,
      player,
      enemyHitsPlayer,
      null,
      this
    );
  }
}

function render() {
  // for (let i = 0; i < aliens.length; i++) {
  //   game.debug.body(aliens.children[i]);
  // }
  // for (let i = 0; i < enemyBullets.length; i++) {
  //   game.debug.body(enemyBullets.children[i]);
  // }
  // game.debug.body(player);
  // game.debug.body(bullets);
}

function collisionHandler(bullet, alien) {
  //  When a bullet hits an alien we kill them both
  bullet.kill();
  alien.kill();

  //  Increase the score
  score += 20;
  scoreText.text = scoreString + score;

  //  And create an explosion :)
  let explosion = explosions.getFirstExists(false);
  explosion.reset(alien.body.x, alien.body.y);
  explosion.play("kaboom", 30, false, true);

  if (aliens.countLiving() == 0) {
    score += 1000;
    scoreText.text = scoreString + score;

    enemyBullets.callAll("kill", this);
    stateText.text = "Ganaste!\nHaz click para reiniciar";
    stateText.visible = true;

    //the "click to restart" handler
    game.input.onTap.addOnce(restart, this);
  }
}

function enemyHitsPlayer(player, bullet) {
  bullet.kill();

  const live = lives.getFirstAlive();

  if (live) {
    live.kill();
  }

  //  And create an explosion :)
  let explosion = explosions.getFirstExists(false);
  explosion.reset(player.body.x, player.body.y);
  explosion.play("kaboom", 30, false, true);

  // When the player dies
  if (lives.countLiving() < 1) {
    player.kill();

    enemyBullets.callAll("kill");
    stateText.text = "Perdiste!\nHaz click para reiniciar";
    stateText.visible = true;

    //the "click to restart" handler
    game.input.onTap.addOnce(restart, this);
  }
}

function enemyFires() {
  //  Grab the first bullet we can from the pool
  enemyBullet = enemyBullets.getFirstExists(false);

  livingEnemies.length = 0;

  aliens.forEachAlive(function (alien) {
    // put every living enemy in an array
    livingEnemies.push(alien);
  });

  if (enemyBullet && livingEnemies.length > 0) {
    let random = game.rnd.integerInRange(0, livingEnemies.length - 1);

    // randomly select one of them
    let shooter = livingEnemies[random];
    // And fire the bullet from this enemy
    enemyBullet.reset(shooter.body.x, shooter.body.y);

    game.physics.arcade.moveToObject(enemyBullet, player, 120);
    firingTimer = game.time.now + 2000;
  }
}

function fireBullet() {
  //  To avoid them being allowed to fire too fast we set a time limit
  if (game.time.now > bulletTime) {
    //  Grab the first bullet we can from the pool
    bullet = bullets.getFirstExists(false);

    if (bullet) {
      //  And fire it
      bullet.reset(player.x, player.y + 8);
      bullet.body.velocity.y = -400;
      bulletTime = game.time.now + 200;
    }
  }
}

function resetBullet(bullet) {
  //  Called if the bullet goes out of the screen
  bullet.kill();
}

function restart() {
  //  A new level starts

  //resets the life count
  lives.callAll("revive");
  //  And brings the aliens back from the dead :)
  aliens.removeAll();
  createAliens();

  //revives the player
  player.revive();
  //hides the text
  stateText.visible = false;
}
