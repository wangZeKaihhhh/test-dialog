import { PropsWithChildren, createContext, MouseEvent } from "react"
import { useImmer, Updater } from "use-immer"
import Portal from "../../Portal"
import PhotoPreviewContainer from "../PhotoPreviewContainer"

export interface PhotoPreviewStore {
  visible: boolean
  e?: MouseEvent
  src: string
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
  })

  return (
    <PhotoPreviewContext.Provider value={{ updatePreviewInfo }}>
      <>
        {children}
        <Portal>
          <PhotoPreviewContainer
            {...previewInfo}
            updatePreviewInfo={updatePreviewInfo}
          />
        </Portal>
      </>
    </PhotoPreviewContext.Provider>
  )
}
