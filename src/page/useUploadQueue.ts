import axios, { AxiosProgressEvent, isCancel } from "axios"
import ConcurrentRequest from "./ConcurrentPool"
import { nanoid } from "nanoid"
import { useState } from "react"

export enum TaskStatusEnum {
  /**
   * 已完成
   */
  Finish,
  /**
   * 失败
   */
  Failed,
  /**
   * 进行中
   */
  InProgress,
  /**
   * 排队中
   */
  Queued,
  /**
   * 已取消
   */
  Canceled,
}

export const TaskStatusEnumMap: Record<
  TaskStatusEnum,
  { label: string; value: TaskStatusEnum }
> = {
  [TaskStatusEnum.Finish]: { label: "已完成", value: TaskStatusEnum.Finish },
  [TaskStatusEnum.Failed]: { label: "失败", value: TaskStatusEnum.Failed },
  [TaskStatusEnum.InProgress]: {
    label: "进行中",
    value: TaskStatusEnum.InProgress,
  },
  [TaskStatusEnum.Queued]: { label: "进行中", value: TaskStatusEnum.Queued },
  [TaskStatusEnum.Canceled]: {
    label: "已取消",
    value: TaskStatusEnum.Canceled,
  },
}

export interface FileItem {
  // 原始File
  file: File
  uid: string
  // 进度
  percent: number
  // 剩余完成时间，单位ms
  remainingTime: number
  // 任务状态
  status: TaskStatusEnum
  // 取消请求
  abort?: () => void
}

const concurrentRequest = new ConcurrentRequest(5)

export const useUploadQueue = () => {
  const [tasks, setTasks] = useState<FileItem[]>([])

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

    setTasks((prevTask) => [...prevTask, ...initialTasks])

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
