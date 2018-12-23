import { UIControl, Point } from "./ui";
import { ScoreStave } from "./score_stave";

export class ScoreDocument
{
    staves : ScoreStave[] = [];
}

export class ScorePage extends UIControl
{
    constructor(width : number, height : number)
    {
        super(undefined);
        this.size.x = width;
        this.size.y = height;

        if (isNaN(width + height)) {
            throw new Error("ScorePage dimensions must be absolute.");
        }
    }

    draw(context2d: CanvasRenderingContext2D): void
    {
        context2d.fillStyle = '#DDD';
        context2d.fillRect(this._layoutInfo.position.x, this._layoutInfo.position.y,
                           this._layoutInfo.actualSize.x, this._layoutInfo.actualSize.y);
    }
}



const page = new ScorePage(1024, 1280);

const score : ScoreDocument = {
    staves: [
        new ScoreStave(page),
        new ScoreStave(page)
    ]
};

var currentLayoutCycle : number = 0;
const main_canvas = <HTMLCanvasElement>document.getElementById("main_canvas");
const context2d = main_canvas.getContext("2d");
var mouse_down = false;
var lastMousePos = new Point();
var scale = 1.0;
const devicePixelRatio = window.devicePixelRatio | 1;


function globalLayout()
{
    var offsetY = 5;
    for (var stave of score.staves)
    {
        stave.margin.top += offsetY;
        offsetY += stave.size.y + 10;
    }

    page.computeInitialLayout(currentLayoutCycle);
    page.computeFinalLayout(currentLayoutCycle);
    currentLayoutCycle++;
}

function globalDraw(context2d : CanvasRenderingContext2D)
{
    context2d.setTransform(1, 0, 0, 1, 0, 0);
    context2d.clearRect(0, 0, main_canvas.width, main_canvas.height);
    context2d.scale(scale * devicePixelRatio, scale * devicePixelRatio);
    page.drawHierarchy(context2d);
}

export function canvas_setup()
{
    var rect = main_canvas.getBoundingClientRect();
    main_canvas.width = window.innerWidth * devicePixelRatio;
    main_canvas.height = window.innerHeight * devicePixelRatio;
    context2d.scale(devicePixelRatio, devicePixelRatio);
    context2d.imageSmoothingQuality = "high";

    window.addEventListener("wheel", event => {
        event.preventDefault();
        scale -= event.deltaY < 0 ? -0.1 : 0.1;
        globalDraw(context2d);
    });

    main_canvas.onmousedown = (e) => {
        mouse_down = true;
        lastMousePos = { x: e.clientX, y: e.clientY };
    };
    main_canvas.onmouseup = (e) => {
        mouse_down = false;
    };
    main_canvas.onmousemove = (e) => {
        if (mouse_down)
        {
            page.margin.left += e.clientX - lastMousePos.x;
            page.margin.top += e.clientY - lastMousePos.y;
            lastMousePos = { x: e.clientX, y: e.clientY };

            globalLayout();
            globalDraw(context2d);
        }
    };

    globalLayout();
    globalDraw(context2d);
}
