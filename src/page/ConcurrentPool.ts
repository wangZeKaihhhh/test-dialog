type ReqFn = () => Promise<any>

export default class ConcurrentRequest {
  pool = new Set()
  waitQueue: ReqFn[] = []
  maxConcurrency = 5

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency
  }

  request = (reqFn: ReqFn) => {
    return new Promise((resolve, reject) => {
      // 判断运行池是否已满
      const isFull = this.pool.size >= this.maxConcurrency

      // 包装的新请求
      const newReqFn = () => {
        return reqFn()
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
          .finally(() => {
            // 请求完成后，将该请求从运行池中删除
            this.pool.delete(newReqFn)
            // 从等待队列中取出一个新请求放入等待运行池执行
            const next = this.waitQueue.shift()
            if (next) {
              this.pool.add(next)
              next()
            }
          })
      }

      if (isFull) {
        // 如果运行池已满，则将新的请求放到等待队列中
        this.waitQueue.push(newReqFn)
      } else {
        // 如果运行池未满，则向运行池中添加一个新请求并执行该请求
        this.pool.add(newReqFn)
        newReqFn()
      }
    })
  }
}
