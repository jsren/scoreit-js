const main_canvas = <HTMLCanvasElement>document.getElementById("main_canvas");
const context2d = main_canvas.getContext("2d");
main_canvas.width = window.innerWidth;
main_canvas.height = window.innerHeight;

enum Alignment
{
    Left = 0,
    Right = 1,
    Center = 3,
    Top = 0,
    Bottom = 1
}

class Point
{
    x : number = 0;
    y : number = 0;
}

class Rect
{
    top : number;
    bottom : number;
    left : number;
    right : number;

    constructor(initialValue : number = 0, initialBottom? : number, initialLeft? : number, initialRight? : number) {
        this.top = initialValue;
        this.bottom = initialBottom === undefined ? initialValue : initialBottom;
        this.left = initialLeft === undefined ? initialValue : initialLeft;
        this.right = initialRight === undefined ? initialValue : initialRight;
    }
}

class LayoutInfo
{
    lastInitialLayoutCycle : number;
    lastFinalLayoutCycle : number;
    position : Point = new Point();
    actualSize : Point = new Point();
}

abstract class UIControl
{
    _layoutInfo : LayoutInfo = new LayoutInfo();
    margin : Rect = new Rect();
    parent : UIControl | undefined = undefined;
    children : UIControl[] = [];
    size : Point = new Point();
    xAlign : Alignment = Alignment.Left;
    yAlign : Alignment = Alignment.Left;

    constructor(parent : UIControl | undefined)
    {
        if (parent !== undefined)
        {
            this.updateParent(parent);
        }
    }

    updateParent(parent : UIControl | undefined)
    {
        if (this.parent !== undefined) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        }
        this.parent = parent;
        if (this.parent !== undefined) {
            this.parent.children.push(this);
        }
    }

    computeInitialLayout(layoutCycle : number) : void
    {
        // Already computed initial layout - skip
        if (layoutCycle <= this._layoutInfo.lastInitialLayoutCycle) return;
        this._layoutInfo.lastInitialLayoutCycle = layoutCycle;

        // Reset layout info
        this._layoutInfo.actualSize = { ...this.size };

        // Calculate size-to-children as possible
        for (var child of this.children)
        {
            child.computeInitialLayout(layoutCycle);
            if (this.size.x === undefined && (this._layoutInfo.actualSize.x === undefined || child._layoutInfo.actualSize.x > this._layoutInfo.actualSize.x)) {
                this._layoutInfo.actualSize.x = child._layoutInfo.actualSize.x + (Math.max(0, this.margin.left) + Math.max(0, this.margin.right));
            }
            if (this.size.y === undefined && (this._layoutInfo.actualSize.y === undefined || child._layoutInfo.actualSize.y > this._layoutInfo.actualSize.y)) {
                this._layoutInfo.actualSize.y = child._layoutInfo.actualSize.y + (Math.max(0, this.margin.top) + Math.max(0, this.margin.bottom));
            }
        }
    }

    computeFinalLayout(layoutCycle : number) : void
    {
        // Already computed final layout - skip
        if (layoutCycle <= this._layoutInfo.lastFinalLayoutCycle) return;
        this._layoutInfo.lastFinalLayoutCycle = layoutCycle;

        // Calculate size as necessary
        if (this._layoutInfo.actualSize.x === undefined && this.parent !== undefined)
        {
            const marginExtra = -(Math.min(0, this.margin.left) + Math.min(0, this.margin.right));
            this._layoutInfo.actualSize.x = this.parent._layoutInfo.actualSize.x + marginExtra;
        }
        if (this._layoutInfo.actualSize.y === undefined && this.parent !== undefined)
        {
            const marginExtra = -(Math.min(0, this.margin.top) + Math.min(0, this.margin.bottom));
            this._layoutInfo.actualSize.y = this.parent._layoutInfo.actualSize.y + marginExtra;
        }

        // Calculate position
        this._layoutInfo.position.x = 0;
        this._layoutInfo.position.y = 0;
        if (this.parent !== undefined)
        {
            this._layoutInfo.position = { ...this.parent._layoutInfo.position };
            const marginX = Math.max(0, this.margin.left) + Math.max(0, this.margin.right);
            const marginY = Math.max(0, this.margin.top) + Math.max(0, this.margin.bottom);
            const extraX = this.parent._layoutInfo.actualSize.x - (this._layoutInfo.actualSize.x + marginX);
            const extraY = this.parent._layoutInfo.actualSize.y - (this._layoutInfo.actualSize.y + marginY);

            // Handle margins
            this._layoutInfo.position.x += this.margin.left;
            this._layoutInfo.position.y += this.margin.top;

            // Handle alignment
            if (this.xAlign == Alignment.Center) {
                this._layoutInfo.position.x += extraX / 2;
            }
            else if (this.xAlign == Alignment.Right) {
                this._layoutInfo.position.x += extraX;
            }
            if (this.yAlign == Alignment.Center) {
                this._layoutInfo.position.y += extraY / 2;
            }
            else if (this.yAlign == Alignment.Bottom) {
                this._layoutInfo.position.y += extraY;
            }
        }
        else
        {
            // Handle margins only
            this._layoutInfo.position.x += this.margin.left;
            this._layoutInfo.position.y += this.margin.top;
        }

        // Handle children
        for (var child of this.children)
        {
            child.computeFinalLayout(layoutCycle);
        }
    }

    abstract draw(context2d: CanvasRenderingContext2D) : void;

    drawHierarchy(context2d: CanvasRenderingContext2D) : void
    {
        this.draw(context2d);
        for (var child of this.children)
        {
            child.draw(context2d);
        }
    }
}


class ScoreStave extends UIControl
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
                context2d.stroke();
                offy += this.lineSpace;
            }
        }
        else {
            console.warn("Invalid layout on ScoreStave");
        }
    }
}

class ScorePage extends UIControl
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

class ScoreDocument
{
    staves : ScoreStave[] = [];
}

const page = new ScorePage(1024, 1280);

const score : ScoreDocument = {
    staves: [
        new ScoreStave(page),
        new ScoreStave(page)
    ]
};

var currentLayoutCycle : number = 0;

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
    page.drawHierarchy(context2d);
}

globalLayout();
globalDraw(context2d);

