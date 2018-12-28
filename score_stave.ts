/* score_stave.ts - (c) 2018 James Renwick */
import { UIControl, Rect, LayoutInfo, Sizing, Point } from "./ui";
import { assert } from "./utils";

export enum NoteHead
{
    SemiBreve = 1,
    Minim = 2,
    Crochet = 3,
    Quaver = 4,
    SemiQuaver = 5
}

export enum NoteConnector
{
    None,
    JoinLeft,
    JoinRight,
    JoinBoth
}

export abstract class ScoreValue extends UIControl
{
    abstract draw(context2d: CanvasRenderingContext2D): void;
    timestamp : number = 0;
    duration : number = 0;
    positionOffset : Rect = new Rect();
}

export class ScoreChord extends ScoreValue
{
    notehead : NoteHead;
    connector : NoteConnector;
    notes : number;

    draw(context2d: CanvasRenderingContext2D): void
    {
        context2d.beginPath();
        context2d.ellipse(this._layoutInfo.position.x + 3.6, this._layoutInfo.position.y + 3.6,
                          2, 3, Math.PI / 4, 0, 2 * Math.PI);
        context2d.closePath();
        context2d.stroke();
    }
}

class StaffLayoutInfo extends LayoutInfo
{
    staffCenter : number;
}

export abstract class ScoreStaffItem extends UIControl
{
    timestamp : number = 0;
    duration : number = 0;
}

export enum BarLineStyle
{
    Single = 0,
    Double = 2
}

export class ScoreBarLine extends ScoreStaffItem
{
    style : BarLineStyle = BarLineStyle.Single;
    lineWidth : number = 1;
    lineSpacing : number = 1;

    computeInitialLayout(layoutCycle : number)
    {
        if (this.style == BarLineStyle.Single) {
            this.size.x = this.lineWidth;
        }
        else if (this.style == BarLineStyle.Double) {
            this.size.x = this.lineSpacing + this.lineWidth * 2;
        }
        else {
            assert(false, "Unknown barline style.");
        }
        super.computeInitialLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void
    {
        context2d.lineWidth = this.lineWidth;

        if (this.style == BarLineStyle.Single)
        {
            context2d.beginPath();
            context2d.moveTo(this._layoutInfo.position.x, this._layoutInfo.position.y);
            context2d.lineTo(this._layoutInfo.position.x, this._layoutInfo.position.y + this._layoutInfo.actualSize.y);
            context2d.closePath();
            context2d.stroke();
        }
        else if (this.style == BarLineStyle.Double)
        {
            context2d.beginPath();
            context2d.moveTo(this._layoutInfo.position.x, this._layoutInfo.position.y);
            context2d.lineTo(this._layoutInfo.position.x, this._layoutInfo.position.y + this._layoutInfo.actualSize.y);
            context2d.closePath();
            context2d.stroke();

            context2d.beginPath();
            context2d.moveTo(this._layoutInfo.position.x + this.lineSpacing, this._layoutInfo.position.y);
            context2d.lineTo(this._layoutInfo.position.x + this.lineSpacing, this._layoutInfo.position.y + this._layoutInfo.actualSize.y);
            context2d.closePath();
            context2d.stroke();
        }
    }
}

export class ScoreBar extends ScoreStaffItem
{
    values : ScoreValue[] = [];

    constructor(parent : UIControl)
    {
        super(parent);
        this._layoutInfo = new StaffLayoutInfo();
    }

    computeInitialLayout(layoutCycle : number)
    {
        // Already computed initial layout - skip
        if (layoutCycle <= this._layoutInfo.lastInitialLayoutCycle) return;

        // Compute margins for notes

        // Set stave midpoint

        super.computeInitialLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void
    {
        // TODO: draw notes etc.
    }
}

export class ScorePart
{
    startTime : number = 0;
    endTime : number = 0;
    items : ScoreStaffItem[] = [];
    instrument : string;
}

export class ScoreStaffLinesControl extends UIControl
{
    lineWidth : number = 1;
    lineCount : number = 5;
    lineSpacing : number = 3;

    constructor(parent : UIControl)
    {
        super(parent);
        this.size.x = undefined;
        this.xSizing = Sizing.ToParent;
    }

    computeInitialLayout(layoutCycle : number)
    {
        this.size.y = (this.lineCount * this.lineWidth) + (this.lineSpacing * (this.lineCount - 1));
        super.computeInitialLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void
    {
        var offx = this._layoutInfo.position.x;
        var offy = this._layoutInfo.position.y;
        for (var i = 0; i < this.lineCount; i++)
        {
            context2d.beginPath();
            context2d.lineWidth = this.lineWidth;
            context2d.moveTo(offx, offy);
            context2d.lineTo(offx + this._layoutInfo.actualSize.x, offy);
            context2d.closePath();
            context2d.stroke();
            offy += this.lineSpacing;
        }
    }
}

export class ScoreStaffControl extends UIControl
{
    lines : ScoreStaffLinesControl = new ScoreStaffLinesControl(this);
    part : ScorePart;
    items : ScoreStaffItem[] = [];
    private _itemWidth : number = 0;

    constructor(parent : UIControl, part : ScorePart)
    {
        super(parent);
        this.part = part;
        this.size.y = undefined;
        this.size.x = undefined;
        this.xSizing = Sizing.ToParent;
        this.ySizing = Sizing.ToChildren;
    }

    computeInitialLayout(layoutCycle : number)
    {
        // Already computed initial layout - skip
        if (layoutCycle <= this._layoutInfo.lastInitialLayoutCycle) return;

        // First pass - compute staff height, set vertical item margins
        this.lines.computeInitialLayout(layoutCycle);
        const linesStaffCenter = this.lines._layoutInfo.actualSize.y / 2
        var maxStaffCenter = linesStaffCenter;

        // Find max staff center
        this._itemWidth = 0;
        for (var item of this.items)
        {
            item.computeInitialLayout(layoutCycle);

            const center = (<StaffLayoutInfo>item._layoutInfo).staffCenter;
            if (center > maxStaffCenter) maxStaffCenter = center;

            this._itemWidth += item._layoutInfo.actualSize.x;
        }

        for (var item of this.items) {
            item.margin.top = maxStaffCenter - (<StaffLayoutInfo>item._layoutInfo).staffCenter;
        }

        // Arrange the staff lines
        this.lines.margin.top = maxStaffCenter - linesStaffCenter;

        super.computeInitialLayout(layoutCycle);
    }

    computeFinalLayout(layoutCycle : number) : void
    {
        // Already computed initial layout - skip
        if (layoutCycle <= this._layoutInfo.lastFinalLayoutCycle) return;

        const staffWidth = this.parent._layoutInfo.actualSize.x - this.parent.paddingSizeX();

        // Second pass of layout - set horizontal margins for items
        var offset = 0;
        const extra = ((staffWidth - this._itemWidth) / (this.items.length - 1)) | 0;
        for (var i = 0; i < this.items.length; i++)
        {
            const item = this.items[i];
            item.margin.left = offset;
            item.margin.right = 0;
            offset += item.size.x + (i + 1 < this.items.length ? extra : 0);
        }
        // With the item margins set, compute final layout
        super.computeFinalLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void { }
}

export class ScoreLineControl extends UIControl
{
    staves : ScoreStaffControl[] = [];
    startTime : number;
    lineSpacing : number = 20;

    constructor(parent : UIControl)
    {
        super(parent);
        this.size.y = undefined;
        this.size.x = undefined;
        this.xSizing = Sizing.ToParent;
        this.ySizing = Sizing.ToChildren;
    }

    computeInitialLayout(layoutCycle : number)
    {
        // Already computed initial layout - skip
        if (layoutCycle <= this._layoutInfo.lastInitialLayoutCycle) return;

        // Update child vertical margins
        var offset = this.padding.top;
        for (var staff of this.staves)
        {
            staff.margin.top = offset;
            staff.computeInitialLayout(layoutCycle);
            assert(!isNaN(staff._layoutInfo.actualSize.y + 0), "Invalid staff height");
            offset += staff._layoutInfo.actualSize.y + staff.marginSizeY() + this.lineSpacing;
        }
        super.computeInitialLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void { }
}

export class ScoreDocumentPage extends UIControl
{
    lines : ScoreLineControl[] = [];

    constructor(parent : UIControl)
    {
        super(parent);
        this.padding.left = 50;
        this.padding.right = 50;
        this.padding.top = 50;
        this.padding.bottom = 50;
    }

    computeInitialLayout(layoutCycle : number)
    {
        assert(<any>this.size.x, "Page must have fixed width");
        assert(<any>this.size.y, "Page must have fixed height");
        super.computeInitialLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void
    {
        context2d.fillStyle = 'red';
        context2d.fillRect(this._layoutInfo.position.x, this._layoutInfo.position.y,
                           this._layoutInfo.actualSize.x, this._layoutInfo.actualSize.y);
    }
}

export class ScoreDocument extends UIControl
{
    parts : ScorePart[] = [];
    pages : ScoreDocumentPage[] = [];
    lineSpace : number = 10;
    pageMargins : Rect = new Rect(10, 10, 10, 10);
    pagePadding : Rect = new Rect(10, 10, 10, 10);
    pageSize : Point;

    constructor(pageSize : Point)
    {
        super(undefined);
        this.size.x = undefined;
        this.size.y = undefined;
        this.xSizing = Sizing.ToChildren;
        this.ySizing = Sizing.ToChildren;

        this.pageSize = pageSize;
    }

    computeInitialLayout(layoutCycle : number) : void
    {
        // Already computed initial layout - skip
        if (layoutCycle <= this._layoutInfo.lastInitialLayoutCycle) return;

        const staffWidth = this.pageSize.x - (this.pagePadding.left + this.pagePadding.right);
        const staves : ScoreStaffControl[] = [];

        // Build staves
        for (var partIndex = 0; partIndex < this.parts.length; partIndex++)
        {
            var curWidth = 0;
            var curStaff = new ScoreStaffControl(this, this.parts[partIndex]);
            staves.push(curStaff);

            for (var staffItem of this.parts[partIndex].items)
            {
                staffItem.margin.left = 0;
                staffItem.margin.right = 0;
                staffItem.margin.top = 0;
                staffItem.margin.bottom = 0;

                // Compute bar size - this must not depend on parent size
                staffItem.computeInitialLayout(layoutCycle);
                assert(!isNaN(staffItem._layoutInfo.actualSize.x + staffItem._layoutInfo.actualSize.y),
                "Staff items must have fixed size after initial layout.");

                curWidth += staffItem._layoutInfo.actualSize.x + staffItem.marginSizeX();
                if (curWidth < staffWidth || curStaff.items.length == 0)
                {
                    curStaff.items.push(staffItem);
                    staffItem.updateParent(curStaff);
                }
                else {
                    curStaff = new ScoreStaffControl(this, this.parts[partIndex]);
                    staves.push(curStaff);
                }
            }

        }

        this.pages = [];
        var curPage = new ScoreDocumentPage(this);
        curPage.margin = { ...this.pageMargins };
        curPage.padding = { ...this.pagePadding };
        curPage.size = this.pageSize;

        const pageHeight = this.pageSize.y - curPage.paddingSizeY();
        let curHeight = 0;

        for (var staffIndex = 0; staffIndex < staves.length; staffIndex++)
        {
            var curLine = new ScoreLineControl(this);

            for (var partIndex = 0; partIndex < this.parts.length; partIndex++, staffIndex++) {
                curLine.staves.push(staves[staffIndex]);
                staves[staffIndex].updateParent(curLine);
            }
            curLine.computeInitialLayout(layoutCycle);
            curLine.margin.top = curHeight;
            curHeight += curLine._layoutInfo.actualSize.y;

            if (curHeight > pageHeight && curPage.lines.length != 0)
            {
                this.pages.push(curPage);
                curPage.updateParent(this);
                var curPage = new ScoreDocumentPage(this);
                curPage.margin = { ...this.pageMargins };
                curPage.padding = { ...this.pagePadding };
                curPage.size = this.pageSize;

                // TODO: support more layouts
                curPage.margin.left += this.pages.length * (this.pageSize.x + curPage.marginSizeX());
            }

            curPage.lines.push(curLine);
            curLine.updateParent(curPage);
            curHeight += this.lineSpace;
        }
        this.pages.push(curPage);
        curPage.updateParent(this);

        super.computeInitialLayout(layoutCycle);
    }

    draw(context2d: CanvasRenderingContext2D): void { }
}
