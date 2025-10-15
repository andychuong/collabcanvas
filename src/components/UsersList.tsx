import React, { useState } from 'react';
import { User as UserType } from '../types';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';

interface UsersListProps {
  users: UserType[];
  currentUserId: string;
}

const USERS_PER_PAGE = 5;

export const UsersList: React.FC<UsersListProps> = React.memo(({ users, currentUserId }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const startIndex = currentPage * USERS_PER_PAGE;
  const endIndex = Math.min(startIndex + USERS_PER_PAGE, users.length);
  const displayedUsers = users.slice(startIndex, endIndex);
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return (
    <div className="bg-white border-4 border-gray-300 rounded-lg shadow-2xl p-4 w-64">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        Online Users ({users.length})
      </h3>
      
      <div className="space-y-2 min-h-[200px]">
        {displayedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-sm text-gray-700">
              {user.name}
              {user.id === currentUserId && (
                <span className="text-xs text-gray-500 ml-1">(you)</span>
              )}
            </span>
          </div>
        ))}
      </div>
      
      {/* Pagination controls - only show if more than 5 users */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
});

