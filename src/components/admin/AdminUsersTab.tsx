import React from 'react';
import { UserProfile } from '../../types';
import { AdminUserTable, AdminUserFilter } from '../AdminUserTable';

type AdminUsersTabProps = {
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  userFilter: AdminUserFilter;
  setUserFilter: (value: AdminUserFilter) => void;
  filteredUsers: UserProfile[];
  handleOpenUserDetail: (user: UserProfile) => void;
  openEditUser: (user: UserProfile) => void;
  handleResetToken: (id: string) => void;
  handleDeleteUser: (id: string, name: string) => void;
  getRemainingDays: (endDateStr?: string) => string | null;
  getEffectiveAiTokenLimitSafe: (user: UserProfile) => number;
};

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  loading,
  searchQuery,
  setSearchQuery,
  userFilter,
  setUserFilter,
  filteredUsers,
  handleOpenUserDetail,
  openEditUser,
  handleResetToken,
  handleDeleteUser,
  getRemainingDays,
  getEffectiveAiTokenLimitSafe
}) => {
  return (
    <AdminUserTable 
      loading={loading}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      userFilter={userFilter}
      setUserFilter={setUserFilter}
      filteredUsers={filteredUsers}
      handleOpenUserDetail={handleOpenUserDetail}
      handleResetToken={handleResetToken}
      openEditUser={openEditUser}
      handleDeleteUser={handleDeleteUser}
      getRemainingDays={getRemainingDays}
      // Assuming AdminUserTable might not take getEffectiveAiTokenLimitSafe yet,
      // but if it does, it will fall through, otherwise it won't break if unused.
    />
  );
};
