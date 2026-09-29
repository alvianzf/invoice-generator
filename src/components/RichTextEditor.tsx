import { useEffect, useId } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Redo2, Underline, Undo2 } from "lucide-react";
import { RichDoc } from "../types";

interface Props {
  label: string;
  value: RichDoc | null;
  onChange: (doc: RichDoc) => void;
}

/**
 * WYSIWYG field limited to what the PDF layout can print: paragraphs,
 * bold / italic / underline, and bullet or numbered lists.
 */
export default function RichTextEditor({ label, value, onChange }: Props) {
  const labelId = useId();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        link: false,
      }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: { class: "rich-editor-content", "aria-labelledby": labelId, "aria-multiline": "true", role: "textbox" },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
  });

  // Follow external changes (opening a saved quote, starting over).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value ?? { type: "doc", content: [] })) {
      editor.commands.setContent(value ?? "", { emitUpdate: false });
    }
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

  const tools = [
    { key: "bold", label: "Bold (Ctrl+B)", icon: <Bold size={15} />, run: () => editor?.chain().focus().toggleBold().run() },
    { key: "italic", label: "Italic (Ctrl+I)", icon: <Italic size={15} />, run: () => editor?.chain().focus().toggleItalic().run() },
    { key: "underline", label: "Underline (Ctrl+U)", icon: <Underline size={15} />, run: () => editor?.chain().focus().toggleUnderline().run() },
    null,
    { key: "bulletList", label: "Bulleted list", icon: <List size={15} />, run: () => editor?.chain().focus().toggleBulletList().run() },
    { key: "orderedList", label: "Numbered list", icon: <ListOrdered size={15} />, run: () => editor?.chain().focus().toggleOrderedList().run() },
  ] as const;

  return (
    <div className="rich-editor">
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-ink/[0.07] px-1.5 py-1" role="toolbar" aria-label={`${label} formatting`}>
        {tools.map((tool, i) =>
          tool === null ? (
            <span key={i} className="mx-1 h-5 w-px bg-ink/10" aria-hidden />
          ) : (
            <button
              key={tool.key}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={state?.[tool.key] ?? false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={tool.run}
              className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                state?.[tool.key] ? "bg-ruby-50 text-ruby-700 ring-1 ring-ruby-100" : "text-ink-mute hover:bg-white hover:text-ink"
              }`}
            >
              {tool.icon}
            </button>
          )
        )}
        <span className="flex-1" />
        <button type="button" title="Undo" aria-label="Undo" disabled={!state?.canUndo} onClick={() => editor?.chain().focus().undo().run()} className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-white hover:text-ink disabled:opacity-30">
          <Undo2 size={15} />
        </button>
        <button type="button" title="Redo" aria-label="Redo" disabled={!state?.canRedo} onClick={() => editor?.chain().focus().redo().run()} className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-white hover:text-ink disabled:opacity-30">
          <Redo2 size={15} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
