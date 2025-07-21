import { ParagraphViewExtension } from '@blocksuite/affine/blocks/paragraph/view';
import {
  type ViewExtensionContext,
  ViewExtensionManager,
  ViewExtensionProvider,
} from '@blocksuite/affine/ext-loader';
import { getInternalViewExtensions } from '@blocksuite/affine/extensions/view';

class ComposerViewExtensionProvider extends ViewExtensionProvider {
  override name = 'composer';

  override setup(context: ViewExtensionContext) {
    super.setup(context);
  }
}

let manager: ViewExtensionManager | null = null;
export function getComposerViewManager() {
  if (!manager) {
    manager = new ViewExtensionManager([
      ...getInternalViewExtensions(),
      ComposerViewExtensionProvider,
    ]);

    manager.configure(ParagraphViewExtension, {
      getPlaceholder: () => {
        return ''; // placeholder?
      },
    });
  }
  return manager;
}
