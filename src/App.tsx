import { PhotoPreviewProvider } from "./PhotoPreview/PhotoPreviewProvider"
import { testPhotos } from "./flip/mock"
import useCreatePhotoPreview from "./PhotoPreview/hooks/useCreatePhotoPreview"

function TestList() {
  const { createPhotoPreview } = useCreatePhotoPreview()

  return (
    <section className="flex flex-wrap gap-4 max-h-full overflow-y-auto">
      {testPhotos.map(({ thumbnail, fullImage }, i) => (
        <div key={thumbnail + i}>
          <img
            src={thumbnail}
            alt=""
            onClick={(e) => {
              createPhotoPreview({
                e,
                visible: true,
                src: fullImage,
                maskSrc: thumbnail,
                width: 600,
                height: 600,
              })
            }}
          />
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
