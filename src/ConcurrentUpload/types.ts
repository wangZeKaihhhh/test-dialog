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
