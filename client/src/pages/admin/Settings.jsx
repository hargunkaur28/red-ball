import PageHeader from '../../components/shared/PageHeader';

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Academy configuration" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-[#666666] mb-4">Academy Info</h3>
          <div className="space-y-3">
            <div><label className="block text-sm text-[#666666] mb-1">Academy Name</label><input className="input-field" defaultValue="Red Ball Cricket Academy" /></div>
            <div><label className="block text-sm text-[#666666] mb-1">Address</label><input className="input-field" defaultValue="123 Sports Complex" /></div>
            <div><label className="block text-sm text-[#666666] mb-1">GSTIN</label><input className="input-field" placeholder="Enter GSTIN" /></div>
            <div><label className="block text-sm text-[#666666] mb-1">Phone</label><input className="input-field" placeholder="+91 XXXXXXXXXX" /></div>
            <button className="btn-primary mt-2">Save Changes</button>
          </div>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-[#666666] mb-4">GST Settings</h3>
          <div className="space-y-3">
            <div><label className="block text-sm text-[#666666] mb-1">Default GST %</label><input type="number" className="input-field" defaultValue="18" /></div>
            <div><label className="block text-sm text-[#666666] mb-1">Restaurant GST %</label><input type="number" className="input-field" defaultValue="5" /></div>
            <button className="btn-primary mt-2">Update GST</button>
          </div>
        </div>
      </div>
    </div>
  );
}
