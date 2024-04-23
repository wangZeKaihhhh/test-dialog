import axios from "axios"
import ConcurrentRequest from "./ConcurrentPool"

const concurrentRequest = new ConcurrentRequest(5)

const UploadFileList = () => {
  const uploadFile = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = "image/*"
    input.onchange = (e) => {
      if (!e.target) return
      const files: File[] = Array.from(e.target.files as File[])

      const requestList = files.map((file) => {
        return () => {
          const formData = new FormData()
          formData.append("file", file)
          return axios.post("http://localhost:3333/upload", formData)
        }
      })

      requestList.forEach((req) => {
        concurrentRequest
          .request(req)
          .then((res) => {
            console.log(res)
          })
          .catch((rea) => {
            console.log(rea)
          })
      })
    }

    input.click()
  }

  return (
    <div>
      <button onClick={uploadFile}>点击上传</button>
    </div>
  )
}

export default UploadFileList
