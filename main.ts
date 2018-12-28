/* main.ts - (c) 2018 James Renwick */

import { Point } from "./ui";
import { ScoreDocument, ScorePart } from "./score_stave";

const score = new ScoreDocument({ x: 1024, y: 1280 });

function scoreSetup()
{
    score.parts.push({instrument: "piano", startTime: 0, endTime: 0, items:[] });
    score.parts.push({instrument: "cello", startTime: 0, endTime: 0, items:[] });
}

var currentLayoutCycle : number = 0;
const main_canvas = <HTMLCanvasElement>document.getElementById("main_canvas");
const context2d = main_canvas.getContext("2d");
var mouse_down = false;
var lastMousePos = new Point();
var scale = 1.0;
const devicePixelRatio = window.devicePixelRatio | 1;


function globalLayout()
{
    score.computeInitialLayout(currentLayoutCycle);
    score.computeFinalLayout(currentLayoutCycle);
    currentLayoutCycle++;
}

function globalDraw(context2d : CanvasRenderingContext2D)
{
    context2d.setTransform(1, 0, 0, 1, 0, 0);
    context2d.clearRect(0, 0, main_canvas.width, main_canvas.height);
    context2d.scale(scale * devicePixelRatio, scale * devicePixelRatio);
    score.drawHierarchy(context2d);
}

export function canvas_setup()
{
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
            score.margin.left += (e.clientX - lastMousePos.x) / scale;
            score.margin.top += (e.clientY - lastMousePos.y) / scale;
            lastMousePos = { x: e.clientX, y: e.clientY };

            globalLayout();
            globalDraw(context2d);
        }
    };

    scoreSetup();
    globalLayout();
    globalDraw(context2d);
}
