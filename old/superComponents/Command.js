// Superclass for all Command objects. Provides basic method implementations for
// those subclasses which decline to provide an implementation.

class Command {
    constructor(Client, m, argv) {
        this.m = m;
    }

    // Subclasses should use cease() to end any timers, intervals,
    // and other closures which prevent garbage collection.
    cease() {
        this.m = null;
    }

    static help() {
        return `Help is unavailable on this command. Sorry!`;
    }

    async run() {
        this.m.channel.send("That command is missing a run method.");
    }
}

module.exports = Command;
