import { IPagination } from "../shared-components/model/pagination.model";

export interface IMail {
    id?: number,
    user_id?: number,
    rule_id: number,
    rule_name: string,
    text: string,
    subject?: string,
    sender?: string,
    recipient?: string,
    attachments?: string,
    attachList?: string[],
    message_id?: string,
    converted?: number
    added_at?: Date,
    received?: Date

}

export interface IPaginatedMails extends IPagination {
    content: IMail[]
}