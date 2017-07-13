import { Connection, Document, Model, Schema } from 'mongoose';

export interface ChannelSettings {
    osunick: string;
}

export interface Channel {
    channel: string;
    settings: ChannelSettings;
}

export interface ChannelModel extends Channel, Document {}

export const ChannelSchema: Schema = new Schema({
    channel: String,
    settings: {
        osunick: String
    }
});
