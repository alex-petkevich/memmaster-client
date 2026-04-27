export type IPairType = 'TEXT' | 'FILE';

export interface IDictionaryPair {
  // name holds the actual key used for FormData (kept in sync below)
  id?: number;
  name: string;
  name_type: IPairType;
  /** Browser File object – only used locally, never sent to server */
  name_file?: File | null;
  /** Server-stored attachment path – received from / sent to server as 'name_file' in JSON */
  name_img?: string;

  value?: string;
  value_type: IPairType;
  /** Browser File object – only used locally, never sent to server */
  value_file?: File | null;
  /** Server-stored attachment path – received from / sent to server as 'value_file' in JSON */
  value_img?: string;

  is_remembered?: boolean;
  is_archived?: boolean;
}

export interface IDictionary {
  id?: number;
  folder_id?: number;
  user_id?: number;
  pairs?: IDictionaryPair[];
}
