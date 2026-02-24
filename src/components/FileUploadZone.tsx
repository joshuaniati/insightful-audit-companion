import { useRef } from "react";

interface UploadedFile {
  file: File;
  id: string;
}

interface FileUploadZoneProps {
  label: string;
  sublabel: string;
  files: UploadedFile[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  accept?: string;
}

const FileUploadZone = ({ label, sublabel, files, onAdd, onRemove, accept }: FileUploadZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
  };

  return (
    <div>
      <div className="bg-muted/50 border border-primary/30 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="font-heading font-semibold text-sm text-navy-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{sublabel}</div>
          </div>
          {files.length > 0 && (
            <span className="text-xs text-primary font-heading font-semibold">
              {files.length} file{files.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-xl py-8 px-5 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5"
      >
        <div className="text-2xl mb-2">📤</div>
        <p className="text-sm text-muted-foreground">
          Click or drag <span className="text-primary font-medium">PDFs, images, or text files</span> here
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept || ".pdf,.docx,.txt,.csv,.md"}
        className="hidden"
        onChange={(e) => e.target.files && onAdd(e.target.files)}
      />

      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2.5 bg-primary/8 border border-primary/20 rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-base">📄</span>
              <span className="flex-1 text-foreground truncate">{f.file.name}</span>
              <span className="text-xs text-muted-foreground">{formatSize(f.file.size)}</span>
              <button
                onClick={() => onRemove(f.id)}
                className="bg-transparent border-none text-muted-foreground hover:text-destructive cursor-pointer text-base px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
export type { UploadedFile };
