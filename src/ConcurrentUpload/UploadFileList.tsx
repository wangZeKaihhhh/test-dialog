import { Progress } from "@douyinfe/semi-ui";
import { useUploadQueue } from "./hooks/useUploadQueue";
import { TaskStatusEnumMap } from "./types";
import { formatRemainingTime } from "../page/utils";

const UploadFileList = () => {
  const { taskQueue, uploadFile, abortAll } = useUploadQueue();

  return (
    <div>
      <button onClick={uploadFile}>点击上传</button>

      <section className="flex flex-col gap-y-4">
        {taskQueue.map((t) => (
          <div
            key={t.uid}
            className="border border-solid border-blue rounded-2"
          >
            <section className="flex gap-x-3 items-center justify-between px-2 h-36px">
              <div>
                <span>剩余完成时间：</span>
                <span>{formatRemainingTime(t.totalRemainingTime)}</span>
              </div>

              <div className="w-200px">
                <Progress percent={t.totalPercent} showInfo />
              </div>

              <div>
                <button
                  onClick={() => {
                    abortAll(t.uid);
                  }}
                >
                  取消全部
                </button>
              </div>

              <div>
                <span>已完成：{t.totalFinished}</span>
                <span>总数：{t.list.length}</span>
              </div>
            </section>

            <section>
              {t.list.map((q) => (
                <div
                  key={q.uid}
                  className="flex gap-x-3 items-center justify-between px-2 h-36px mt-1"
                >
                  <div className="flex gap-x-2">
                    <div>
                      <span>name：</span>
                      <span>{q.file.name}</span>
                    </div>

                    <div className="flex">
                      <span>进度：</span>
                      <div className="w-200px">
                        <Progress showInfo percent={q.percent} />
                      </div>
                    </div>

                    <div>
                      <span>剩余时间</span>
                      <span>{formatRemainingTime(q.remainingTime)}</span>
                    </div>
                  </div>

                  <div>
                    <span>状态：</span>
                    <span>{TaskStatusEnumMap[q.status].label}</span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        ))}
      </section>
    </div>
  );
};

export default UploadFileList;
