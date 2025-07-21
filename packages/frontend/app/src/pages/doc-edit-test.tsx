import { useEffect, useMemo, useState } from 'react';
import { snapshotHelper } from '../components/doc-composer/snapshot-helper';
import type { Store } from '@blocksuite/affine/store';
import { DocEditor } from '@/components/doc-composer/doc-editor';
import { debounce } from 'lodash';
import { MarkdownText } from '@/components/ui/markdown';

const useTempDoc = () => {
  const [doc, setDoc] = useState<Store | null>(null);
  useEffect(() => {
    snapshotHelper.createStore('').then(doc => {
      if (doc) {
        setDoc(doc);
      }
    });
  }, []);
  return doc;
};

export const DocEditTest = () => {
  const doc = useTempDoc();
  const [markdown, setMarkdown] = useState('');
  const updateMarkdown = useMemo(() => {
    const update = (doc: Store) => {
      snapshotHelper.docToMarkdown(doc).then(markdown => {
        setMarkdown(markdown);
      });
    };
    return debounce(update, 1000);
  }, []);
  if (!doc) {
    return <div>Loading...</div>;
  }
  return (
    <div className="h-screen w-screen flex">
      <div className="flex-1 bg-amber-50">
        <DocEditor
          doc={doc}
          onChange={() => {
            updateMarkdown(doc);
          }}
        />
      </div>
      <div className="flex-1 bg-blue-200">
        <MarkdownText text={markdown} />
      </div>
    </div>
  );
};
