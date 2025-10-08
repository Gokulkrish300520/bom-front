import Link from "next/link";
import { FaChartLine } from "react-icons/fa";

export default function ReportsPage() {
  const reports = [
    {
      name: "Profit & Loss",
      href: "/books/reports/profit-loss",
      description: "View the detailed profit and loss report for your deals.",
      icon: <FaChartLine className="text-4xl text-blue-500" />,
    },
    // You can add more reports later
  ];

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-extrabold text-green-900 mb-9 drop-shadow-lg">
        Reports Center
      </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {reports.map((report) => (
          <Link
            key={report.name}
            href={report.href}
            className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 hover:scale-105"
          >
            <div className="mb-4">{report.icon}</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{report.name}</h2>
            <p className="text-gray-500 text-center">{report.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
