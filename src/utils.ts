// delay simulation function. Usage: await sleep(1000); to wait for 1 second
export function sleep(sleepTimeMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, sleepTimeMs));
}

// function returns current unix timestamp
export function now(): number {
    return +((new Date).getTime() / 1000).toFixed()
}

// dump variables to stdout and stop the application
function dd(...args: any[]) {
    console.log(...args);
    process.exit(0);
}
