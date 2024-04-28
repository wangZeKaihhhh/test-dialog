import justifiedLayout from '@/lib/justified-layout';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import mockData from '@/lib/imgmock';
import { PhotoPreviewProvider } from '@/components/PhotoPreview/context/PhotoPreviewProvider';
import useCreatePhotoPreview from '@/components/PhotoPreview/hooks/useCreatePhotoPreview';

function Index() {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const { createPhotoPreview } = useCreatePhotoPreview();

  const data = useMemo(
    () =>
      justifiedLayout(mockData, {
        containerWidth: window.innerWidth,
        targetRowHeightTolerance: 0.1,
        targetRowHeight: 200,
      }),
    [],
  );

  const rowVirtualizer = useVirtualizer({
    count: data.boxes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => data.boxes[index][0].height + 20,
    overscan: 2,
    // scrollMargin: parentRef.current?.offsetTop ?? 0,
    debug: true,
  });

  console.log('data :', data);

  return (
    <>
      <div ref={parentRef} className="w-full h-screen overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {data.boxes[virtualRow.index].map((item, index) => (
                <div
                  key={index}
                  style={{
                    width: item.width,
                    height: item.height,
                    backgroundColor: 'bisque',
                    position: 'absolute',
                    // top: item.top,
                    left: item.left,
                  }}
                  onClick={(e) => {
                    createPhotoPreview({
                      visible: true,
                      e,
                      src: item.url,
                    });
                  }}
                >
                  <img width="100%" height="100%" src={item.url} alt="" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute('/')({
  component: () => {
    return (
      <PhotoPreviewProvider>
        <Index />
      </PhotoPreviewProvider>
    );
  },
});
