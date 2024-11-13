export default function Settings() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="bg-white p-4 rounded-md shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Theme</label>
          <select className="w-full px-3 py-2 border rounded-md">
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Notifications</label>
          <input type="checkbox" className="mr-2" />
          Enable notifications
        </div>
      </div>
    </div>
  )
}