import * as request from 'request-promise';

const { osu_api_key }: { osu_api_key: string } = require('../../settings.json');

export interface BeatmapInfo {
    beatmap_id: string;
    beatmapset_id: string;
    approved: string;
    total_length: string;
    hit_length: string;
    version: string;
    file_md5: string;
    diff_size: string;
    diff_overall: string;
    diff_approach: string;
    diff_drain: string;
    mode: string;
    approved_date: string;
    last_update: string;
    artist: string;
    title: string;
    creator: string;
    bpm: string;
    source: string;
    tags: string;
    genre_id: string;
    language_id: string;
    favourite_count: string;
    playcount: string;
    passcount: string;
    max_combo: string;
    difficultyrating: string;
}

export class OsuApi {
    public static async getBeatmapInfo(id: string | number, isSet?: boolean): Promise<BeatmapInfo[]> {
        return request({
            uri: `https://osu.ppy.sh/api/get_beatmaps?k=${osu_api_key}&${isSet ? 's' : 'b'}=${id}&limit=1`,
            json: true
        });
    }
}
