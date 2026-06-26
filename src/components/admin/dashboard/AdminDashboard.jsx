import { useState } from 'react';
import StatCards from './StatCards';
import SalesChart from './SalesChart';
import FinancialCharts from './FinancialCharts';
import RunningStatusViews from './RunningStatusViews';

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));

  return (
    <div className="flex flex-col space-y-6 overflow-y-auto pb-8 p-4 lg:p-6 bg-surface-950">
      {/* Policy Banner */}
      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-xl p-4 shadow-sm animate-fade-in">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-bold text-orange-800">DATA RETENTION POLICY UPDATE</h3>
            <div className="mt-1 text-sm text-orange-700 font-medium">
              <p>
                From 25/04/2026, AppThat POS will retain your data for last 730 days (2 years) only. Data older than 2 years will be permanently deleted.
              </p>
              <p className="mt-1 font-bold underline cursor-pointer text-brand-600 hover:text-brand-700">Click here to download the data.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 bg-surface-900 p-3 rounded-2xl shadow-sm border border-surface-750">
        <span className="text-sm font-bold text-surface-500 ml-2">
          Viewing Data For: <span className="text-surface-100">{new Date(selectedDate).toLocaleDateString()}</span>
        </span>
        <input 
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-surface-700 rounded-xl text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-surface-950 hover:bg-surface-900 transition-all font-bold text-surface-100 cursor-pointer"
        />
      </div>

      <StatCards date={selectedDate} />
      
      <SalesChart date={selectedDate} />
      
      <RunningStatusViews date={selectedDate} />

      <FinancialCharts date={selectedDate} />
      
    </div>
  );
}
