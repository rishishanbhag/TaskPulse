import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function RichTextEditor({ value, onChange, readOnly }: Props) {
  return (
    <div className="rich-text-editor rounded-md border border-gray-200 overflow-hidden bg-white [&_.ql-container]:min-h-[160px] [&_.ql-editor]:min-h-[140px] [&_.ql-editor]:text-sm">
      <ReactQuill theme="snow" value={value} onChange={onChange} readOnly={readOnly} modules={modules} />
    </div>
  );
}
