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

const puntajeString = "Puntaje : ";

let jugador;
let virus;
let balas;
let tiempoBala = 0;
let cursores;
let botonDisparo;
let explosiones;
let fondo;
let puntaje = 0;
let puntajeTexto;
let vidas;
let balaVirus;
let balasVirus;
let tiempoBalaVirus = 0;
let estadoTexto;
let virusVivos = [];

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  // El fondo de estrellas con movimiento
  fondo = game.add.tileSprite(
    0,
    0,
    game.world.width,
    game.world.height,
    "starfield"
  );

  //  Our bullet group
  balas = game.add.group();
  balas.enableBody = true;
  balas.physicsBodyType = Phaser.Physics.ARCADE;
  balas.createMultiple(30, "bullet");
  balas.setAll("anchor.x", 0.5);
  balas.setAll("anchor.y", 1);
  balas.setAll("outOfBoundsKill", true);
  balas.setAll("checkWorldBounds", true);

  // The enemy's bullets
  balasVirus = game.add.group();
  balasVirus.enableBody = true;
  balasVirus.physicsBodyType = Phaser.Physics.ARCADE;
  balasVirus.createMultiple(30, "enemyBullet");
  balasVirus.setAll("anchor.x", 0.5);
  balasVirus.setAll("anchor.y", 1);
  balasVirus.setAll("outOfBoundsKill", true);
  balasVirus.setAll("checkWorldBounds", true);

  //  The hero!
  jugador = game.add.sprite(game.world.centerX, game.world.height - 50, "ship");
  jugador.anchor.setTo(0.5, 0.5);
  game.physics.enable(jugador, Phaser.Physics.ARCADE);

  //  The baddies!
  virus = game.add.group();
  virus.enableBody = true;
  virus.physicsBodyType = Phaser.Physics.ARCADE;

  crearVirus();

  //  The score
  puntajeTexto = game.add.text(10, 10, puntajeString + puntaje, {
    font: "34px Arial",
    fill: "#fff",
  });

  //  Lives
  vidas = game.add.group();
  game.add.text(game.world.width - 220, 10, "Vidas : ", {
    font: "34px Arial",
    fill: "#fff",
  });

  //  Text
  estadoTexto = game.add.text(game.world.centerX, game.world.centerY, " ", {
    font: "70px Arial",
    fill: "#fff",
  });
  estadoTexto.anchor.setTo(0.5, 0.5);
  estadoTexto.visible = false;

  for (let i = 3; i > 0; i--) {
    let x = game.world.width - 120 + 30 * i;
    let ship = vidas.create(x, 30, "syringe");
    ship.anchor.setTo(0.5, 0.5);
  }

  //  An explosion pool
  explosiones = game.add.group();
  explosiones.createMultiple(30, "kaboom");
  explosiones.forEach(setupInvader, this);

  //  And some controls to play the game with
  cursores = game.input.keyboard.createCursorKeys();
  botonDisparo = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function crearVirus() {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 10; x++) {
      let alien = virus.create(x * 48, y * 50, "invader");
      alien.anchor.setTo(0.5, 0.5);
      alien.animations.add("fly", [0, 1, 2, 3], 20, true);
      alien.play("fly");
      alien.body.moves = false;
    }
  }

  virus.x = 100;
  virus.y = 100;

  //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
  let tween = game.add
    .tween(virus)
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
  virus.y += 10;
}

function update() {
  //  Scroll the background
  fondo.tilePosition.y += 2;

  if (jugador.alive) {
    //  Reset the player, then check for movement keys
    jugador.body.velocity.setTo(0, 0);

    if (cursores.left.isDown) {
      jugador.body.velocity.x = -200;
    } else if (cursores.right.isDown) {
      jugador.body.velocity.x = 200;
    }

    //  Firing?
    if (botonDisparo.isDown) {
      fireBullet();
    }

    if (game.time.now > tiempoBalaVirus) {
      enemyFires();
    }

    //  Run collision
    game.physics.arcade.overlap(balas, virus, collisionHandler, null, this);
    game.physics.arcade.overlap(
      balasVirus,
      jugador,
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
  puntaje += 20;
  puntajeTexto.text = puntajeString + puntaje;

  //  And create an explosion :)
  let explosion = explosiones.getFirstExists(false);
  explosion.reset(alien.body.x, alien.body.y);
  explosion.play("kaboom", 30, false, true);

  if (virus.countLiving() == 0) {
    puntaje += 1000;
    puntajeTexto.text = puntajeString + puntaje;

    balasVirus.callAll("kill", this);
    estadoTexto.text = "Ganaste!\nHaz click para reiniciar";
    estadoTexto.visible = true;

    //the "click to restart" handler
    game.input.onTap.addOnce(restart, this);
  }
}

function enemyHitsPlayer(player, bullet) {
  bullet.kill();

  const live = vidas.getFirstAlive();

  if (live) {
    live.kill();
  }

  //  And create an explosion :)
  let explosion = explosiones.getFirstExists(false);
  explosion.reset(player.body.x, player.body.y);
  explosion.play("kaboom", 30, false, true);

  // When the player dies
  if (vidas.countLiving() < 1) {
    player.kill();

    balasVirus.callAll("kill");
    estadoTexto.text = "Perdiste!\nHaz click para reiniciar";
    estadoTexto.visible = true;

    //the "click to restart" handler
    game.input.onTap.addOnce(restart, this);
  }
}

function enemyFires() {
  //  Grab the first bullet we can from the pool
  balaVirus = balasVirus.getFirstExists(false);

  virusVivos.length = 0;

  virus.forEachAlive(function (_virus) {
    // put every living enemy in an array
    virusVivos.push(_virus);
  });

  if (balaVirus && virusVivos.length > 0) {
    let random = game.rnd.integerInRange(0, virusVivos.length - 1);

    // randomly select one of them
    let shooter = virusVivos[random];
    // And fire the bullet from this enemy
    balaVirus.reset(shooter.body.x, shooter.body.y);

    game.physics.arcade.moveToObject(balaVirus, jugador, 120);
    tiempoBalaVirus = game.time.now + 2000;
  }
}

function fireBullet() {
  //  To avoid them being allowed to fire too fast we set a time limit
  if (game.time.now > tiempoBala) {
    //  Grab the first bullet we can from the pool
    bullet = balas.getFirstExists(false);

    if (bullet) {
      //  And fire it
      bullet.reset(jugador.x, jugador.y + 8);
      bullet.body.velocity.y = -400;
      tiempoBala = game.time.now + 200;
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
  vidas.callAll("revive");
  //  And brings the aliens back from the dead :)
  virus.removeAll();
  crearVirus();

  //revives the player
  jugador.revive();
  //hides the text
  estadoTexto.visible = false;
}
