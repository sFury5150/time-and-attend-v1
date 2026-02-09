const RouteTest = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✓ Route Test Success</h1>
        <p className="text-xl text-gray-700 mb-4">
          If you can see this page, routing is working correctly!
        </p>
        <p className="text-gray-600">
          Current location: /dashboard/route-test
        </p>
        <p className="mt-6 text-sm text-gray-500">
          This page doesn't use DashboardLayout to isolate the issue.
        </p>
      </div>
    </div>
  );
};

export default RouteTest;
