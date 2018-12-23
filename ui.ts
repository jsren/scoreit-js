
export enum Alignment
{
    Left = 0,
    Right = 1,
    Center = 3,
    Top = 0,
    Bottom = 1
}

export class Point
{
    x : number = 0;
    y : number = 0;
}

export class Rect
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

export class LayoutInfo
{
    lastInitialLayoutCycle : number;
    lastFinalLayoutCycle : number;
    position : Point = new Point();
    actualSize : Point = new Point();
}

export abstract class UIControl
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
