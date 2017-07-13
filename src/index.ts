import { OsuClient } from './osu/osu-client';
import { TillerinoApi } from './osu/tillerino-api';
import { TwitchClient } from './twitch/twitch-client';

import * as mongoose from 'mongoose';

const { mongodb, osu_user, osu_password, twitch_user, twitch_password }: { mongodb: string, osu_user: string, osu_password: string, twitch_user: string, twitch_password: string } = require('../settings.json');
(mongoose as any).Promise = global.Promise;
(mongoose as any).connect(mongodb, { useMongoClient: true });

const twitchClient: TwitchClient = new TwitchClient(twitch_user, twitch_password);
const osuClient: OsuClient = new OsuClient(osu_user, osu_password);
// TODO This is REALLY ugly, if possible think of a better way to do that.
twitchClient.setOsuClient(osuClient);
osuClient.setTwitchClient(twitchClient);

const tillerinoApi: TillerinoApi = new TillerinoApi(osuClient, twitchClient);
