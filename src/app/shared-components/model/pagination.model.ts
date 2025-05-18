export interface IPagination {
    content: any[],
    pageable: IPageable,
    last: boolean,
    totalElements: number,
    totalPages: number,
    size: number,
    number: number,
    sort: ISort,
    first: boolean,
    numberOfElements: number,
    empty: boolean
}

export interface ISort {
    empty: boolean,
    sorted: boolean,
    unsorted: boolean
}

export interface IPageable {
    sort: ISort,
    offset: number,
    pageSize: number,
    pageNumber: number,
    unpaged: boolean,
    paged: boolean
}