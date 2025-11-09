export type IPairType = 'TEXT' | 'FILE';

export interface IDictionaryPair {
  // name holds the actual key used for FormData (kept in sync below)
  id?: number;
  name: string;
  name_type: IPairType;
  name_file?: File | null;

  value?: string;
  value_type: IPairType;
  value_file?: File | null;
}

export interface IDictionary {
  id?: number;
  folder_id?: number;
  user_id?: number;
  pairs?: IDictionaryPair[];
}

