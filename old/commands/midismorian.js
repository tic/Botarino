// integer to scale the huamn default


// find ppm

// find total count

// find mass and volume of midismorians
// .75 nm^2

// find bacteria count
// 3.8 * 10^13 bacteria in reference human


const Command = require('../superComponents/Command');
const assert = require('assert');


const ref_count = 30 * (10**12) * 2000 * (Math.PI + 1) / Math.PI;
const ref_blood_cells = 5 * (10**6) * 7500;
const ref_midismorian_mass = 10**-13 / 1000; // 2 * (10**-10) / 2000  |||| (20% of cell mass * 1 nanogram / 2000 per cell => conv. kg)
const ref_midismorians_per_liter = ((10**6) * 7500);


// 4.9e9 1.1e10
// white blood cells 7.5e9 (7500 / micro liter)
// 5 liters of blood in reference human


class Midismorian extends Command {
    constructor(Client, m, argv) {
        super(Client, m, argv);
        this.m = m;
        this.argv = argv;
    }

    async run() {
        try {
            switch(this.argv[1]) {
                case "ppm":
                    const ppm_scale = parseFloat(this.argv[2]);
                    assert(ppm_scale >= 0);
                    const ppm_count = parseFloat(this.argv[3].replace(/,/g, ""));
                    assert(ppm_count >= 0);
                    const ppm_value = (ref_blood_cells * ppm_scale) / ppm_count * (10**6);
                    this.m.channel.send(`Consider a being that is ${ppm_scale.toLocaleString("en")} times as large as the reference human (70 kg) and has ${ppm_count} midismorian${ppm_count === 1 ? "" : "s"}.\n This being has a midismorian density of \`${(Math.round(ppm_value * 100) / 100).toLocaleString("en")} ppm\` (white blood cells per million midismorians).`);
                    break;

                case "count":
                    const count_arg = parseFloat(this.argv[2])
                    assert(count_arg >= 0);
                    this.m.channel.send(`Consider a being that is ${count_arg.toLocaleString("en")} times as large as the reference human (70 kg).\nThis being contains \`${(ref_count * parseFloat(this.argv[2])).toLocaleString("en")}\` midismorians.`);
                    break;

                case "mass":

                    break;

                case "bacteria":

                    break;

                case "newppm":
                    const new_scale = parseFloat(this.argv[2]);
                    assert(new_scale >= 0);
                    let new_ppm = parseFloat(this.argv[2]);
                    assert(new_ppm >= 0);
                    let count = 0;
                    let unit = "";
                    switch(this.argv[4]) {
                        case "count":
                            // No need to find count.. it's done!
                            count = parseFloat(this.argv[5]);
                            break;

                        case "mass":
                            count = parseFloat(this.argv[5]) / ref_midismorian_mass;
                            unit = "kg` of";
                            break;

                        case "volume":
                            count = parseFloat(this.argv[5]) * ref_midismorians_per_liter;
                            unit = "L` of";
                            break;

                        default:
                            throw "Error in subcommand 'newppm': no valid unit defined"
                    }
                    let current_count = (new_scale * ref_blood_cells) / parseFloat(this.argv[3]); // ppm -> count
                    // ppm calculated with: white blood cells / midismorian count
                    new_ppm = (ref_blood_cells * new_scale) / (count + current_count) * 10**6;
                    this.m.channel.send(`Consider a being that is ${new_scale.toLocaleString("en")} times as large as the reference human (70 kg).\nThis being has consumed \`${parseFloat(this.argv[5]).toLocaleString("en")}${unit} midismorians.\nThe new midismorian density is \`${new_ppm.toLocaleString("en")} ppm\` (white blood cells per million midismorians)`);
                    break;

                default:
                    this.m.channel.send(`> See \`!help midismorian\` for valid subcommands.`);
            }
        } catch(err) {
            console.log(err);
        }
    }

    static help() {
        return `
> \`ppm <scale ref.> <count>\` - find midismorian density in parts per million white blood cells\n
> \`count <scale ref.>\` - calculate midismorian count in a given being\n
> \`mass \` - todo\n
> \`bacteria\` - todo\n
> \`newppm <scale ref.> <ppm> [count|mass(kg)|volume(L)] <consumed value>\` - \n
> \`convert\` - todo\n`;
    }
}

module.exports = Midismorian;
