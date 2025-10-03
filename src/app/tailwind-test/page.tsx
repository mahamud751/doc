export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Tailwind CSS Test
        </h1>

        <p className="text-gray-600 text-center">
          If you see styled elements below, Tailwind CSS is working correctly!
        </p>

        <div className="space-y-4">
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-700">
              This should have a blue background and border
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Primary Button
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors">
              Secondary Button
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 bg-red-400 rounded"></div>
            <div className="h-12 bg-green-400 rounded"></div>
            <div className="h-12 bg-yellow-400 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
