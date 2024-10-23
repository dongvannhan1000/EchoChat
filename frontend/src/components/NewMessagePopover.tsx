import React from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Avatar } from "@/components/ui/avatar";

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface NewMessagePopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  onSelectUser: (user: User) => void;
  onClose: () => void;
  users: User[];
}

export const NewMessagePopover: React.FC<NewMessagePopoverProps> = ({
  isOpen,
  onOpenChange,
  searchTerm,
  onSearch,
  onSelectUser,
  onClose,
  users
}) => {
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <div className="flex items-center justify-between p-2 border-b">
          <h2 className="text-sm font-semibold">New Message</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Command>
          <CommandInput
            placeholder="Search users..."
            value={searchTerm}
            onValueChange={onSearch}
          />
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {filteredUsers.map(user => (
              <CommandItem
                key={user.id}
                onSelect={() => onSelectUser(user)}
                className="flex items-center gap-2 p-2"
              >
                <Avatar className="h-8 w-8">
                  <img 
                    src={`/api/placeholder/32/32`} 
                    alt={user.name}
                    className="rounded-full"
                  />
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-gray-500">{user.email}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};