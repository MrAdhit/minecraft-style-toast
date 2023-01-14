let toast_width = 0;

const TOAST_TYPE = {
    "WARNING": 0,
    "ERROR": 1,
    "ADVANCEMENT": 2,
    "RARE_ADVANCEMENT": 3,
}

class McToast {
    constructor() {
        let toast = document.createElement("canvas");
        toast.setAttribute("width", window.visualViewport.width);

        this.ctx = toast.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.target = document.createElement("div");
        this.target.replaceChildren(toast);

        this.target.style.right = "-102%";
        this.target.style.transition = "2s cubic-bezier(0.25, 1, 0.5, 1)";
        this.target.style.position = "relative";

        window.customElements.define("mc-toast", class Dummy extends HTMLDivElement { constructor() { super(); } }, { extends: "div" });
        this.element = document.getElementsByTagName("mc-toast")[0];
        this.element.style.width = "99vw";
        this.element.style.overflow = "hidden";
        this.element.style.display = "block";
        this.element.style.position = "absolute"

        this.element.appendChild(this.target);

        this.popQueues = [];

        this.tex = new Image();
        this.tex.src = "assets/img/toast.png";

        this.soundEnabled = false;
        this.popupSound = {
            in: new Audio("assets/sounds/popup-in.ogg"),
            out: new Audio("assets/sounds/popup-out.ogg")
        }
    }

    setSoundEnable(enable) {
        this.soundEnabled = enable;
    }

    onTextureLoad(event) {
        this.tex.onload = event;
    }

    draw(title, description) {
        return new Drawer(title, description, this.tex, this.ctx);
    }

    queueDrawPop(title, description, toast_type = TOAST_TYPE.WARNING, scaling = 2, duration = 2000, imageUrl = "https://minecraftitemids.com/item/32/iron_pickaxe.png") {
        let toast = {
            title, description, scaling, duration, toast_type, imageUrl
        }

        this.popQueues.push(toast);

        if (this.popQueues.length == 1) {
            new Promise((res, rej) => {
                let pop = () => {
                    let t = this.popQueues[0];
                    if (typeof t == "undefined") {
                        res();
                    }

                    switch (t.toast_type) {
                        case TOAST_TYPE.WARNING:
                            this.draw(t.title, t.description).warn(t.scaling);
                            break;

                        case TOAST_TYPE.ERROR:
                            this.draw(t.title, t.description).error(t.scaling);
                            break;

                        case TOAST_TYPE.ADVANCEMENT:
                            this.draw(t.title, t.description).advancement(t.scaling, t.imageUrl);
                            break;

                        case TOAST_TYPE.RARE_ADVANCEMENT:
                            this.draw(t.title, t.description).rareAdvancement(t.scaling, t.imageUrl);
                            break;

                        default:
                            this.draw(t.title, t.description).error(t.scaling);
                            break;
                    }

                    this.pop(t.duration).finally(() => {
                        this.popQueues.shift();
                        if (this.popQueues.length > 0) pop();
                    });
                }
                pop();
            });
        }
    }

    pop(duration = 2000) {
        return new Promise((resolve, reject) => {
            if (this.soundEnabled) this.popupSound.in.play();
            this.target.style.right = -(window.visualViewport.width - (toast_width + 20)) + "px";

            setTimeout(() => {
                if (this.soundEnabled) this.popupSound.out.play();
                this.target.style.right = "-102%";
                setTimeout(() => {
                    resolve();
                }, 1500);
            }, duration + 2000);
        });
    }
}

class Drawer {
    constructor(title, description, tex, ctx) {
        this.title = title;
        this.description = description;
        this.tex = tex;
        this.ctx = ctx;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    rareAdvancement(scaling = 2, imageUrl = "https://minecraftitemids.com/item/32/iron_pickaxe.png") {
        this.clear();

        this.ctx.font = (8 * scaling) + "px Minecrafto";
        let longest = ((this.ctx.measureText(this.title).width / scaling) > (this.ctx.measureText(this.description).width / scaling) ? this.title : this.description);

        let renderedWidth = (this.ctx.measureText(longest).width / scaling) + 37;
        let toasts = new OffscreenCanvas(renderedWidth * 3, 32 * 3);
        let tctx = toasts.getContext("2d");
        tctx.imageSmoothingEnabled = false;

        tctx.fillStyle = "#212121";
        tctx.fillRect(4, 4, (toasts.width - 6), (toasts.height - 6));

        tctx.drawImage(this.tex, 12, 0, 4, 4, 0, 0, 4 * 3, 4 * 3); // Top Left
        tctx.drawImage(this.tex, 14, 0, 3, 3, 3 * 3, 0, toasts.width - (6 * 3), 3 * 3); // Top
        tctx.drawImage(this.tex, 16, 0, 4, 4, toasts.width - (4 * 3), 0, 4 * 3, 4 * 3); // Top Right
        tctx.drawImage(this.tex, 17, 3, 3, 3, toasts.width - (3 * 3), 3 * 3, 3 * 3, (toasts.height - (6 * 3))); // Right
        tctx.drawImage(this.tex, 16, 4, 4, 4, toasts.width - (4 * 3), toasts.height - (4 * 3), 4 * 3, 4 * 3); // Bottom Right
        tctx.drawImage(this.tex, 15, 5, 3, 3, 3 * 3, toasts.height - (3 * 3), (toasts.width - (6 * 3)), 3 * 3); // Bottom
        tctx.drawImage(this.tex, 12, 4, 4, 4, 0, toasts.height - (4 * 3), 4 * 3, 4 * 3); // Bottom Left
        tctx.drawImage(this.tex, 12, 2, 3, 3, 0, 3 * 3, 3 * 3, (toasts.height - (6 * 3))); // Left

        toast_width = (tctx.canvas.width / 3) * scaling;

        let itemImg = new Image();
        itemImg.src = imageUrl;

        itemImg.onload = () => {
            tctx.drawImage(itemImg, 0, 0, 32, 32, 27, 32, 36, 36);

            this.ctx.drawImage(toasts, 0, 0, renderedWidth * 3, 32 * 3, 0, 0, renderedWidth * scaling, calcHeight(32, renderedWidth, renderedWidth * scaling))

            this.ctx.font = (8 * scaling) + "px Minecrafto";
            this.ctx.fillStyle = "#FF55FF";
            this.ctx.textBaseline = "top";
            this.ctx.fillText(this.title, 28 * scaling, 9 * scaling);
            this.ctx.fillStyle = "#fff";
            this.ctx.fillText(this.description, 28 * scaling, 18 * scaling);
        }
    }

    advancement(scaling = 2, imageUrl = "https://minecraftitemids.com/item/32/iron_pickaxe.png") {
        this.clear();

        this.ctx.font = (8 * scaling) + "px Minecrafto";
        let longest = ((this.ctx.measureText(this.title).width / scaling) > (this.ctx.measureText(this.description).width / scaling) ? this.title : this.description);

        let renderedWidth = (this.ctx.measureText(longest).width / scaling) + 37;
        let toasts = new OffscreenCanvas(renderedWidth * 3, 32 * 3);
        let tctx = toasts.getContext("2d");
        tctx.imageSmoothingEnabled = false;

        tctx.fillStyle = "#212121";
        tctx.fillRect(4, 4, (toasts.width - 6), (toasts.height - 6));

        tctx.drawImage(this.tex, 12, 0, 4, 4, 0, 0, 4 * 3, 4 * 3); // Top Left
        tctx.drawImage(this.tex, 14, 0, 3, 3, 3 * 3, 0, toasts.width - (6 * 3), 3 * 3); // Top
        tctx.drawImage(this.tex, 16, 0, 4, 4, toasts.width - (4 * 3), 0, 4 * 3, 4 * 3); // Top Right
        tctx.drawImage(this.tex, 17, 3, 3, 3, toasts.width - (3 * 3), 3 * 3, 3 * 3, (toasts.height - (6 * 3))); // Right
        tctx.drawImage(this.tex, 16, 4, 4, 4, toasts.width - (4 * 3), toasts.height - (4 * 3), 4 * 3, 4 * 3); // Bottom Right
        tctx.drawImage(this.tex, 15, 5, 3, 3, 3 * 3, toasts.height - (3 * 3), (toasts.width - (6 * 3)), 3 * 3); // Bottom
        tctx.drawImage(this.tex, 12, 4, 4, 4, 0, toasts.height - (4 * 3), 4 * 3, 4 * 3); // Bottom Left
        tctx.drawImage(this.tex, 12, 2, 3, 3, 0, 3 * 3, 3 * 3, (toasts.height - (6 * 3))); // Left

        toast_width = (tctx.canvas.width / 3) * scaling;

        let itemImg = new Image();
        itemImg.src = imageUrl;

        itemImg.onload = () => {
            tctx.drawImage(itemImg, 0, 0, 32, 32, 27, 32, 36, 36);

            this.ctx.drawImage(toasts, 0, 0, renderedWidth * 3, 32 * 3, 0, 0, renderedWidth * scaling, calcHeight(32, renderedWidth, renderedWidth * scaling))

            this.ctx.font = (8 * scaling) + "px Minecrafto";
            this.ctx.fillStyle = "#ffff55";
            this.ctx.textBaseline = "top";
            this.ctx.fillText(this.title, 28 * scaling, 9 * scaling);
            this.ctx.fillStyle = "#fff";
            this.ctx.fillText(this.description, 28 * scaling, 18 * scaling);
        }
    }

    error(scaling = 2) {
        this.clear();

        this.ctx.font = (8 * scaling) + "px Minecrafto";
        let longest = ((this.ctx.measureText(this.title).width / scaling) > (this.ctx.measureText(this.description).width / scaling) ? this.title : this.description);

        let renderedWidth = (this.ctx.measureText(longest).width / scaling) + 26;
        let toasts = new OffscreenCanvas(renderedWidth, 32);
        let tctx = toasts.getContext("2d");
        tctx.imageSmoothingEnabled = false;

        tctx.drawImage(this.tex, 4, 0, 3, 3, 0, 0, 3, 3); // Top Left
        tctx.drawImage(this.tex, 7, 0, 3, 3, 3, 0, toasts.width, 3); // Top
        tctx.drawImage(this.tex, 9, 0, 3, 3, toasts.width - 3, 0, 3, 3); // Top Right
        tctx.drawImage(this.tex, 9, 3, 3, 3, toasts.width - 3, 3, 3, (toasts.height - 6)); // Right
        tctx.drawImage(this.tex, 9, 5, 3, 3, toasts.width - 3, toasts.height - 3, 3, 3); // Bottom Right
        tctx.drawImage(this.tex, 7, 5, 3, 3, 3, toasts.height - 3, (toasts.width - 6), 3); // Bottom
        tctx.drawImage(this.tex, 4, 5, 3, 3, 0, toasts.height - 3, 3, 3); // Bottom Left
        tctx.drawImage(this.tex, 4, 3, 3, 3, 0, 3, 3, (toasts.height - 6)); // Left

        tctx.fillStyle = "#082c4c";
        tctx.fillRect(3, 3, (toasts.width - 6), (toasts.height - 6));

        tctx.drawImage(this.tex, 0, 17, 4, 17, 8, 8, 4, 17)

        toast_width = tctx.canvas.width * scaling;

        this.ctx.drawImage(toasts, 0, 0, renderedWidth, 32, 0, 0, renderedWidth * scaling, calcHeight(32, renderedWidth, renderedWidth * scaling))

        this.ctx.font = (8 * scaling) + "px Minecrafto";
        this.ctx.fillStyle = "#FF5555";
        this.ctx.textBaseline = "top";
        this.ctx.fillText(this.title, 19 * scaling, 9 * scaling);
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(this.description, 19 * scaling, 18 * scaling);
    }

    warn(scaling = 2) {
        this.clear();

        this.ctx.font = (8 * scaling) + "px Minecrafto";
        let longest = ((this.ctx.measureText(this.title).width / scaling) > (this.ctx.measureText(this.description).width / scaling) ? this.title : this.description);

        let renderedWidth = (this.ctx.measureText(longest).width / scaling) + 26;
        let toasts = new OffscreenCanvas(renderedWidth, 32);
        let tctx = toasts.getContext("2d");
        tctx.imageSmoothingEnabled = false;

        tctx.drawImage(this.tex, 4, 0, 3, 3, 0, 0, 3, 3); // Top Left
        tctx.drawImage(this.tex, 7, 0, 3, 3, 3, 0, toasts.width, 3); // Top
        tctx.drawImage(this.tex, 9, 0, 3, 3, toasts.width - 3, 0, 3, 3); // Top Right
        tctx.drawImage(this.tex, 9, 3, 3, 3, toasts.width - 3, 3, 3, (toasts.height - 6)); // Right
        tctx.drawImage(this.tex, 9, 5, 3, 3, toasts.width - 3, toasts.height - 3, 3, 3); // Bottom Right
        tctx.drawImage(this.tex, 7, 5, 3, 3, 3, toasts.height - 3, (toasts.width - 6), 3); // Bottom
        tctx.drawImage(this.tex, 4, 5, 3, 3, 0, toasts.height - 3, 3, 3); // Bottom Left
        tctx.drawImage(this.tex, 4, 3, 3, 3, 0, 3, 3, (toasts.height - 6)); // Left

        tctx.fillStyle = "#082c4c";
        tctx.fillRect(3, 3, (toasts.width - 6), (toasts.height - 6));

        tctx.drawImage(this.tex, 0, 0, 4, 17, 8, 8, 4, 17)

        toast_width = tctx.canvas.width * scaling;

        this.ctx.drawImage(toasts, 0, 0, renderedWidth, 32, 0, 0, renderedWidth * scaling, calcHeight(32, renderedWidth, renderedWidth * scaling))

        this.ctx.font = (8 * scaling) + "px Minecrafto";
        this.ctx.fillStyle = "#ffff55";
        this.ctx.textBaseline = "top";
        this.ctx.fillText(this.title, 19 * scaling, 9 * scaling);
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(this.description, 19 * scaling, 18 * scaling);
    }
}

function calcHeight(oh, ow, nw) {
    return (oh / ow) * nw;
} 