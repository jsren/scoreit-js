
const debug = true;

export function assert(condition : boolean, message? : string, ...data : any[]) : void
{
    if (debug && !condition) {
        console.assert(condition, message, ...data);
    }
}
