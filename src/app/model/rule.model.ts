export interface IRule {
    id?: number,
    user_id?: number,
    name: string,
    active?: Boolean,
    stop_process_rules?: Boolean,
    save_in?: Boolean,
    priority?: number,
    save_in_parent_id?: any,
    processed?: number,
    created_at?: Date,
    last_modified_at?: Date,
    last_processed_at?: Date
    rule_conditions?: IRuleCondition[],
    rule_actions?: IRuleAction[]
}

export interface IRuleCondition {
  id?: number,
  rule_id?: number,
  type: string,
  cond: number,
  comparison_method: string,
  comparison_text?: string,
  created_at?: Date,
  last_modified_at?: Date,
}

export interface IRuleAction {
  id?: number,
  rule_id?: number,
  action: number,
  action_target?: string
  created_at?: Date,
  last_modified_at?: Date,
}