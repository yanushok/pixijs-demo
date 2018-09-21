
(function (window) {
    class Tile {
        constructor(sprite, stage) {
            this.sprite = sprite;
            this.stage = stage;

            this.playing = false;
        }
    }

    class Stone extends Tile {
        constructor(sprite, stage, fallDownImideately) {
            super(sprite, stage);

            this.speedOfFallDown = 8;
            this.firstTime = true;
            this.fallDownImideately = fallDownImideately;
        }

        goDown() {
            let isHitting = false;
            let childWithHit;
            const enemies = ['THORN_ENEMY', 'SNAKE_ENEMY'];
            const sprites = ['spikes', 'snake'];

            if (this.sprite.x % 100 === 0) {
                if (this.firstTime) {
                    this.sprite.y += 1;
                    this.firstTime = false;
                }

                this.stage.children.forEach(child => {
                    if (child.type && child !== this.sprite) {
                        if (!isHitting && hitTestRectangle(this.sprite, child)) {
                            if (this.fallDownImideately && child.type === 'PLAYER') {
                                return;
                            }
                            
                            isHitting = !isHitting;
                            childWithHit = child;

                            if (this.firstTime) {
                                this.sprite.y -= 1;
                                this.firstTime = false;
                            }
                        }
                    }
                });

                if (isHitting) {
                    const index = enemies.findIndex(emeny => emeny === childWithHit.type);
                    if (index !== -1) {
                        dust.create(
                            childWithHit.x + childWithHit.width / 2,
                            childWithHit.y + childWithHit.height / 2,
                            () => getSprite(sprites[index]),
                            this.stage,
                            10
                        );
                        this.stage.removeChild(childWithHit);
                        this.sprite.y += this.speedOfFallDown;
                    }
                } else {
                    this.sprite.y += this.speedOfFallDown;
                }
            }
        }

        goRight(vx) {
            this.sprite.x += vx;
        }
    }

    let Application = PIXI.Application,
        Container = PIXI.Container,
        Graphics = PIXI.Graphics,
        TextureCache = PIXI.utils.TextureCache,
        Sprite = PIXI.Sprite,
        TilingSprite = PIXI.extras.TilingSprite,
        AnimatedSprite = PIXI.extras.AnimatedSprite,
        Text = PIXI.Text,
        TextStyle = PIXI.TextStyle;

    // Create new pixi app
    let app = new Application({
        width: 1300,
        height: 1000,
        antialiasing: true,
        transparent: false,
        resolution: window.devicePixelRatio,
    });

    let dust = new Dust(PIXI);

    // Append  view of app to body
    document.body.appendChild(app.view);

    // Define some common variables
    let gameScene,
        endScene,
        playerSprite,
        handSprite,
        chestSprite,
        buttonSprite,
        openSprite,
        snakes = [],
        stones = [],
        rotation = 0.03,
        speedOfFade = 0.02,
        rectangle,
        state,
        stoneDown = false,
        openedChest = false,
        firstStep = false,
        secondStep = false,
        thirdStep = false;

    let { getTexture, scaleToWindow, getSprite, hitTestRectangle, contain } = window.utilities;
    getSprite = getSprite.bind(window.utilities);

    let firstScript = [
        { dx: 800, dy: 0, x: 1, y: 0, toX: 950, toY: 150 }
    ];
    let secondScript = [
        { dx: 0, dy: 300, x: 0, y: 1, toX: 950, toY: 450 },
        { dx: -100, dy: 0, x: -1, y: 0, toX: 850, toY: 450 },
        { dx: 0, dy: 100, x: 0, y: 1, toX: 850, toY: 550 },
        { dx: -400, dy: 0, x: -1, y: 0, toX: 450, toY: 550 },
        { dx: 0, dy: -100, x: 0, y: -1, toX: 450, toY: 450 },
    ];

    let thirdScript = [
        { dx: 0, dy: 100, x: 0, y: 1, toX: 450, toY: 550 },
        { dx: 300, dy: 0, x: 1, y: 0, toX: 750, toY: 550 },
        { dx: 0, dy: 200, x: 0, y: 1, toX: 750, toY: 750 },
        { dx: 400, dy: 0, x: 1, y: 0, toX: 1150, toY: 750 },
    ];

    function setup() {
        // Create main container to end scene
        endScene = new Container();
        // endScene.visible = true;
        app.stage.addChild(endScene);

        chestSprite = getSprite('chest');
        chestSprite.scale.set(0.3, 0.3);
        chestSprite.x = app.view.width / 2 - chestSprite.width / 2;
        chestSprite.y = app.view.height / 2 - chestSprite.height / 2 - 200;
        endScene.addChild(chestSprite);

        buttonSprite = getSprite('button');
        buttonSprite.x = app.view.width / 2 - buttonSprite.width / 2;
        buttonSprite.y = app.view.height / 2 - buttonSprite.height / 2 + 200;
        buttonSprite.interactive = true;
        buttonSprite.on('click', openChest);
        buttonSprite.on('tap', openChest);
        endScene.addChild(buttonSprite);

        openSprite = getSprite('alchemist');
        openSprite.interactive = true;
        openSprite.visible = false;
        openSprite.alpha = 0;
        openSprite.x = app.view.width / 2 - openSprite.width / 2;
        openSprite.y = app.view.height / 2 - openSprite.height / 2;
        openSprite.on('click', openGame);
        openSprite.on('tap', openGame);
        endScene.addChild(openSprite);

        // Create main container to main scene
        gameScene = new Container();
        // gameScene.visible = false;
        app.stage.addChild(gameScene);

        // Add background
        let background = new TilingSprite(getTexture('background'), 3000, 3000);
        gameScene.addChild(background);

        const elements = window.levelObject['Block']['Element'];
        // Add map
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i], blockSize = 100;

            switch (el._type) {
                case "GROUND":
                    let groundSprite = getSprite('ground_stage_1');
                    if (el._collisionScript) {
                        groundSprite.name = el._name;
                    }
                    groundSprite.type = el._type;
                    groundSprite.x = el._x * blockSize;
                    groundSprite.y = el._y * blockSize;
                    gameScene.addChild(groundSprite);
                    break;
                case "STONE":
                    let stoneSprite = getSprite('stone');
                    if (el._collision) {
                        stoneSprite.name = 'collisionStone';
                    }
                    if (el._collisionScript) {
                        stoneSprite.name = el._name;
                    }
                    stoneSprite.type = el._type;
                    stoneSprite.x = el._x * blockSize;
                    stoneSprite.y = el._y * blockSize;
                    gameScene.addChild(stoneSprite);
                    stones.push(new Stone(stoneSprite, gameScene, el._name === 'script1stone1'));
                    break;
                case "THORN_ENEMY":
                    let spikesSprite = getSprite('spikes');
                    if (el._collisionScript) {
                        spikesSprite.name = el._name;
                    }
                    spikesSprite.type = el._type;
                    spikesSprite.x = el._x * blockSize;
                    spikesSprite.y = el._y * blockSize;
                    gameScene.addChild(spikesSprite);
                    break;
                case "OBSIDIAN":
                    let obsidianSprite = getSprite('obsidian_stage_1');
                    if (el._collision) {
                        obsidianSprite.name = 'collisionObsidian';
                    }
                    if (el._collisionScript) {
                        obsidianSprite.name = el._name;
                    }
                    obsidianSprite.type = el._type;
                    obsidianSprite.x = el._x * blockSize;
                    obsidianSprite.y = el._y * blockSize;
                    gameScene.addChild(obsidianSprite);
                    break;
                case "GEM_4":
                    let gemSprite = getSprite('gem_3');
                    if (el._collisionScript) {
                        gemSprite.name = el._name;
                    }
                    gemSprite.type = el._type;
                    gemSprite.x = el._x * blockSize;
                    gemSprite.y = el._y * blockSize;
                    gameScene.addChild(gemSprite);
                    break;
                case "SNAKE_ENEMY":
                    let snakeSprite = getSprite('snake');
                    if (el._collisionScript) {
                        snakeSprite.name = el._name;
                    }
                    snakeSprite.type = el._type;
                    snakeSprite.x = el._x * blockSize;
                    snakeSprite.y = el._y * blockSize;
                    gameScene.addChild(snakeSprite);
                    break;
                case "CHEST_2":
                    let chestSprite = getSprite('chest');
                    if (el._collisionScript) {
                        chestSprite.name = el._name;
                    }
                    chestSprite.type = el._type;
                    chestSprite.scale.x = 1 / 8.26;
                    chestSprite.scale.y = 1 / 8.26;
                    chestSprite.x = el._x * blockSize;
                    chestSprite.y = el._y * blockSize;
                    gameScene.addChild(chestSprite);
                    break;
                default:
                    break;
            }
        }

        // Add player
        let playerArray = [getTexture('Player_animation_0'), getTexture('Player_animation_1'), getTexture('Player_animation_2')];
        playerSprite = new AnimatedSprite(playerArray);
        playerSprite.position.set(150, 150);
        playerSprite.anchor.set(0.5, 0.5);
        playerSprite.animationSpeed = 0.2;
        playerSprite.vx = 0;
        playerSprite.vy = 0;
        playerSprite.type = 'PLAYER';
        gameScene.addChild(playerSprite);

        // Add hand icon
        let handsArray = [getTexture('hand_1'), getTexture('hand_2')];
        handSprite = new AnimatedSprite(handsArray);
        handSprite.position.set(1000, 200);
        handSprite.anchor.set(0.5, 0.5)
        handSprite.animationSpeed = 0.02;
        handSprite.play();
        gameScene.addChild(handSprite);

        // Create first tap position
        const positionOfFirstTap = { x: 9, y: 1 };
        rectangle = new Graphics();
        rectangle.name = 'rectangle';
        rectangle.beginFill(0x66CCFF);
        rectangle.drawRect(positionOfFirstTap.x * 100, positionOfFirstTap.y * 100, 100, 100);
        rectangle.endFill();
        rectangle.alpha = 0;
        rectangle.interactive = true;
        rectangle.on('click', firstTapHandler);
        rectangle.on('tap', firstTapHandler);
        gameScene.addChild(rectangle);

        // Add logo to left bottom corner
        let logoSprite = getSprite('logo');
        logoSprite.y = app.view.height - logoSprite.height;
        gameScene.addChild(logoSprite);

        // Define first state
        state = play;
        // Start the game loop
        app.ticker.add(gameLoop);
        // gameLoop();

        // Resize game
        app.renderer.resize(app.view.width, app.view.height);
        scaleToWindow(app.view, 'white');
    }

    function gameLoop(delta) {
        // requestAnimationFrame(gameLoop);
        state(delta);
    }

    function play(delta) {
        dust.update();
        stones.forEach(stone => stone.goDown());

        playerSprite.x += playerSprite.vx;
        playerSprite.y += playerSprite.vy;

        if (playerSprite.vx || playerSprite.vy) {
            playerSprite.rotation += rotation;

            if (playerSprite.rotation > 0.1 || playerSprite.rotation < -0.1) {
                rotation *= -1;
            }
        }

        if (firstStep) {
            const stone = stones[4];

            if (stone.sprite.x < 300) {
                stone.goRight(playerSprite.vx);
            }

            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script1ground1'))) {
                explodeGround('script1ground1');
            }
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script1ground2'))) {
                explodeGround('script1ground2');
            }
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script1ground3'))) {
                explodeGround('script1ground3');
            }
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script1ground4'))) {
                explodeGround('script1ground4');
            }

            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script1gem1'))) {
                explodeGem('script1gem1');
            }

            if (animate(firstScript, playerSprite)) {
                endFirstStep();
            }
        }

        if (secondStep) {
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script2ground1'))) {
                explodeGround('script2ground1');
            }
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script2ground2'))) {
                explodeGround('script2ground2');
                // stoneDown = true;
            }
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script2ground3'))) {
                explodeGround('script2ground3');
            }
            if (playerSprite.vy && hitTestRectangle(playerSprite, gameScene.getChildByName('script2ground4'))) {
                explodeGround('script2ground4');
            }
            if (playerSprite.vy && hitTestRectangle(playerSprite, gameScene.getChildByName('script2ground5'))) {
                explodeGround('script2ground5');
            }
            if (playerSprite.vy && hitTestRectangle(playerSprite, gameScene.getChildByName('script2ground6'))) {
                explodeGround('script2ground6');
            }

            if (playerSprite.vy && hitTestRectangle(playerSprite, gameScene.getChildByName('script2gem1'))) {
                explodeGem('script2gem1');
            }
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script2gem2'))) {
                explodeGem('script2gem2');
            }

            if (animate(secondScript, playerSprite)) {
                endSecondStep();
            }
        }

        if (thirdStep) {
            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script3ground1'))) {
                explodeGround('script3ground1');
            }

            if (playerSprite.vx && hitTestRectangle(playerSprite, gameScene.getChildByName('script3gem1'))) {
                explodeGem('script3gem1');
            }

            if (animate(thirdScript, playerSprite)) {
                endThirdStep();
            }
        }
    }

    function end() {
        if (openedChest) {
            if (buttonSprite.alpha <= 0 || chestSprite.alpha <= 0) {
                buttonSprite.visible = false;
                chestSprite.visible = false;
                openSprite.visible = true;

                openSprite.alpha += speedOfFade;
            } else {
                openSprite.visible = false;
                buttonSprite.alpha -= speedOfFade;
                chestSprite.alpha -= speedOfFade;
            }
        }
    }

    function animate(scriptArray, sprite) {
        if (!scriptArray.length) {
            return true;
        }

        const script = scriptArray[0];
        const { x, y, dx, dy, toX, toY } = script;

        if (x) {
            playerSprite.scale.x = x;
            if (sprite.x < toX || sprite.x > toX) {
                sprite.vx = 4 * x;
            } else {
                scriptArray.shift();
                sprite.vx = 0;
            }
        } else if (y) {
            if (sprite.y < toY || sprite.y > toY) {
                sprite.vy = 4 * y;
            } else {
                scriptArray.shift();
                sprite.vy = 0;
            }
        }
    }

    setup();

    window.onresize = function (event) {
        app.renderer.resize(app.view.width, app.view.height);
        scaleToWindow(app.view, 'white');
    }

    function firstTapHandler(event) {
        firstStep = true;
        handSprite.visible = false;
        playerSprite.play();
    }

    function endFirstStep() {
        firstStep = false;
        stoneDown = false;
        playerSprite.vx = 0;
        playerSprite.vy = 0;
        playerSprite.rotation = 0;
        playerSprite.gotoAndStop(0);
        handSprite.visible = true;
        handSprite.position.set(500, 500);

        gameScene.removeChild(rectangle);
        const positionOfSecondTap = { x: 4, y: 4 };
        rectangle = new Graphics();
        rectangle.name = 'rectangle';
        rectangle.beginFill(0x66CCFF);
        rectangle.drawRect(positionOfSecondTap.x * 100, positionOfSecondTap.y * 100, 100, 100);
        rectangle.endFill();
        rectangle.alpha = 0;
        rectangle.interactive = true;
        rectangle.on('click', secondTapHandler);
        rectangle.on('tap', secondTapHandler);
        gameScene.addChild(rectangle);
    }

    function secondTapHandler(event) {
        secondStep = true;
        handSprite.visible = false;
        playerSprite.play();
    }

    function endSecondStep(event) {
        secondStep = false;
        stoneDown = false;
        playerSprite.vx = 0;
        playerSprite.vy = 0;
        playerSprite.rotation = 0;
        playerSprite.gotoAndStop(0);
        handSprite.visible = true;
        handSprite.position.set(1200, 800);

        gameScene.removeChild(rectangle);
        const positionOfSecondTap = { x: 11, y: 7 };
        rectangle = new Graphics();
        rectangle.name = 'rectangle';
        rectangle.beginFill(0x66CCFF);
        rectangle.drawRect(positionOfSecondTap.x * 100, positionOfSecondTap.y * 100, 100, 100);
        rectangle.endFill();
        rectangle.alpha = 0;
        rectangle.interactive = true;
        rectangle.on('click', thirdTapHandler);
        rectangle.on('tap', thirdTapHandler);
        gameScene.addChild(rectangle);
    }

    function thirdTapHandler(event) {
        thirdStep = true;
        handSprite.visible = false;
        playerSprite.play();
    }

    function endThirdStep(event) {
        thirdStep = false;
        stoneDown = false;
        playerSprite.vx = 0;
        playerSprite.vy = 0;
        playerSprite.rotation = 0;
        playerSprite.gotoAndStop(0);
        gameScene.removeChild(rectangle);

        gameScene.visible = false;
        endScene.visible = true;
        state = end;
    }

    function openChest() {
        openedChest = true;
    }

    function openGame() {
        window.clickInstall();
    }

    function explodeGround(groundName) {
        const ground = gameScene.getChildByName(groundName);
        dust.create(
            ground.x + ground.width / 2,
            ground.y + ground.height / 2,
            () => getSprite('ground_stage_1'),
            gameScene,
            10
        );

        gameScene.removeChild(ground);
    }

    function explodeGem(gemName) {
        const gem = gameScene.getChildByName(gemName);
        dust.create(
            gem.x + gem.width / 2,
            gem.y + gem.height / 2,
            () => getSprite('gem_3'),
            gameScene,
            10
        );

        gameScene.removeChild(gem);
    }

    function explodeSpikes(stone, spikes) {
        if (spikes.visible && hitTestRectangle(stone, spikes)) {
            dust.create(
                spikes.x + spikes.width / 2,
                spikes.y + spikes.height / 2,
                () => getSprite('spikes'),
                gameScene,
                10
            );
            spikes.visible = false;
        }

        if (stone.y < spikes.y) {
            stone.y += 6;
        }
    }
}(window));