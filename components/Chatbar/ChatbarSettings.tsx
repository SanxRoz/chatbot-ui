import { SupportedExportFormats } from '@/types/export';
import { PluginKey } from '@/types/plugin';
import { IconFileExport, IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { FC } from 'react';
import { Import } from '../Settings/Import';
import { Key } from '../Settings/Key';
import { SidebarButton } from '../Sidebar/SidebarButton';
import { ClearConversations } from './ClearConversations';

interface Props {
  lightMode: 'light' | 'dark';
  apiKey: string;
  serverSideApiKeyIsSet: boolean;
  conversationsCount: number;
  onToggleLightMode: (mode: 'light' | 'dark') => void;
  onApiKeyChange: (apiKey: string) => void;
  onClearConversations: () => void;
  onExportConversations: () => void;
  onImportConversations: (data: SupportedExportFormats) => void;
  onPluginKeyChange: (pluginKey: PluginKey) => void;
  onClearPluginKey: (pluginKey: PluginKey) => void;
}

export const ChatbarSettings: FC<Props> = ({
  lightMode,
  apiKey,
  serverSideApiKeyIsSet,
  conversationsCount,
  onToggleLightMode,
  onApiKeyChange,
  onClearConversations,
  onExportConversations,
  onImportConversations,
}) => {
  const { t } = useTranslation('sidebar');

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-[#ffffff1a] pt-1 text-sm">
      {conversationsCount > 0 ? (
        <ClearConversations onClearConversations={onClearConversations} />
      ) : null}

      <Import onImport={onImportConversations} />

      <SidebarButton
        text={t('Export data')}
        icon={<IconFileExport size={18} />}
        onClick={() => onExportConversations()}
      />

      <SidebarButton
        text={lightMode === 'light' ? t('Dark mode') : t('Light mode')}
        icon={
          lightMode === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />
        }
        onClick={() =>
          onToggleLightMode(lightMode === 'light' ? 'dark' : 'light')
        }
      />

      {!serverSideApiKeyIsSet ? (
        <Key apiKey={apiKey} onApiKeyChange={onApiKeyChange} />
      ) : null}
    </div>
  );
};
