import { UIControl } from "./ui";


export class ScoreStave extends UIControl
{
    lineCount : number = 5;
    lineSpace : number = 10;

    constructor(parent : UIControl)
    {
        super(parent);
        this.size.y = this.lineCount * this.lineSpace;
        this.size.x = undefined;
    }

    computeInitialLayout(layoutCycle : number) : void
    {
        this.size.y = this.lineCount * this.lineSpace;
        this.size.x = undefined;
        super.computeInitialLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void
    {
        // Check if valid
        if (!isNaN(this._layoutInfo.actualSize.x + this._layoutInfo.actualSize.y + this._layoutInfo.position.x + this._layoutInfo.position.y))
        {
            var offx = this._layoutInfo.position.x;
            var offy = this._layoutInfo.position.y;
            for (var i = 0; i < this.lineCount; i++)
            {
                context2d.beginPath();
                context2d.lineWidth = 1;
                context2d.moveTo(offx + 0.4, offy + 0.4);
                context2d.lineTo(offx + this._layoutInfo.actualSize.x + 0.4, offy + 0.4);
                context2d.closePath();
                context2d.stroke();
                offy += this.lineSpace;
            }
        }
        else {
            console.warn("Invalid layout on ScoreStave");
        }
    }
}
