import { IconButton } from '@afk/component';
import type { Store } from '@blocksuite/affine/store';
import { Text } from '@blocksuite/affine/store';
import type { NoteBlockModel } from '@blocksuite/affine-model';
import { replaceIdMiddleware } from '@blocksuite/affine-shared/adapters';
import {
  ArrowLeftBigIcon,
  ArrowRightBigIcon,
  CloseIcon,
} from '@blocksuite/icons/rc';
import { useCallback, useEffect, useRef, useState } from 'react';

import { DocEditor } from '@/components/doc-composer/doc-editor';

interface PresentationModeProps {
  /** 文档对象 */
  doc: Store;
  /** 文档标题 */
  title: string;
  /** 关闭演示模式的回调 */
  onClose: () => void;
}

interface NoteBlockContentProps {
  /** note block 模型 */
  note: NoteBlockModel;
  /** 文档对象 */
  doc: Store;
}

/**
 * 渲染单个 note block 内容的组件
 */
function NoteBlockContent({ note, doc }: NoteBlockContentProps) {
  const [noteDoc, setNoteDoc] = useState<Store | null>(null);

  useEffect(() => {
    // 为当前 note block 创建临时文档
    const createNoteDoc = () => {
      try {
        const _doc = doc.workspace.createDoc();
        const transformer = doc.getTransformer([
          replaceIdMiddleware(doc.workspace.idGenerator),
        ]);
        const blockSnapshot = transformer.blockToSnapshot(note);
        if (!blockSnapshot) {
          console.error('Failed to create snapshot from note');
          return;
        }

        const linkedDoc = _doc.getStore();
        linkedDoc.load(() => {
          const rootId = linkedDoc.addBlock('affine:page', {
            title: new Text(''),
          });
          transformer
            .snapshotToBlock(blockSnapshot, linkedDoc, rootId)
            .catch(console.error);
        });

        setNoteDoc(linkedDoc);
      } catch (error) {
        console.error('Error creating note doc:', error);
      }
    };

    createNoteDoc();
  }, [note, doc]);

  if (!noteDoc) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <DocEditor doc={noteDoc} readonly={true} />
    </div>
  );
}

/**
 * 演示模式组件
 * 以 note block 为单位进行分页展示，支持全屏和导航
 */
export function PresentationMode({
  doc,
  title,
  onClose,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [noteBlocks, setNoteBlocks] = useState<NoteBlockModel[]>([]);
  const [showToolbars, setShowToolbars] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取文档中的所有 note blocks
  const getNoteBlocks = useCallback(() => {
    if (!doc?.root) return [];

    const notes = doc.root.children.filter((child): child is NoteBlockModel => {
      return (
        child.flavour === 'affine:note' &&
        child.props?.displayMode !== 'EdgelessOnly'
      );
    });

    return notes as NoteBlockModel[];
  }, [doc]);

  // 初始化 note blocks
  useEffect(() => {
    const blocks = getNoteBlocks();
    setNoteBlocks(blocks);
  }, [getNoteBlocks]);

  // 鼠标移动监听和工具栏自动隐藏
  useEffect(() => {
    const handleMouseMove = () => {
      setShowToolbars(true);

      // 清除之前的定时器
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // 设置新的定时器，2秒后隐藏工具栏
      hideTimeoutRef.current = setTimeout(() => {
        setShowToolbars(false);
      }, 2000);
    };

    document.addEventListener('mousemove', handleMouseMove);

    // 初始设置定时器
    hideTimeoutRef.current = setTimeout(() => {
      setShowToolbars(false);
    }, 2000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
          }
          break;
        case 'ArrowRight':
        case ' ': // 空格键
          e.preventDefault();
          if (currentSlide < noteBlocks.length - 1) {
            setCurrentSlide(currentSlide + 1);
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          // 允许上下箭头键进行页面滚动，不阻止默认行为
          break;
        case 'Escape':
          e.preventDefault();
          exitPresentation();
          break;
        case 'Home':
          e.preventDefault();
          setCurrentSlide(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentSlide(noteBlocks.length - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, noteBlocks.length]);

  // 进入全屏
  useEffect(() => {
    const enterFullscreen = async () => {
      if (containerRef.current && !document.fullscreenElement) {
        try {
          await containerRef.current.requestFullscreen();
        } catch (error) {
          console.warn('无法进入全屏模式:', error);
        }
      }
    };

    enterFullscreen();

    // 监听全屏状态变化
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // 退出全屏时关闭演示模式
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  const nextSlide = () => {
    if (currentSlide < noteBlocks.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const exitPresentation = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn('退出全屏失败:', error);
      }
    }
    onClose();
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < noteBlocks.length) {
      setCurrentSlide(index);
    }
  };

  if (noteBlocks.length === 0) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 bg-white text-gray-800 flex items-center justify-center z-50"
      >
        <div className="text-center">
          <h2 className="text-2xl mb-4">没有可演示的内容</h2>
          <p className="text-gray-600 mb-6">
            文档中没有找到可用于演示的 note blocks
          </p>
          <button
            onClick={exitPresentation}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            关闭演示
          </button>
        </div>
      </div>
    );
  }

  const currentNote = noteBlocks[currentSlide];

  // 获取当前页面应该显示的标题
  const getCurrentTitle = () => {
    if (currentSlide === 0) {
      // 第一页显示文档标题
      return title;
    } else {
      // 其他页显示 note 标题，如果没有则显示文档标题
      return currentNote?.props?.title || title;
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-white z-50 flex flex-col"
    >
      {/* 顶部工具栏 */}
      <div
        className={`absolute top-4 left-4 right-4 z-10 flex items-center justify-between backdrop-blur-sm bg-white/30 rounded-lg px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-opacity duration-300 ${
          showToolbars ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900 truncate">
            {getCurrentTitle()}
          </h1>
          <div className="text-sm text-gray-600">
            {currentSlide + 1} / {noteBlocks.length}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 导航按钮 */}
          <IconButton
            size="32"
            icon={<ArrowLeftBigIcon />}
            onClick={previousSlide}
            disabled={currentSlide === 0}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
          />
          <IconButton
            size="32"
            icon={<ArrowRightBigIcon />}
            onClick={nextSlide}
            disabled={currentSlide === noteBlocks.length - 1}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
          />

          {/* 关闭按钮 */}
          <IconButton
            size="32"
            icon={<CloseIcon />}
            onClick={exitPresentation}
            className="text-gray-600 hover:text-gray-900"
          />
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto">
        <div className="w-full h-full">
          {currentNote && (
            <div className="h-full w-full">
              {/* 显示当前 note block 的内容 */}
              <div className="w-full h-full overflow-auto">
                <div className="p-16">
                  <NoteBlockContent note={currentNote} doc={doc} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部页面指示器 */}
      <div
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 transition-opacity duration-300 ${
          showToolbars ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 bg-white bg-opacity-90 rounded-full px-4 py-2 shadow-lg border border-gray-200">
          {noteBlocks.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide
                  ? 'bg-blue-600'
                  : 'bg-gray-400 hover:bg-gray-600'
              }`}
              aria-label={`跳转到第 ${index + 1} 页`}
            />
          ))}
        </div>
      </div>

      {/* 键盘提示 */}
      <div
        className={`absolute bottom-4 right-4 text-xs text-gray-600 bg-white bg-opacity-90 rounded px-3 py-2 transition-opacity duration-300 shadow-lg border border-gray-200 ${
          showToolbars ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div>← → 导航 | ESC 退出 | 空格 下一页</div>
      </div>
    </div>
  );
}
