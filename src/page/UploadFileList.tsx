import axios from "axios";
import ConcurrentRequest from "./ConcurrentPool";
import { useState } from "react";
import { uniqueId } from "lodash-es";
import { Progress } from "@douyinfe/semi-ui";

const concurrentRequest = new ConcurrentRequest(5);

interface FileItem {
  file: File;
  uid: string;
  percent: number;
  status: "fulfilled" | "rejected" | "pending";
}

const UploadFileList = () => {
  const [task, setTask] = useState<FileItem[]>([]);

  // 计算任务队列的总进度，范围0-100
  const calcTotalPercent = (tasks: FileItem[]) => {
    if (!tasks.length) return 0;
    // 每个task的完成进度是0-100
    const totalPercent = task.length * 100;
    let currentPercent = 0;

    for (let i = 0, len = tasks.length; i < len; i++) {
      const target = tasks[i];
      if (target.status === "rejected" || target.status === "fulfilled") {
        // 视为100
        currentPercent += 100;
      } else if (target.status === "pending") {
        currentPercent += target.percent || 0;
      }
    }

    return Math.floor((currentPercent / totalPercent) * 100);
  };

  const uploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (e) => {
      if (!e.target) return;
      const files: File[] = Array.from(e.target.files as File[]);
      if (!files.length) return;
      // 初始化
      const initialTasks: FileItem[] = files.map((file) => {
        return {
          file,
          uid: uniqueId(),
          percent: 0,
          status: "pending",
        };
      });

      setTask(initialTasks);

      const requestList = files.map((file, i) => {
        return () => {
          const formData = new FormData();
          formData.append("file", file);
          return axios.post("http://localhost:3333/upload", formData, {
            onUploadProgress({ total, loaded }) {
              if (!total) return;
              const percent = Math.floor((loaded / total) * 100);
              const target = initialTasks[i];
              setTask((prevTask) =>
                prevTask.map((t) =>
                  t.uid === target.uid ? { ...t, percent } : t
                )
              );
            },
          });
        };
      });

      requestList.forEach((req, i) => {
        concurrentRequest
          .request(req)
          .then(() => {
            const target = initialTasks[i];
            setTask((prevTask) =>
              prevTask.map((t) =>
                t.uid === target.uid ? { ...t, status: "fulfilled" } : t
              )
            );
          })
          .catch((rea) => {
            console.log(rea);
            const target = initialTasks[i];
            setTask((prevTask) =>
              prevTask.map((t) =>
                t.uid === target.uid ? { ...t, status: "rejected" } : t
              )
            );
          });
      });
    };

    input.click();
  };

  return (
    <div>
      <button onClick={uploadFile}>点击上传</button>
      <div>
        总进度：
        <Progress
          percent={calcTotalPercent(task) || 0}
          showInfo
          type="circle"
          aria-label="disk usage"
        />
      </div>
      <section className="flex flex-col gap-y-4">
        {task.map((t) => (
          <div
            key={t.uid}
            className="flex gap-x-3 items-center w-400px justify-between border border-solid border-blue h-36px rounded-2 px-2"
          >
            <div>{t.file.name}</div>
            <div className="w-200px">
              <Progress percent={t.percent || 0} showInfo />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default UploadFileList;
