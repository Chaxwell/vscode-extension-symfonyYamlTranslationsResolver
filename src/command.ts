import { Cache } from "./cache"
import { ExtensionLogger } from "./util"

export const createClearCacheCommand = (cachePool: Cache, extensionLog: ExtensionLogger) => {
    return () => {
        cachePool.clearAll()
        extensionLog.userLog("Cache cleared!")
    }
}