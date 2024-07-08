import { Cache } from "./cache"
import { ExtensionLogger } from "./util"

export const clearCache = (cachePool: Cache, extensionLog: ExtensionLogger) => {
    cachePool.clearAll()
    extensionLog.userLog("Cache cleared!")
}