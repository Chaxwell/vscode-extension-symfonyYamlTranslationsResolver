import { Parser, LineCounter } from 'yaml'
import { Token, Document } from 'yaml/dist/parse/cst'
import {PathOrFileDescriptor, readFileSync} from 'fs'
import { traverseTree, TranslationNode } from './tree'

export const extractNodes = (filepath: PathOrFileDescriptor): TranslationNode[] => {
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
        return []
    }

    if (document.value === undefined) {
        return []
    }

    if (document.value.type !== 'block-map') {
        return []
    }

    const result: TranslationNode[] = []
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