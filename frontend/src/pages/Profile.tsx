import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const {user} = useAuth();
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="bg-white p-4 rounded-md shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={user?.name}
            className="w-full px-3 py-2 border rounded-md"
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={user?.email}
            className="w-full px-3 py-2 border rounded-md"
            readOnly
          />
        </div>
      </div>
    </div>
  )
}