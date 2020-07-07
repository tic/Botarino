// It's an uptime counter. By default, the Bot updates it status every 4 seconds
// (the most possible (experimentally) without getting rate limited by Discord).

class UptimeTicker {
    constructor(update) {
        this.update = update;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;

        this.status = "Seinfeld for $H:$M:$S";
        this.statusOptions = {type: "WATCHING"};

        this.tick();
        this.intervalID = setInterval(this.tick.bind(this), 1000);
    }

    static INTERVAL = 4;
    static expander = n => n.toString().length !== 1 ? n.toString() : `0${n}`;

    cease() {
        clearInterval(this.intervalID);
        this.update = null;
    }

    getUptime(type) {
        if(type === "seconds") return this.seconds + this.minutes * 60 + this.hours * 3600;
        if(type === "all") return [this.hours, this.minutes, this.seconds];
        else return `${UptimeTicker.expander(this.hours)}:${UptimeTicker.expander(this.minutes)}:${UptimeTicker.expander(this.seconds)}`;
    }

    async updateStatus() {
        let formatted = this.status.replace("$H", UptimeTicker.expander(this.hours));
        formatted = formatted.replace("$M", UptimeTicker.expander(this.minutes));
        formatted = formatted.replace("$S", UptimeTicker.expander(this.seconds));
        this.update(formatted, this.statusOptions);
    }

    tick() {
        if(this.seconds % UptimeTicker.INTERVAL === 0) this.updateStatus();

        this.seconds++;
        if(this.seconds === 60) {
            this.seconds = 0;
            this.minutes++;
            if(this.minutes === 60) {
                this.minutes = 0;
                this.hours++;
            }
        }
    }

}

module.exports = UptimeTicker;
