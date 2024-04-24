import axios, { AxiosProgressEvent, isCancel } from "axios"
import ConcurrentRequest from "./ConcurrentPool"
import { nanoid } from "nanoid"
import { useState } from "react"
import { TaskStatusEnum, FileItem } from "./types"

export class TaskQueue {
  uid: string = nanoid()
  type: "rotate" | "upload" = "upload"
  list: FileItem[] = []

  get isFinish() {
    return this.list.every((item) => item.status === TaskStatusEnum.Finish)
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
  const [queue, setQueue] = useState<TaskQueue[]>([])

  // 创建或者更新一个任务队列
  // 最新的一个任务队列里的任务都为已完成，则新创建一个任务队列，否则push进去
  const createOrUpdateQueue = (task: TaskQueue) => {
    const lastQueue = queue[queue.length - 1]
    if (lastQueue && lastQueue.isFinish) {
      setQueue([...queue, task])
    } else {
      lastQueue.list.push(...task.list)
      setQueue([...queue])
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

    createOrUpdateQueue(new TaskQueue({ list: initialTasks }))

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
            task: initialTasks[i],
            reqAbortController,
          }),
        })
      }
    })

    // 开始并发
    requestList.forEach((req, i) => {
      concurrentRequest
        .request(req)
        .then(() => {
          updateTask(initialTasks[i], { status: TaskStatusEnum.Finish })
        })
        .catch((rea) => {
          const target = initialTasks[i]
          if (isCancel(rea)) {
            // 取消的请求
            updateTask(target, { status: TaskStatusEnum.Canceled })
            return
          }
          updateTask(target, { status: TaskStatusEnum.Failed })
        })
    })
  }

  // 创建进度跟踪处理函数
  const createProgressHandler = ({
    startTime,
    task,
    reqAbortController,
  }: {
    startTime: number
    task: FileItem
    reqAbortController: AbortController
  }) => {
    return ({ loaded, total }: AxiosProgressEvent) => {
      if (!total) return
      const percent = Math.floor((loaded / total) * 100)
      const elapsedTime = Date.now() - startTime
      const estimatedTotalTime = (elapsedTime / percent) * 100
      const remainingTime = estimatedTotalTime - elapsedTime

      updateTask(task, {
        status: TaskStatusEnum.InProgress,
        percent,
        remainingTime,
        abort: () => {
          reqAbortController.abort()
        },
      })
    }
  }

  const updateTask = (task: FileItem, parameters: Partial<FileItem>) => {
    setTasks((prevTask) =>
      prevTask.map((t) => (t.uid === task.uid ? { ...t, ...parameters } : t))
    )
  }

  // 计算任务队列的总进度
  const calcTotalPercent = (tasks: FileItem[]) => {
    if (!tasks.length) return 0
    // 每个task的完成进度是0-100
    const totalPercent = tasks.length * 100
    let currentPercent = 0

    for (let i = 0, len = tasks.length; i < len; i++) {
      const target = tasks[i]
      if (target.status === TaskStatusEnum.Finish) {
        currentPercent += 100
      } else if (target.status === TaskStatusEnum.InProgress) {
        currentPercent += target.percent || 0
      }
    }

    return Math.floor((currentPercent / totalPercent) * 100)
  }

  // 格式化任务剩余完成时间
  const formatRemainingTime = (milliseconds: number) => {
    const minFormat = (value: number) => (value >= 0 ? value : 0)

    const seconds = minFormat(Math.ceil(Number(milliseconds) / 1000))
    const minutes = minFormat(Math.floor(seconds / 60))
    const remainingSeconds = minFormat(seconds % 60)

    if (minutes >= 1) {
      return `${minutes} 分钟 ${remainingSeconds} 秒`
    } else {
      return `${remainingSeconds} 秒`
    }
  }

  // 取消全部
  const abortAll = () => {
    setTasks((prevTasks) => {
      return prevTasks.map((t) => {
        t.abort && t.abort()
        return {
          ...t,
          status: TaskStatusEnum.Canceled,
        }
      })
    })
    concurrentRequest.destroy()
  }

  return {
    calcTotalPercent,
    uploadFile,
    formatRemainingTime,
    tasks,
    abortAll,
  }
}
