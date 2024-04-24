import { Progress, Toast } from "@douyinfe/semi-ui"
import { TaskStatusEnumMap, useUploadQueue } from "./useUploadQueue"

const UploadFileList = () => {
  const { tasks, uploadFile, calcTotalPercent, formatRemainingTime, abortAll } =
    useUploadQueue()

  return (
    <div>
      <button onClick={uploadFile}>点击上传</button>
      <button onClick={abortAll}>取消全部</button>
      <div>
        总进度：
        <Progress
          percent={calcTotalPercent(tasks) || 0}
          showInfo
          type="circle"
          aria-label="disk usage"
        />
      </div>
      <section className="flex flex-col gap-y-4">
        {tasks.map((t) => (
          <div
            key={t.uid}
            className="flex gap-x-3 items-center justify-between border border-solid border-blue h-36px rounded-2 px-2"
          >
            <div>{t.file.name}</div>
            <div>
              <span>剩余完成时间：</span>
              <span>{formatRemainingTime(t.remainingTime)}</span>
            </div>

            <div className="w-200px">
              <Progress percent={t.percent || 0} showInfo />
            </div>

            <div>
              <button
                onClick={() => {
                  if (t?.abort) {
                    t.abort()
                    Toast.success("取消成功")
                  }
                }}
              >
                取消请求
              </button>
            </div>

            <div>
              <span>状态：</span>
              <span>{TaskStatusEnumMap[t.status].label}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export default UploadFileList
