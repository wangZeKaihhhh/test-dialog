import axios from "axios";

const UploadFileList = () => {
  const uploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (e) => {
      if (!e.target) return;
      const files: File[] = Array.from(e.target.files as File[]);
      const formData = new FormData();
      files.forEach((file) => {
        if (file) {
          formData.append("file", file);
        }
      });

      axios
        .post("http://localhost:3333/upload", formData)
        .then((res) => {
          console.log(res);
        })
        .catch((rea) => {
          console.log(rea);
        });
    };

    input.click();
  };

  return (
    <div>
      <button onClick={uploadFile}>点击上传</button>
    </div>
  );
};

export default UploadFileList;
