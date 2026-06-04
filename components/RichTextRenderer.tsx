"use client";

interface RichTextRendererProps {
    content: string;
    className?: string;
}

/**
 * Safely renders HTML content produced by the Tiptap rich text editor.
 * Uses the `prose` utility class (via globals.css custom styles) for
 * clean article typography.
 */
export default function RichTextRenderer({ content, className = "" }: RichTextRendererProps) {
    return (
        <div
            className={`rich-text-content ${className}`}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
