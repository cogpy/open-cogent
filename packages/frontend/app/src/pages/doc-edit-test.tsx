import { useEffect, useState } from 'react';
import { snapshotHelper } from '../components/doc-composer/snapshot-helper';
import type { Store } from '@blocksuite/affine/store';
import { DocEditor } from '@/components/doc-composer/doc-editor';

const useTempDoc = () => {
  const [doc, setDoc] = useState<Store | null>(null);
  useEffect(() => {
    snapshotHelper.createStore('uuuu').then(doc => {
      if (doc) {
        setDoc(doc);
      }
    });
  }, []);
  return doc;
};

export const DocEditTest = () => {
  const doc = useTempDoc();
  if (!doc) {
    return <div>Loading...</div>;
  }
  return (
    <div className="h-screen w-screen">
      <DocEditor doc={doc} />
    </div>
  );
};
