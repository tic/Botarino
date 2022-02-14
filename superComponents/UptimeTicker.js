// It's an uptime counter. By default, the Bot updates it status every 4 seconds
// (the most possible (experimentally) without getting rate limited by Discord).

class UptimeTicker {
    constructor(update) {
        this.update = update;
        this.startupTime = (new Date()).getTime();

        this.statusOptions = {type: "WATCHING"};

        this.tick();
        this.intervalID = setInterval(this.tick.bind(this), 3600000);
    }

    static expander = n => n.toString().length !== 1 ? n.toString() : `0${n}`;

    cease() {
        clearInterval(this.intervalID);
        this.update = null;
    }

    getUptime(type) {
        if(type === "seconds") return ((new Date()).getTime() - this.startupTime) / 1000;
        if(type === "all") {
            const timePassed = (new Date()).getTime() - this.startupTime;
            return [
                parseInt(timePassed / 3600000),
                parseInt((timePassed % 3600000) / 60000),
                parseInt((timePassed % 60000) / 1000)
            ];
        }
        else {
            const timePassed = (new Date()).getTime() - this.startupTime;
            const hours = parseInt(timePassed / 3600000);
            const minutes = parseInt((timePassed % 3600000) / 60000);
            const seconds = parseInt((timePassed % 60000) / 1000);

            return `${UptimeTicker.expander(hours)}:${UptimeTicker.expander(minutes)}:${UptimeTicker.expander(seconds)}`;
        }
    }

    async updateStatus() {
        const timePassed = (new Date()).getTime() - this.startupTime;
        const days = parseInt(timePassed / 86400000);
        const hours = parseInt((timePassed % 86400000) / 3600000);
        let timeStr = `${days > 0 ? `${days}d` : ""}${UptimeTicker.expander(hours)}h`;
        this.update(timeStr, this.statusOptions);
    }

    tick() {
        this.updateStatus();
    }

}

module.exports = UptimeTicker;
