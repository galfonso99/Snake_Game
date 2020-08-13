
window.onload = function() {
    // Get the canvas and context
    var canvas = <HTMLCanvasElement> document.getElementById("canvas")! 
    var context =  canvas.getContext("2d")!
    
    // Create objects
    var snake = new Snake();
    var level = new Level(25, 20, 32, 32);
    
    // Variables
    var score = 0;              // Score
    var gameover = true;        // Game is over
    var gameovertime = 1;       // How long we have been game over
    var gameoverdelay = 0.5;    // Waiting time after game over

    // Timing and frames per second
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;
    
    var initialized = false;
    
    // Images
    var images: HTMLImageElement[] = [];
    var tileimage: HTMLImageElement;
    
    // Image loading global variables
    var loadcount = 0;
    var loadtotal = 0;
    var preloaded = false;

    // Load images
    function loadImages(imagefiles: string[]) {
        // Initialize variables
        loadcount = 0;
        loadtotal = imagefiles.length;
        preloaded = false;
        
        // Load the images
        var loadedimages: HTMLImageElement[] = [];
        for (var i=0; i<imagefiles.length; i++) {
            // Create the image object
            var image = new Image();
            
            // Add onload event handler
            image.onload = function () {
                loadcount++;
                if (loadcount == loadtotal) {
                    // Done loading
                    preloaded = true;
                }
            };
            
            // Set the source url of the image
            image.src = imagefiles[i];
            
            // Save to the image array
            loadedimages[i] = image;
        }
        
        // Return an array of images
        return loadedimages;
    }

    // Check if we can start a new game
    function tryNewGame() {
        if (gameovertime > gameoverdelay) {
            newGame();
            gameover = false;
        }
    }

    function newGame() {
        snake.init(10, 10, 1, 8, 4);
        // Generate the default level
        level.generate();
        
        // Add an apple
        addApple();
        
        score = 0;
        gameover = false;
    }

    function addApple() {
        // Loop until we have a valid apple
        var valid = false;
        while (!valid) {
            // Get a random position
            var ax = randRange(0, level.cols-1);
            var ay = randRange(0, level.rows-1);
            
            // Make sure the snake doesn't overlap the new apple
            var overlap = false;
            for (var i=0; i<snake.segments.length; i++) {
                // Get the position of the current snake segment
                var sx = snake.segments[i].x;
                var sy = snake.segments[i].y;
                
                // Check overlap
                if (ax == sx && ay == sy) {
                    overlap = true;
                    break;
                }
            }
            
            // Tile must be empty
            if (!overlap && level.tiles[ax][ay] == 0) {
                // Add an apple at the tile position
                level.tiles[ax][ay] = 2;
                valid = true;
            }
        }
    }

    function randRange(low: number, high: number) {
        return Math.floor(low + Math.random()*(high-low+1));
    }

    // Update the game state
    function update(tframe: number) {
        var dt = (tframe - lastframe) / 1000;
        lastframe = tframe;
        
        // Update the fps counter
        updateFps(dt);
        
        if (!gameover) {
            updateGame(dt);
        } else {
            gameovertime += dt;
        }
    }

    function updateGame(dt: number) {
        // Move the snake
        if (snake.tryMove(dt)) {
            // Check snake collisions
            var nextmove = snake.nextMove();
            var nx = nextmove.x;
            var ny = nextmove.y;
            
            if (nx >= 0 && nx < level.cols && ny >= 0 && ny < level.rows) {
                if (level.tiles[nx][ny] == 1) {
                    // Collision with a wall
                    gameover = true;
                }
                // Collisions with itself
                for (var i=0; i<snake.segments.length; i++) {
                    var sx = snake.segments[i].x;
                    var sy = snake.segments[i].y;
                    if (nx == sx && ny == sy) {
                        // Found a snake part
                        gameover = true;
                        break;
                    }
                }
                if (!gameover) {
                    snake.move();
                    // Check collision with an apple
                    if (level.tiles[nx][ny] == 2) {
                        level.tiles[nx][ny] = 0;
                        addApple();
                        snake.grow();
                        
                        score++;
                    }
                }
            } else {
                gameover = true;
            }
            
            if (gameover) {
                gameovertime = 0;
            }
        }
    }

    function updateFps(dt: number) {
        if (fpstime > 0.25) {
            // Calculate fps
            fps = Math.round(framecount / fpstime);
            
            // Reset time and framecount
            fpstime = 0;
            framecount = 0;
        }
        
        // Increase time and framecount
        fpstime += dt;
        framecount++;
    }

    // Draw text that is centered
    function drawCenterText(text: string, x: number, y: number, width: number) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);
    }

    // Keyboard event handler
    function onKeyDown(e: KeyboardEvent) {
        if (gameover) {
            tryNewGame();
        } else {
            if (e.keyCode == 37 || e.keyCode == 65) {
                // Left or A
                if (snake.dir != 1)  {
                    snake.dir = 3;
                }
            } else if (e.keyCode == 38 || e.keyCode == 87) {
                // Up or W
                if (snake.dir != 2)  {
                    snake.dir = 0;
                }
            } else if (e.keyCode == 39 || e.keyCode == 68) {
                // Right or D
                if (snake.dir != 3)  {
                    snake.dir = 1;
                }
            } else if (e.keyCode == 40 || e.keyCode == 83) {
                // Down or S
                if (snake.dir != 0)  {
                    snake.dir = 2;
                }
            }
        }
    }

    // Mouse event handlers
    function onMouseDown(e: MouseEvent) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);
        
        if (gameover) {
            // Start a new game
            tryNewGame();
        } else {
            // Change the direction of the snake
            snake.dir = (snake.dir + 1) % snake.directions.length;
        }
    }
    
    // Get the mouse position
    function getMousePos(canvas: HTMLCanvasElement, e: MouseEvent) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }

        // Initialize the game
    function init() {
        // Load images
        images = loadImages(["snake-graphics.png"]);
        tileimage = images[0];
    
        // Add mouse events
        canvas.addEventListener("mousedown", onMouseDown);
        
        // Add keyboard events
        document.addEventListener("keydown", onKeyDown);
        
        // New game
        newGame();
        gameover = true;
    
        // Enter main loop
        main(0);
    }
    
    // Main loop
    function main(tframe: number) {
        window.requestAnimationFrame(main);
        
        if (!initialized) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw a progress bar
            var loadpercentage = loadcount/loadtotal;
            context.strokeStyle = "#ff8080";
            context.lineWidth=3;
            context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width-37, 32);
            context.fillStyle = "#ff8080";
            context.fillRect(18.5, 0.5 + canvas.height - 51, loadpercentage*(canvas.width-37), 32);
            
            // Draw the progress text
            var loadtext = "Loaded " + loadcount + "/" + loadtotal + " images";
            context.fillStyle = "#000000";
            context.font = "16px Verdana";
            context.fillText(loadtext, 18, 0.5 + canvas.height - 63);
            
            if (preloaded) {
                initialized = true;
            }
        } else {
            // Update and render the game
            update(tframe);
            render();
            context.fillStyle = "#000";
            context.font = "20px Verdana";
            context.fillText("Score : " + score, 10, canvas.height-10);
            context.fillText("FPS : " + fps ,canvas.width - 100, canvas.height-10);
        }
    }
    
    
    // Render the game
    function render() {
        // Draw background
        context.fillStyle = "#577ddb";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        drawLevel();
        drawSnake();
            
        // Game over
        if (gameover) {
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Press any key to start!", 0, canvas.height/2, canvas.width);
        }
    }

    function drawSnake() {
        for (var i=0; i<snake.segments.length; i++) {
            var segment = snake.segments[i];
            var segX = segment.x;
            var segY = segment.y;
            var tileX = segX*level.tileX;
            var tileY = segY*level.tileY;
    
            // Sprite column and row
            var tx = 0;
            var ty = 0;
    
            if (i == 0) { // Head
                var nseg = snake.segments[i+1]; // Next segment
                if (segY < nseg.y) {
                    // Up
                    tx = 3; ty = 0; //Location of icon on sprite sheet
                } else if (segX > nseg.x) {
                    // Right
                    tx = 4; ty = 0;
                } else if (segY > nseg.y) {
                    // Down
                    tx = 4; ty = 1;
                } else if (segX < nseg.x) {
                    // Left
                    tx = 3; ty = 1;
                }
            } else if (i == snake.segments.length-1) {
                // Tail; Determine the correct image
                var pseg = snake.segments[i-1]; // Prev segment
                if (pseg.y < segY) {
                    // Up
                    tx = 3; ty = 2;
                } else if (pseg.x > segX) {
                    // Right
                    tx = 4; ty = 2;
                } else if (pseg.y > segY) {
                    // Down
                    tx = 4; ty = 3;
                } else if (pseg.x < segX) {
                    // Left
                    tx = 3; ty = 3;
                }
            } else {
                // Body; Determine the correct image
                var pseg = snake.segments[i-1]; // Previous segment
                var nseg = snake.segments[i+1]; // Next segment
                if (pseg.x < segX && nseg.x > segX || nseg.x < segX && pseg.x > segX) {
                    // Horizontal Left-Right
                    tx = 1; ty = 0;
                } else if (pseg.x < segX && nseg.y > segY || nseg.x < segX && pseg.y > segY) {
                    // Angle Left-Down
                    tx = 2; ty = 0;
                } else if (pseg.y < segY && nseg.y > segY || nseg.y < segY && pseg.y > segY) {
                    // Vertical Up-Down
                    tx = 2; ty = 1;
                } else if (pseg.y < segY && nseg.x < segX || nseg.y < segY && pseg.x < segX) {
                    // Angle Top-Left
                    tx = 2; ty = 2;
                } else if (pseg.x > segX && nseg.y < segY || nseg.x > segX && pseg.y < segY) {
                    // Angle Right-Up
                    tx = 0; ty = 1;
                } else if (pseg.y > segY && nseg.x > segX || nseg.y > segY && pseg.x > segX) {
                    // Angle Down-Right
                    tx = 0; ty = 0;
                }
            }
            // Draw the actual snake
            context.drawImage(tileimage, tx*64, ty*64, 64, 64, tileX, tileY, level.tileX, level.tileY);
        }
    }

    function drawLevel() {
        for (var i=0; i<level.cols; i++) {
            for (var j=0; j<level.rows; j++) {
                // Get the current tile and location
                var tile = level.tiles[i][j];
                var tilex = i*level.tileX;
                var tiley = j*level.tileY;
                
                // Draw tiles based on their type
                if (tile == 0) {
                    // Empty space
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tileX, level.tileY);
                } else if (tile == 1) {
                    // Wall
                    context.fillStyle = "#bcae76";
                    context.fillRect(tilex, tiley, level.tileX, level.tileY);
                } else if (tile == 2) {
                    // Draw apple background
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tileX, level.tileY);
                    
                    // Draw the apple image
                    var tx = 0;
                    var ty = 3;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tileX, level.tileY);
                }
            }
        }
    }

    // Start the game
    init();
}

//This is the Snake Class
///
///
interface Segment {
    x: number,
    y: number
}

class Snake {
    //Properties
    x: number; y: number; dir: number; v: number; /* v = speed */
    size: number; movedelay: number; 
    segments: Array<Segment>; growsegments: number; 
    directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    constructor() {
        this.x = 0;
        this.y = 0;
        this.dir = 1; 
        this.v = 8;    
        this.size = 1    
        this.movedelay = 0;

        this.segments = [];
        this.growsegments = 0;
    }

    init = (x: number, y: number, dir: number, v: number, size: number) =>  {
        this.x = x;
        this.y = y;
        this.dir = dir; 
        this.v = v;    
        this.size = size    
        this.movedelay = 0;

        this.segments = [];
        this.growsegments = 0;
        for (var i=0; i<size; i++) {
            this.segments.push({x: this.x - i*this.directions[dir][0],
            y: this.y - i*this.directions[dir][1]});
        }
    }

    grow = () => {
        this.growsegments++
    }

    tryMove = (dt: number) => {
        this.movedelay += dt
        var maxmovedelay = 1 / this.v
        if (this.movedelay > maxmovedelay) {
            return true;
        }
        return false;
    }
    nextMove = (): {x: number; y: number} => {
        var nextX = this.x + this.directions[this.dir][0];
        var nextY = this.y + this.directions[this.dir][1];
        return {x:nextX, y:nextY};
    }


    move = () => {
        var nextMove = this.nextMove();
        this.x = nextMove.x;
        this.y = nextMove.y;

        var lastSeg = this.segments[this.segments.length-1]
        var growX = lastSeg.x;
        var growY = lastSeg.y;

        for (var i=this.segments.length-1; i>=1; i--) {
            this.segments[i].x = this.segments[i-1].x;
            this.segments[i].y = this.segments[i-1].y;
        }

        if (this.growsegments > 0) {
            this.segments.push({x:growX, y:growY});
            this.growsegments--;
        }

        this.segments[0].x = this.x;
        this.segments[0].y = this.y;

        this.movedelay = 0;
    }
}

//This is the Level Class
///
///
class Level {
    //Properties
    cols: number; rows: number; tileX: number; tileY: number; 
    tiles: number[][];
    constructor(cols: number, rows: number, tileX: number, tileY: number) {
        this.cols = cols;
        this.rows = rows;
        this.tileX = tileX;
        this.tileY = tileY;

        this.tiles = [];
        for (var i=0; i<this.cols; i++) {
            this.tiles[i] = [];
            for (var j=0; j<this.rows; j++) {
                this.tiles[i][j] = 0;
            }
        }
    }

    generate = () => {
        for (var i=0; i<this.cols; i++) {
            for (var j=0; j<this.rows; j++) {
                if (i == 0 || i == this.cols-1 ||
                    j == 0 || j == this.rows-1) {
                    // Add walls at the edges of the level
                    this.tiles[i][j] = 1;
                } else {
                    // Add empty space
                    this.tiles[i][j] = 0;
                }
            }
        }
    }
}