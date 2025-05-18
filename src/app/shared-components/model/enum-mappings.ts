import {IEnum} from "./enum";

export const COMPARISON_LIST: IEnum[] = [{
    enum: 'EQUALS',
    display: 'Equals'
},
{
    enum: 'NOT_EQUALS',
    display: 'Not Equals'
},
{
    enum: 'CONTAINS',
    display: 'Contains'
},
{
    enum: 'NOT_CONTAINS',
    display: 'Not Contains'
}
];

export function getEnumDisplayByName(array: IEnum[], name: string) {
  return array.find(item => item.enum === name)?.display;
}
