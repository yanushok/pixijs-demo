(function (window) {
    window.utilities = {
        scaleToWindow(canvas, backgroundColor) {
            var scaleX, scaleY, scale, center;

            //1. Scale the canvas to the correct size
            //Figure out the scale amount on each axis
            scaleX = window.innerWidth / canvas.offsetWidth;
            scaleY = window.innerHeight / canvas.offsetHeight;

            //Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
            scale = Math.min(scaleX, scaleY);
            canvas.style.transformOrigin = "0 0";
            canvas.style.transform = "scale(" + scale + ")";

            //2. Center the canvas.
            //Decide whether to center the canvas vertically or horizontally.
            //Wide canvases should be centered vertically, and 
            //square or tall canvases should be centered horizontally
            if (canvas.offsetWidth > canvas.offsetHeight) {
                if (canvas.offsetWidth * scale < window.innerWidth) {
                    center = "horizontally";
                } else {
                    center = "vertically";
                }
            } else {
                if (canvas.offsetHeight * scale < window.innerHeight) {
                    center = "vertically";
                } else {
                    center = "horizontally";
                }
            }

            //Center horizontally (for square or tall canvases)
            var margin;
            if (center === "horizontally") {
                margin = (window.innerWidth - canvas.offsetWidth * scale) / 2;
                canvas.style.marginTop = 0 + "px";
                canvas.style.marginBottom = 0 + "px";
                canvas.style.marginLeft = margin + "px";
                canvas.style.marginRight = margin + "px";
            }

            //Center vertically (for wide canvases) 
            if (center === "vertically") {
                margin = (window.innerHeight - canvas.offsetHeight * scale) / 2;
                canvas.style.marginTop = margin + "px";
                canvas.style.marginBottom = margin + "px";
                canvas.style.marginLeft = 0 + "px";
                canvas.style.marginRight = 0 + "px";
            }

            //3. Remove any padding from the canvas  and body and set the canvas
            //display style to "block"
            canvas.style.paddingLeft = 0 + "px";
            canvas.style.paddingRight = 0 + "px";
            canvas.style.paddingTop = 0 + "px";
            canvas.style.paddingBottom = 0 + "px";
            canvas.style.display = "block";

            //4. Set the color of the HTML body background
            document.body.style.backgroundColor = backgroundColor;

            //Fix some quirkiness in scaling for Safari
            var ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf("safari") != -1) {
                if (ua.indexOf("chrome") > -1) {
                    // Chrome
                } else {
                    // Safari
                    //canvas.style.maxHeight = "100%";
                    //canvas.style.minHeight = "100%";
                }
            }

            //5. Return the `scale` value. This is important, because you'll nee this value 
            //for correct hit testing between the pointer and sprites
            return scale;
        },

        hitTestRectangle(r1, r2) {

            if (!r1 || !r2) {
                return false;
            }

            //Define the variables we'll need to calculate
            let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

            //hit will determine whether there's a collision
            hit = false;

            //Find the center points of each sprite
            r1.centerX = r1.x + r1.width / 2 - r1.width * r1.anchor.x;
            r1.centerY = r1.y + r1.height / 2 - r1.height * r1.anchor.y;
            r2.centerX = r2.x + r2.width / 2 - r2.width * r2.anchor.x;
            r2.centerY = r2.y + r2.height / 2 - r2.height * r2.anchor.y;

            //Find the half-widths and half-heights of each sprite
            r1.halfWidth = r1.width / 2;
            r1.halfHeight = r1.height / 2;
            r2.halfWidth = r2.width / 2;
            r2.halfHeight = r2.height / 2;

            //Calculate the distance vector between the sprites
            vx = r1.centerX - r2.centerX;
            vy = r1.centerY - r2.centerY;

            //Figure out the combined half-widths and half-heights
            combinedHalfWidths = r1.halfWidth + r2.halfWidth;
            combinedHalfHeights = r1.halfHeight + r2.halfHeight;

            //Check for a collision on the x axis
            if (Math.abs(vx) < combinedHalfWidths) {

                //A collision might be occurring. Check for a collision on the y axis
                if (Math.abs(vy) < combinedHalfHeights) {

                    //There's definitely a collision happening
                    hit = true;
                } else {

                    //There's no collision on the y axis
                    hit = false;
                }
            } else {

                //There's no collision on the x axis
                hit = false;
            }

            //`hit` will be either `true` or `false`
            return hit;
        },

        contain(sprite, container) {
            let collision = undefined;
            //Left
            if (sprite.x < container.x) {
                sprite.x = container.x;
                collision = "left";
            }
            //Top
            if (sprite.y < container.y) {
                sprite.y = container.y;
                collision = "top";
            }
            //Right
            if (sprite.x + sprite.width > container.width) {
                sprite.x = container.width - sprite.width;
                collision = "right";
            }
            //Bottom
            if (sprite.y + sprite.height > container.height) {
                sprite.y = container.height - sprite.height;
                collision = "bottom";
            }
            //Return the `collision` value
            return collision;
        },

        getRandomInt(min, max) {
            var rand = min - .5 + Math.random() * (max - min + 1);
            return rand = Math.round(rand);
        },

        degreesInRadians(val) {
            return val * (Math.PI / 180)
        },

        radiansInDegrees(val) {
            return val * (180 / Math.PI)
        },

        getSprite(img) {
            var texture = this.getTexture(img);
            if (texture) {
                var sprite = new PIXI.Sprite(texture);
                return sprite.origWidth = texture.origWidth, sprite.origHeight = texture.origHeight, sprite
            }
        },

        getTexture(img) {
            var pic = window.sprites[img];
            if (pic) {
                var image = new Image;
                image.src = pic.src;
                var baseTexture = new PIXI.BaseTexture(image)
                    , rect = new PIXI.Rectangle(0, 0, pic.w / pic.r, pic.h / pic.r)
                    , rect2 = new PIXI.Rectangle(0, 0, pic.w, pic.h)
                    , texture = new PIXI.Texture(baseTexture, rect2, rect, rect);
                return texture.origWidth = pic.w / pic.r,
                    texture.origHeight = pic.h / pic.r,
                    texture
            }
        },
    };
}(window));
