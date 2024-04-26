import { useContext } from "react"
import { PhotoPreviewContext } from "../PhotoPreviewProvider"

const useCreatePhotoPreview = () => {
  const { updatePreviewInfo } = useContext(PhotoPreviewContext)

  return { createPhotoPreview: updatePreviewInfo }
}

export default useCreatePhotoPreview
