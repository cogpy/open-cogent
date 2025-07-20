import { IconButton } from '@afk/component';
import { SignOutIcon } from '@blocksuite/icons/rc';

import { useAuthStore } from '@/store/auth';

export const UserInfo = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex items-center justify-between">
      {user?.name}
      <IconButton icon={<SignOutIcon />} onClick={logout} />
    </div>
  );
};
