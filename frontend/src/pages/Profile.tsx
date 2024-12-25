export default function Profile() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="bg-white p-4 rounded-md shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value="John Doe"
            className="w-full px-3 py-2 border rounded-md"
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value="john@example.com"
            className="w-full px-3 py-2 border rounded-md"
            readOnly
          />
        </div>
      </div>
    </div>
  )
}