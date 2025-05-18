import { IRole } from "./role.model";
import { IPagination } from "../shared-components/model/pagination.model";

export interface IUser {
    id?: number,
    roles?: IRole[],
    username: string,
    firstname: string,
    lastname?: string,
    active?: Boolean,
    email?: string,
    lang?: string,
    created_at?: Date,
    last_modified_at?: Date
}

export interface IPaginatedUsers extends IPagination {
    content: IUser[]
}