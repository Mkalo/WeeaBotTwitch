import { Client as BanchoIrcClient, IMessage } from 'irc';

import { TwitchClient } from '../twitch/twitch-client';

export class OsuClient {
    private osuClient: BanchoIrcClient;
    private twitchClient: TwitchClient;

    constructor(userName: string, password: string) {
        this.osuClient = new BanchoIrcClient('irc.ppy.sh', userName, {
            port: 6667,
            userName,
            password,
            autoConnect: true
        });

        this.osuClient.on('error', (message: IMessage) => {
            console.log('[ERROR - Bancho]', message);
        });

        this.osuClient.on('motd', () => {
            console.log(`Connected to Bancho IRC on irc.ppy.sh:6667`);
        });
    }

    public setTwitchClient(client: TwitchClient) {
        this.twitchClient = client;
    }

    public getIrcClient(): BanchoIrcClient {
        return this.osuClient;
    }
}
