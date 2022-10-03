// 1. Initialize discord client
// 2. Attach onMessage handler from services/interactions.service.ts

import { initialize, setHandler } from './services/discord.service';
import { hypervisor } from './services/interactions.service';

initialize();
setHandler('messageCreate', hypervisor);
