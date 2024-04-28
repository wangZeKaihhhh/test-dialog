import UploadFileList from '@/components/ConcurrentUpload/UploadFileList';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/upload')({
  component: UploadFileList,
});
