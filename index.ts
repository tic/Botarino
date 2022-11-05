import { initialize, setHandler } from './services/discord.service';
import { hypervisor, voiceUpdate } from './services/interactions.service';

initialize();
setHandler('messageCreate', hypervisor);
setHandler('voiceStateUpdate', voiceUpdate);
