import "react-photo-view/dist/react-photo-view.css"
import { PhotoPreviewProvider } from "./PhotoPreview/PhotoPreviewProvider"
import { mockImages } from "./flip/mock"
import useCreatePhotoPreview from "./PhotoPreview/hooks/useCreatePhotoPreview"

function TestList() {
  const { createPhotoPreview } = useCreatePhotoPreview()

  return (
    <section className="grid grid-cols-4 gap-4 h-full overflow-y-auto">
      {mockImages.map((src, i) => (
        <div
          key={src + i}
          onClick={(e) => {
            createPhotoPreview({
              e,
              visible: true,
              src,
            })
          }}
        >
          <img src={src} alt="" className="w-full" />
        </div>
      ))}
    </section>
  )
}

function App() {
  return (
    <PhotoPreviewProvider>
      <TestList />
    </PhotoPreviewProvider>
  )
}

export default App
