export type JsonStringifyable = string | number | boolean | null | JsonStringifyable[] | {[key: string]: JsonStringifyable}

export const mapStringifier = (key: any, value: any) => {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries())
        }
    }

    return value
}

export const mapParser = (key: any, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }

    return value;
}
