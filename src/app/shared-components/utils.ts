export function buildTree(parse: any[]) {
    let res :any[] = [];
    parse.forEach(it => {
        if (!it.parentId) {
            it.disaplayName = it.name;
            res.push(it);
            res.push(...populateNode(it, parse, 1));
        }
    });
    return res;
}

function populateNode(node: any, parsedTree: any[], deep: number) {
    let res :any[] = [];
    parsedTree.forEach(it => {
        if (node.id == it.parentId) {
            it.disaplayName = "&nbsp;".repeat(3 * deep) + it.name;
            res.push(it);
            res.push(...populateNode(it, parsedTree, deep + 1));
        }
    });
    return res;
}