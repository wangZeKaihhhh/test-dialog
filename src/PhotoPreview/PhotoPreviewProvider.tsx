import { PropsWithChildren, createContext, MouseEvent } from "react"
import { useImmer, Updater } from "use-immer"
import Portal from "./Portal"
import PhotoPreviewContainer1 from "./PhotoPreviewContainer1"

export interface PhotoPreviewStore {
  visible: boolean
  src: string
  maskSrc: string
  width: number
  height: number
  e?: MouseEvent
}

export interface PhotoPreviewContextType {
  updatePreviewInfo: Updater<PhotoPreviewStore>
}
const initialContext: PhotoPreviewContextType = {
  updatePreviewInfo: () => {
    throw new Error(
      "You forgot to wrap your component in <PhotoPreviewProvider>."
    )
  },
}
export const PhotoPreviewContext =
  createContext<PhotoPreviewContextType>(initialContext)

export const PhotoPreviewProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [previewInfo, updatePreviewInfo] = useImmer<PhotoPreviewStore>({
    visible: false,
    src: "",
    maskSrc: "",
    width: 0,
    height: 0,
  })

  return (
    <PhotoPreviewContext.Provider value={{ updatePreviewInfo }}>
      <>
        {children}
        <Portal>
          <PhotoPreviewContainer1
            key={previewInfo.src}
            {...previewInfo}
            updatePreviewInfo={updatePreviewInfo}
          />
        </Portal>
      </>
    </PhotoPreviewContext.Provider>
  )
}
