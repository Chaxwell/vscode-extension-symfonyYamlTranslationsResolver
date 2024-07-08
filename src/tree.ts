import * as yaml from 'yaml'

type BlockItem = yaml.CST.BlockMap['items'][0] | yaml.CST.CollectionItem
type BlockCollection = yaml.CST.BlockMap | yaml.CST.BlockSequence | yaml.CST.FlowCollection
export type TranslationNode = {key: string, text: string, line?: number, column?: number}
export type TranslationNodeMap = Map<TranslationNode['key'], TranslationNode>

export const traverseTree = (root: yaml.CST.BlockMap, storage: TranslationNodeMap, getPosition: yaml.LineCounter['linePos']): void => {
    const nodeList: TranslationNode[] = []
    const nodeTraverser = createNodeTraverser(storage, getPosition)

    nodeTraverser(new Node(root), nodeList)
}

class Node {
    private token: yaml.CST.Token
    private children?: Node[] = []

    constructor(token: yaml.CST.Token) {
        this.token = token
        this.children = undefined
    }

    public getData(): any {
        if (this.isBlockItem(this.token)) {
            if (this.isValueScalar(this.token)) {
                return yaml.CST.resolveAsScalar(this.token?.value as yaml.CST.Token)?.value ?? ""
            }
        }

        return null
    }

    public getKey(): any {
        if (this.isBlockItem(this.token)) {
            return this.resolveKey(this.token)
        }

        return null
    }

    public getChildren(): Node[] {
        if (this.children !== undefined) {
            return this.children
        }

        this.children = []
        let token = this.token

        if (this.isBlockItem(this.token)) {
            if (this.isValueCollection(this.token)) {
                token = this.token.value as BlockCollection
            }
        }


        if (yaml.CST.isCollection(token)) {
            for (const item of token.items) {
                this.children.push(new Node(item as yaml.CST.Token))
            }
        }

        return this.children
    }

    public getToken(): yaml.CST.Token {
        return this.token
    }

    private resolveKey = (item: BlockItem): string => {
        if (item?.key === null) {
            return ""
        }

        return yaml.CST.resolveAsScalar(item.key)?.value ?? ''
    }

    private isValueScalar = (item: BlockItem): boolean => {
        if (item?.value === null) {
            return false
        }

        return yaml.CST.isScalar(item.value)
    }

    private isValueCollection = (item: BlockItem): boolean => {
        if (item?.value === null) {
            return false
        }

        return yaml.CST.isCollection(item.value)
    }

    public isBlockItem = (item: Partial<yaml.CST.Token>): item is BlockItem => {
        return 'key' in item
    }
}

const createNodeTraverser = (storage: TranslationNodeMap, getPosition: yaml.LineCounter['linePos']) => {
    const nodeTraverser = (node: Node, nodeList: TranslationNode[]): void => {
        const key = node.getKey()
        const text = node.getData()

        if (key !== null || text !== null) {
            if (text !== null) {
                if (nodeList.length === 0) {
                    nodeList.push({key, text})
                } else {
                    const keys = nodeList.map(i => i.key).join('.') + '.' + key
                    nodeList.push({key: keys, text})
                }
            } else {
                nodeList.push({key, text})
            }
        }

        if (node.getChildren().length === 0) {
            const vectorItem = structuredClone(nodeList).pop()

            if (vectorItem) {
                const token = node.getToken()

                if (node.isBlockItem(token) && token?.value?.offset !== undefined) {
                    vectorItem.line = getPosition(token.value.offset).line
                }

                storage.set(vectorItem.key, vectorItem)
            }

            nodeList.pop()

            return
        }

        for (const child of node.getChildren()) {
            nodeTraverser(child, nodeList)
        }

        nodeList.pop()
    }

    return nodeTraverser
}