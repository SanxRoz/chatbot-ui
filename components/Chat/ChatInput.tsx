import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';
import {
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
} from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import {
  FC,
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';

interface Props {
  messageIsStreaming: boolean;
  model: OpenAIModel;
  conversationIsEmpty: boolean;
  prompts: Prompt[];
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
}

export const ChatInput: FC<Props> = ({
  messageIsStreaming,
  model,
  conversationIsEmpty,
  prompts,
  onSend,
  onRegenerate,
  stopConversationRef,
  textareaRef,
}) => {
  const { t } = useTranslation('chat');

  const [content, setContent] = useState<string>();
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);

  const promptListRef = useRef<HTMLUListElement | null>(null);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = model.maxLength;

    if (value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }

    setContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming) {
      return;
    }

    if (!content) {
      alert(t('Please enter a message'));
      return;
    }

    onSend({ role: 'user', content }, plugin);
    setContent('');
    setPlugin(null);

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        );
        return newContent;
      });
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }

    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setContent(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`;
    }
  }, [content]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full border-transparent pt-6 dark:border-white/20 md:pt-2">
      {messageIsStreaming && (
        <button
          className="top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded-lg border-0 bg-white py-2 px-4 text-black backdrop-blur dark:border-neutral-600 dark:bg-[#C6C7F8] dark:text-[#1C1C1C] md:mb-[10px] md:mb-0 md:mt-2"
          onClick={handleStopConversation}
        >
          <IconPlayerStop size={16} /> {t('Stop Generating')}
        </button>
      )}

      {!messageIsStreaming && !conversationIsEmpty && (
        <button
          className="dark:text-[#1C1C1C]text-[#1C1C1C] top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded-lg border-0 bg-white py-2 px-4 text-black text-[#1C1C1C] backdrop-blur dark:border-neutral-600
dark:bg-[#C6C7F8] md:mb-[10px] md:mb-0 md:mt-2"
          onClick={onRegenerate}
        >
          <IconRepeat size={16} /> {t('Regenerate response')}
        </button>
      )}
      <div className="border-t border-[#00000033] py-px backdrop-blur dark:border-[#ffffff33]">
        <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-3xl">
          <div className="relative mx-2 flex w-full flex-grow flex-col rounded-2xl border border-black/10 bg-white dark:bg-[#ffffff1a] dark:text-white sm:mx-4">
            <button
              className="absolute left-2 top-2 rounded-sm p-1 text-[#1C1C1C] opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={() => setShowPluginSelect(!showPluginSelect)}
              onKeyDown={(e) => {}}
            >
              {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
            </button>

            {showPluginSelect && (
              <div className="absolute left-0 bottom-14 rounded-lg bg-white dark:bg-[#ffffff1a]">
                <PluginSelect
                  plugin={plugin}
                  onPluginChange={(plugin: Plugin) => {
                    setPlugin(plugin);
                    setShowPluginSelect(false);

                    if (textareaRef && textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                />
              </div>
            )}

            <textarea
              ref={textareaRef}
              className="m-0 w-full resize-none rounded-2xl border-0 bg-transparent p-0 py-2 pr-8 pl-10 text-black backdrop-blur dark:bg-transparent dark:text-white dark:placeholder:text-[#ffffff33] md:py-3 md:pl-10"
              style={{
                resize: 'none',
                bottom: `${textareaRef?.current?.scrollHeight}px`,
                maxHeight: '400px',
                overflow: `${
                  textareaRef.current && textareaRef.current.scrollHeight > 400
                    ? 'auto'
                    : 'hidden'
                }`,
              }}
              placeholder={
                t('Type a message or type "/" to select a prompt...') || ''
              }
              value={content}
              rows={1}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />

            <button
              className="absolute right-2 top-2 rounded-sm p-1 text-[#1C1C1C] opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={handleSend}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
              ) : (
                <IconSend size={18} />
              )}
            </button>

            {showPromptList && filteredPrompts.length > 0 && (
              <div className="absolute bottom-12 mb-1.5 w-full">
                <PromptList
                  activePromptIndex={activePromptIndex}
                  prompts={filteredPrompts}
                  onSelect={handleInitModal}
                  onMouseOver={setActivePromptIndex}
                  promptListRef={promptListRef}
                />
              </div>
            )}

            {isModalVisible && (
              <VariableModal
                prompt={prompts[activePromptIndex]}
                variables={variables}
                onSubmit={handleSubmit}
                onClose={() => setIsModalVisible(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
