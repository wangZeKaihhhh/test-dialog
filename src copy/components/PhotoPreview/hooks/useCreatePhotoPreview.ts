import { useContext } from "react"
import { PhotoPreviewContext } from "../context/PhotoPreviewProvider"

const useCreatePhotoPreview = () => {
  const { updatePreviewInfo } = useContext(PhotoPreviewContext)

  return { createPhotoPreview: updatePreviewInfo }
}

export default useCreatePhotoPreview
