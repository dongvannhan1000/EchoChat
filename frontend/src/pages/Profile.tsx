import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit3, 
  Camera,
  UserCheck,
  Clock,
  Loader2,
  X
} from "lucide-react";
import { useState, useRef } from "react";
import { formatMessageTime } from "@/utils/formatTime";
import { imageUploadService } from '@/services/imageUploadService';
import { toast } from 'sonner';
import { useUser } from '@/stores/useUser';
import { useEffect } from 'react';

export default function Profile() {
  
  const { user } = useAuth();
  const { selectedUser, setSelectedUser, updateLocalUserAvatar } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && (!selectedUser || selectedUser.id !== user.id)) {
      setSelectedUser(user);
    }
  }, [user, selectedUser, setSelectedUser]);

  useEffect(() => {
    console.log('selectedUser changed:', selectedUser?.avatar?.url);
  }, [selectedUser]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file using service
    const validation = imageUploadService.validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setSelectedAvatar(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setSelectedAvatar(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };


  const handleAvatarUpload = async () => {
    if (!selectedAvatar || !selectedUser) return;

    console.log(selectedUser);

    setIsUploadingAvatar(true);
    try {
      const uploadResult = await imageUploadService.uploadUserAvatar(selectedAvatar);
      updateLocalUserAvatar(uploadResult, selectedUser.id);

      toast.success('Avatar updated successfully!');
      setSelectedAvatar(null);
      setAvatarPreview(null);
      
    } catch (error) {
      toast.error('Failed to upload avatar');
      console.error('Avatar upload error:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveChanges = async () => {
    if (selectedAvatar) {
      await handleAvatarUpload();
      console.log(selectedUser)
    }
    setIsEditing(false);
  };

  const currentAvatarUrl = avatarPreview || selectedUser?.avatar?.url || '/placeholder.svg?height=40&width=40';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
          disabled={isUploadingAvatar}
          className="gap-2"
        >
          {isUploadingAvatar ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Edit3 className="h-4 w-4" />
          )}
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={currentAvatarUrl} 
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="h-8 w-8 rounded-full p-0 shadow-md"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      
                      {selectedAvatar && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={removeAvatar}
                          disabled={isUploadingAvatar}
                          className="h-8 w-8 rounded-full p-0 shadow-md"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      Active User
                    </Badge>
                  </div>
                  
                  {/* Avatar Preview Info */}
                  {selectedAvatar && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">
                        New avatar selected: {selectedAvatar.name}
                      </p>
                      <p className="text-xs text-blue-500">
                        Click "Save Changes" to update your avatar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Separator />
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={user.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                        {user.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Account Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Member Since</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      {formatMessageTime(user.createdAt.toString())}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">User ID</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 font-mono">
                      #{user.id.toString().padStart(6, '0')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Blocked Users</p>
                  <p className="text-sm text-gray-600">Users you've blocked</p>
                </div>
                <Badge variant={user.block.length > 0 ? "destructive" : "secondary"}>
                  {user.block.length}
                </Badge>
              </div>
              
              {user.block.length > 0 && (
                <Button variant="outline" size="sm" className="w-full">
                  Manage Blocked Users
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Account Overview</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <p className="text-sm text-gray-600">Days as member</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Avatar Input */}
      <input 
        ref={avatarInputRef} 
        type="file" 
        accept="image/*" 
        onChange={handleAvatarSelect} 
        className="hidden" 
        disabled={isUploadingAvatar}
      />
    </div>
  );
}