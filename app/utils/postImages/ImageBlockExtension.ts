import { Node, mergeAttributes } from '@tiptap/core';
import type { NodeConfig, CommandProps } from '@tiptap/core';

// Declare the custom command for image block support in TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attrs: { src: string; alt?: string; class?: string }) => ReturnType;
    };
  }
}

const ImageBlockExtension = Node.create<NodeConfig>({
  name: 'imageBlock',

  group: 'block+',
  inline: false,
  atom: true,
  selectable: true,
  draggable: true,
  defining: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      class: { default: 'image-block' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.image-block-wrapper > img[data-block-image]',
        getAttrs: (node) => {
          const img = node as HTMLImageElement;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            class: img.getAttribute('class'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      { class: 'image-block-wrapper' },
      ['img', mergeAttributes(HTMLAttributes, { 'data-block-image': 'true' })],
    ];
  },

  addCommands() {
    return {
      setImageBlock:
        (attrs) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: 'imageBlock',
            attrs,
          });
        },
    };
  },
});

export default ImageBlockExtension;
