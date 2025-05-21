import { IUser } from "./user.model";

export interface IFolder {
    id?: number,
    uuid?: string,
    name: string,
    icon?: string,
    user?: IUser,
    parent_id?: number,
    public?: Boolean,
    active?: Boolean,
    created_at?: Date,
    last_modified_at?: Date
}