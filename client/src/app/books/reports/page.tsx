// pages/reports/index.jsx
import Link from "next/link";

export default function ReportsPage() {
  const reports = [
    { name: "Profit and Loss", href: "/books/reports/profit-loss" },
    { name: "Balance Sheet", href: "/books/reports/balancesheet" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      {/* <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Report Categories</h2>
        <ul className="space-y-2">
          <li className="font-semibold text-gray-700">Business Overview</li>
          <li className="ml-4">
            <ul className="space-y-1">
              {reports.map((report) => (
                <li key={report.name}>
                  <Link
                    href={report.href}
                    className="text-blue-600 hover:underline"
                  >
                    {report.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </aside> */}

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Reports Center</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Link
              key={report.name}
              href={report.href}
              className="p-6 bg-white shadow rounded hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold">{report.name}</h2>
              <p className="text-gray-500 mt-2">View {report.name} report</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}