import { IconX } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { FC } from 'react';

interface Props {
  placeholder: string;
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
}

export const Search: FC<Props> = ({ placeholder, searchTerm, onSearch }) => {
  const { t } = useTranslation('sidebar');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const clearSearch = () => {
    onSearch('');
  };

  return (
    <div className="relative flex items-center">
      <input
        className="w-full flex-1 rounded-lg border-0 bg-[#0000001a] px-4 py-3 pr-10 text-[14px] leading-3 text-[#1C1C1C] placeholder:text-[#0000004d] dark:bg-[#ffffff1a] dark:text-white dark:placeholder:text-[#ffffff33]"
        type="text"
        placeholder={t(placeholder) || ''}
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {searchTerm && (
        <IconX
          className="absolute right-4 cursor-pointer text-[#1C1C1C] hover:text-neutral-400 dark:text-neutral-300"
          size={18}
          onClick={clearSearch}
        />
      )}
    </div>
  );
};
