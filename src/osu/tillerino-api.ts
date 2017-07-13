import { IMessage } from 'irc';

import { ChannelSettings } from '../models/twitch-channels';
import { TwitchClient } from '../twitch/twitch-client';
import { BeatmapInfo, OsuApi } from './osu-api';
import { OsuClient } from './osu-client';

interface RequestEntry {
    callback: (response: string) => void;
    timer: NodeJS.Timer;
}

function formatMinutes(minutes: number): string {
    const m: number = Math.floor(minutes / 60);
    const s: number = minutes - 60 * m;

    return `${m}:${s <= 9 ? '0' + s : s}`;
}

export class TillerinoApi {
    private osuClient: OsuClient;
    private twitchClient: TwitchClient;
    private requestMap: Map<string, RequestEntry> = new Map<string, RequestEntry>();

    public constructor(osu: OsuClient, twitch: TwitchClient) {
        this.osuClient = osu;
        this.twitchClient = twitch;

        this.osuClient.getIrcClient().on('pm', (nick: string, text: string, message: IMessage) => {
            if (nick === 'Tillerino') {
                const tagPattern: RegExp = /^(.+)\s\s\s95%:\s(\d+)pp\s\|/ig;
                const tagArray: RegExpExecArray = tagPattern.exec(text);
                if (tagArray) {
                    const request: RequestEntry = this.requestMap.get(tagArray[1]);
                    if (request) {
                        clearTimeout(request.timer);
                        request.callback(text.substr(tagArray[1].length + 3));
                        this.requestMap.delete(tagArray[1]);
                    }
                }
            }
        });

        this.twitchClient.getIrcClient().on('chat', (channel, userstate, message, self) => {
            if (self) return;

            const osuPattern: RegExp = /(http|https):\/\/(osu.ppy.sh\/)(b|s)\/(\d+)/ig;
            const osuRequest: RegExpExecArray = osuPattern.exec(message);
            if (osuRequest) {
                let isSet: boolean = false;
                if (osuRequest[3] === 's') {
                    isSet = true;
                }

                OsuApi.getBeatmapInfo(osuRequest[4], isSet)
                    .then((beatmapInfo: BeatmapInfo[]) => {
                        if (beatmapInfo.length > 0) {
                            if (beatmapInfo[0].approved === '1') {
                                this.requestInfo(beatmapInfo[0].beatmap_id, `${beatmapInfo[0].artist} - ${beatmapInfo[0].title} [${beatmapInfo[0].version}]`, (response: string) => {
                                    this.twitchClient.getIrcClient().say(channel, `@${userstate['display-name']}: ${beatmapInfo[0].artist} - ${beatmapInfo[0].title} [${beatmapInfo[0].version}] (${response})`);
                                    const settings: ChannelSettings = this.twitchClient.getChannelSettings(channel);
                                    if (settings && settings.osunick) {
                                        this.osuClient.getIrcClient().say(settings.osunick.replace(/\s/g, '_'), `${userstate['display-name']} > [https://osu.ppy.sh/b/${beatmapInfo[0].beatmap_id} ${beatmapInfo[0].artist} - ${beatmapInfo[0].title} [${beatmapInfo[0].version}] (${response})]`);
                                    }
                                });
                            } else {
                                const length: number = parseFloat(beatmapInfo[0].total_length);
                                const stars: number = parseFloat(beatmapInfo[0].difficultyrating);
                                const ar: number = parseFloat(beatmapInfo[0].diff_approach);
                                const od: number = parseFloat(beatmapInfo[0].diff_overall);
                                const bpm: number = parseFloat(beatmapInfo[0].bpm);

                                this.twitchClient.getIrcClient().say(channel, `@${userstate['display-name']}: [Unranked] ${beatmapInfo[0].artist} - ${beatmapInfo[0].title} [${beatmapInfo[0].version}] (${formatMinutes(length)} ★ ${stars.toFixed(2)} ♫ ${bpm.toFixed(0)} AR${ar.toFixed(1)} OD${od.toFixed(1)})`);
                                const settings: ChannelSettings = this.twitchClient.getChannelSettings(channel);
                                if (settings && settings.osunick) {
                                    this.osuClient.getIrcClient().say(settings.osunick.replace(/\s/g, '_'), `${userstate['display-name']} > [https://osu.ppy.sh/b/${beatmapInfo[0].beatmap_id} [Unranked] ${beatmapInfo[0].artist} - ${beatmapInfo[0].title} [${beatmapInfo[0].version}] (${formatMinutes(length)} ★ ${stars.toFixed(2)} ♫ ${bpm.toFixed(0)} AR${ar.toFixed(1)} OD${od.toFixed(1)})]`);
                                }
                            }
                        }
                    })
                    .catch(() => {
                        this.twitchClient.getIrcClient().say(channel, `@${userstate['display-name']}: osu servers are not responding, try again later.`);
                    });
            }
        });
    }

    public requestInfo(beatmapId: string | number, tag: string, callback: (response: string) => void): void {
        const timer: NodeJS.Timer = setTimeout(() => {
            const request: RequestEntry = this.requestMap.get(tag);
            if (request) {
                request.callback('Tillerino is down.');
                this.requestMap.delete(tag);
            }
        }, 5000);
        this.requestMap.set(tag, { callback, timer });
        this.osuClient.getIrcClient().action('Tillerino', `is listening to [https://osu.ppy.sh/b/${beatmapId}]`);
    }
}
