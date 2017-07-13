import { Model, model as ModelFactory } from 'mongoose';
import { client as TwitchIrcClient } from 'tmi.js';

import { ChannelModel, ChannelSchema, ChannelSettings } from '../models/twitch-channels';
import { OsuClient } from '../osu/osu-client';

export class TwitchClient {
    private twitchClient: any;
    private osuClient: OsuClient;
    private channelSetingsCache: Map<string, ChannelSettings> = new Map<string, ChannelSettings>();

    constructor(username: string, password: string) {
        this.twitchClient = TwitchIrcClient({
            identity: {
                username,
                password
            },
        });

        this.twitchClient.on('error', message => {
            console.log(`[ERROR - Twitch]: ${message}`);
        });

        this.twitchClient.connect().then(data => {
            console.log(`Connected to Twitch IRC on ${data[0]}:${data[1]}`);
            this.joinChannels();
        });
    }

    public getIrcClient(): any {
        return this.twitchClient;
    }

    public getChannelSettings(channel: string): ChannelSettings {
        return this.channelSetingsCache.get(channel);
    }

    public setOsuClient(client: OsuClient) {
        this.osuClient = client;
    }

    private joinChannels(): void {
        const channelModel: Model<ChannelModel> = ModelFactory<ChannelModel>('twitchsettings', ChannelSchema);
        channelModel.find().then((response: ChannelModel[]) => {
            for (const row of response) {
                this.channelSetingsCache.set(`#${row.channel}`, row.settings);
                this.twitchClient.join(row.channel).then(data => {
                    console.log(`[TwitchIRC] Joined channel: ${data[0]}`);
                });
            }
        });
    }
}
