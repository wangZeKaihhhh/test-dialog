import axios, { AxiosProgressEvent, isCancel } from "axios"
import ConcurrentRequest from "../ConcurrentPool"
import { nanoid } from "nanoid"
import { useState } from "react"
import { TaskStatusEnum, FileItem } from "../types"

export class TaskQueue {
  uid: string = nanoid()
  type: "rotate" | "upload" = "upload"
  list: FileItem[] = []

  get isFinish() {
    return this.list.every((item) => item.status === TaskStatusEnum.Finish)
  }

  get totalRemainingTime() {
    return this.list.reduce((prev, cur) => cur.remainingTime + prev, 0)
  }

  get totalPercent() {
    const totalPercent = this.list.length * 100
    let currentPercent = 0

    for (let i = 0, len = this.list.length; i < len; i++) {
      const target = this.list[i]
      if (target.status === TaskStatusEnum.Finish) {
        currentPercent += 100
      } else if (target.status === TaskStatusEnum.InProgress) {
        currentPercent += target.percent || 0
      }
    }

    return Math.floor((currentPercent / totalPercent) * 100)
  }

  get totalFinished() {
    return this.list.reduce(
      (prev, cur) => (cur.status === TaskStatusEnum.Finish ? prev + 1 : prev),
      0
    )
  }

  getTask(taskUid: string) {
    return this.list.findIndex((t) => t.uid === taskUid)
  }

  constructor(parameters: Partial<TaskQueue> = {}) {
    Object.assign(this, parameters)
  }
}

const concurrentRequest = new ConcurrentRequest(5)

// 计算任务队列总进度，有2种方案：
// 1. 以任务为维度，当任务状态改变时，更新进度，颗粒度较粗
// 2. 以任务的进度为维度，当任务的进度更新时，会经过一系列的换算，总进度跟着更新，颗粒度较细
// 这里选择第二种方案
export const useUploadQueue = () => {
  const [taskQueue, setTaskQueue] = useState<TaskQueue[]>([])

  // 创建或者更新一个任务队列
  // 最新的一个任务队列里的任务都为已完成，则新创建一个任务队列，否则push进去
  const createOrUpdateQueue = (initialTasks: FileItem[]) => {
    if (!taskQueue.length) {
      const newQueue = new TaskQueue({ list: initialTasks })
      setTaskQueue([newQueue])
      return newQueue
    }
    const lastQueue = taskQueue[taskQueue.length - 1]
    if (lastQueue.isFinish) {
      const newQueue = new TaskQueue({ list: initialTasks })
      setTaskQueue((prevTaskQueue) => [...prevTaskQueue, newQueue])
      return newQueue
    } else {
      setTaskQueue((prevTaskQueue) =>
        prevTaskQueue.map((t) =>
          t.uid === lastQueue.uid
            ? new TaskQueue({ ...t, list: [...t.list, ...initialTasks] })
            : t
        )
      )
      return lastQueue
    }
  }

  // 触发input file
  const uploadFile = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = "image/*"
    input.onchange = handleFileChange

    input.click()
  }

  // 上传文件处理
  const handleFileChange = (e: Event) => {
    if (!e.target) return
    const files: File[] = Array.from(e.target.files as File[])
    if (!files.length) return

    // 初始化
    const initialTasks: FileItem[] = files.map((file) => ({
      file,
      uid: nanoid(),
      percent: 0,
      remainingTime: 0,
      status: TaskStatusEnum.Queued,
    }))
    const queue = createOrUpdateQueue(initialTasks)

    const startTime = Date.now()

    // 定义请求列表
    const requestList = files.map((file, i) => {
      return () => {
        const reqAbortController = new AbortController()
        const formData = new FormData()
        formData.append("file", file)

        return axios.post("http://localhost:3333/upload", formData, {
          signal: reqAbortController.signal,
          onUploadProgress: createProgressHandler({
            startTime,
            taskUid: initialTasks[i].uid,
            queueUid: queue.uid,
            reqAbortController,
          }),
        })
      }
    })

    // 开始并发
    requestList.forEach((req, i) => {
      concurrentRequest
        .request(req, initialTasks[i].uid)
        .then(() => {
          updateTask({
            queueUid: queue.uid,
            parameters: {
              uid: initialTasks[i].uid,
              status: TaskStatusEnum.Finish,
            },
          })
        })
        .catch((rea) => {
          const target = initialTasks[i]
          if (isCancel(rea)) {
            // 取消的请求
            updateTask({
              queueUid: queue.uid,
              parameters: { uid: target.uid, status: TaskStatusEnum.Canceled },
            })
            return
          }
          updateTask({
            queueUid: queue.uid,
            parameters: { uid: target.uid, status: TaskStatusEnum.Failed },
          })
        })
    })
  }

  // 创建进度跟踪处理函数
  const createProgressHandler = ({
    startTime,
    taskUid,
    queueUid,
    reqAbortController,
  }: {
    startTime: number
    taskUid: string
    queueUid: string
    reqAbortController: AbortController
  }) => {
    return ({ loaded, total }: AxiosProgressEvent) => {
      if (!total) return
      const percent = Math.floor((loaded / total) * 100)
      const elapsedTime = Date.now() - startTime
      const estimatedTotalTime = (elapsedTime / percent) * 100
      const remainingTime = estimatedTotalTime - elapsedTime

      updateTask({
        queueUid,
        parameters: {
          uid: taskUid,
          status: TaskStatusEnum.InProgress,
          percent,
          remainingTime,
          abort: () => {
            reqAbortController.abort()
          },
        },
      })
    }
  }

  const updateTask = ({
    parameters,
    queueUid,
  }: {
    queueUid: string
    parameters: Partial<FileItem>
  }) => {
    setTaskQueue((prevTaskQueue) => {
      const n = prevTaskQueue.map((q) =>
        q.uid === queueUid
          ? new TaskQueue({
              ...q,
              list: q.list.map((t) =>
                t.uid === parameters.uid ? { ...t, ...parameters } : t
              ),
            })
          : q
      )
      return n
    })
  }

  // 取消全部
  const abortAll = (queueUid: string) => {
    setTaskQueue((prevTaskQueue) =>
      prevTaskQueue.map((q) =>
        q.uid === queueUid
          ? new TaskQueue({
              ...q,
              list: q.list.map((t) => {
                t.abort && t.abort()
                return {
                  ...t,
                  // status为已完成、异常的不改变状态
                  status:
                    t.status === TaskStatusEnum.Finish ||
                    t.status === TaskStatusEnum.Failed
                      ? t.status
                      : TaskStatusEnum.Canceled,
                }
              }),
            })
          : q
      )
    )

    // 根据queueUid筛选
    concurrentRequest.destroy(
      taskQueue.find((t) => t.uid === queueUid)?.list.map((t) => t.uid) || []
    )
  }

  return {
    taskQueue,
    uploadFile,
    abortAll,
  }
}
