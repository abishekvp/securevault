export default function AdminDashboard() {
    return (
        <div className="p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-400">System Overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Users</h3>
                    <div className="mt-2 text-3xl font-bold text-white">1</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Vault Items</h3>
                    <div className="mt-2 text-3xl font-bold text-white">—</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">System Status</h3>
                    <div className="mt-2 text-3xl font-bold text-green-500">Healthy</div>
                </div>
            </div>
        </div>
    );
}
