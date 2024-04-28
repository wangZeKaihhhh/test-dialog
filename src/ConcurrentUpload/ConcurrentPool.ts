type ReqFn = () => Promise<any>
type CReqFn = (uniqueKey: UniqueKey) => Promise<any>
type UniqueKey = string
type WaitQueueItem = {
  uniqueKey: UniqueKey
  cReqFn: CReqFn
}
export default class ConcurrentRequest {
  private static pool = new Map<UniqueKey, CReqFn>()
  private static waitQueue: WaitQueueItem[] = []
  maxConcurrency = 5

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency
  }

  request(reqFn: ReqFn, uniqueKey: UniqueKey) {
    return new Promise((resolve, reject) => {
      // 判断运行池是否已满
      const isFull = ConcurrentRequest.pool.size >= this.maxConcurrency

      // 包装的新请求
      const newReqFn = (cKey: UniqueKey) => {
        return reqFn()
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
          .finally(() => {
            // 请求完成后，将该请求从运行池中删除
            ConcurrentRequest.pool.delete(cKey)
            // 从等待队列中取出一个新请求放入等待运行池执行
            const next = ConcurrentRequest.waitQueue.shift()
            if (next) {
              ConcurrentRequest.pool.set(next.uniqueKey, next.cReqFn)
              next.cReqFn(cKey)
            }
          })
      }

      if (isFull) {
        // 如果运行池已满，则将新的请求放到等待队列中
        ConcurrentRequest.waitQueue.push({ uniqueKey, cReqFn: newReqFn })
      } else {
        // 如果运行池未满，则向运行池中添加一个新请求并执行该请求
        ConcurrentRequest.pool.set(uniqueKey, newReqFn)
        newReqFn(uniqueKey)
      }
    })
  }

  destroy(uniqueKeys: UniqueKey[] = []) {
    if (!uniqueKeys.length) {
      ConcurrentRequest.waitQueue = []
      ConcurrentRequest.pool.clear()
    } else {
      ConcurrentRequest.waitQueue = ConcurrentRequest.waitQueue.filter(
        (q) => !uniqueKeys.includes(q.uniqueKey)
      )
      uniqueKeys.forEach((q) => ConcurrentRequest.pool.delete(q))
    }
  }
}
