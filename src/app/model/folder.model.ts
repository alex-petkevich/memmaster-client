import { IUser } from "./user.model";

export interface IFolder {
    id?: number,
    uuid?: string,
    name: string,
    icon?: string,
    lng_src?: string,
    lng_dest?: string,
    user?: IUser,
    parent_id?: number,
    is_public?: Boolean,
    active?: Boolean,
    created_at?: Date,
    last_modified_at?: Date,
    children?: IFolder[],
}