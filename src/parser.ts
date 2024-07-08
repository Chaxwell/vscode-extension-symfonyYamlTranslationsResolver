import { Parser, LineCounter } from 'yaml'
import { Token, Document } from 'yaml/dist/parse/cst'
import {PathOrFileDescriptor, readFileSync} from 'fs'
import { traverseTree, TranslationNodeMap } from './tree'

export const extractNodes = (filepath: PathOrFileDescriptor): TranslationNodeMap => {
    const lineCounter = new LineCounter()
    const parser = new Parser(lineCounter.addNewLine)
    const tokens = parser.parse(
        readFileSync(
            filepath,
            {encoding: 'utf8'}
        )
    )
    const document = getDocument(tokens)

    if (document === null) {
        return new Map()
    }

    if (document.value === undefined) {
        return new Map()
    }

    if (document.value.type !== 'block-map') {
        return new Map()
    }

    const result: TranslationNodeMap = new Map()
    traverseTree(document.value, result, lineCounter.linePos)

    return result
}

const getDocument = (tokens: Generator<Token, void, unknown>): Document|null => {
    const next = tokens.next()

    if (next.done) {
        return null
    }

    if (next.value.type !== 'document') {
        return null
    }

    return next.value
}