// src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, ShieldAlert, RefreshCw, Trash2, 
  Plus, Eye, EyeOff, Edit, X, Compass, Mail, Phone, MapPin 
} from 'lucide-react';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Salon owner creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    salonName: '',
    address: '',
    latitude: '9.0320',
    longitude: '38.7469',
  });

  // Edit Salon Modal State
  const [editingSalon, setEditingSalon] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    category: 'UNISEX',
    address: '',
    phone: '',
    email: '',
    bannerUrl: '',
    latitude: '9.0320',
    longitude: '38.7469',
    featured: false,
    isVerified: false,
  });

  const fetchAdminData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user || !['ADMIN', 'SUPER_ADMIN'].includes(userData.user.role)) {
        router.push('/settings?mode=login');
        return;
      }
      setUser(userData.user);

      // Fetch all salons
      const salonsRes = await fetch('/api/salons');
      const salonsData = await salonsRes.json();
      if (Array.isArray(salonsData)) {
        setSalons(salonsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyToggle = async (id: string, currentStatus: boolean) => {
    setVerifyingId(id);
    try {
      const res = await fetch('/api/dashboard/salons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: id,
          isVerified: !currentStatus,
        }),
      });

      if (res.ok) {
        fetchAdminData();
      } else {
        alert('Failed to update verification status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteSalon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salon? This action cannot be undone.')) return;

    setDeletingId(id);
    try {
      const res = await fetch('/api/dashboard/salons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonId: id }),
      });

      if (res.ok) {
        alert('Salon deleted successfully.');
        fetchAdminData();
      } else {
        alert('Failed to delete salon.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting salon');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateSalonOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);

    try {
      const res = await fetch('/api/dashboard/create-salon-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create salon owner');
        return;
      }

      setCreateSuccess(`Salon owner created successfully! Email: ${data.user.email}`);
      setFormData({ email: '', password: '', name: '', phone: '', salonName: '', address: '', latitude: '9.0320', longitude: '38.7469' });
      setShowCreateForm(false);
      setTimeout(() => fetchAdminData(), 1000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create salon owner');
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal and fill state
  const handleOpenEdit = (salon: any) => {
    setEditingSalon(salon);
    setEditError('');
    setEditSuccess('');
    setEditFormData({
      name: salon.name || '',
      description: salon.description || '',
      category: salon.category || 'UNISEX',
      address: salon.address || '',
      phone: salon.phone || '',
      email: salon.email || '',
      bannerUrl: salon.bannerUrl || '',
      latitude: String(salon.latitude ?? '9.0320'),
      longitude: String(salon.longitude ?? '38.7469'),
      featured: !!salon.featured,
      isVerified: !!salon.isVerified,
    });
  };

  const handleUpdateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalon) return;
    setEditError('');
    setEditSuccess('');
    setEditLoading(true);

    try {
      const res = await fetch('/api/dashboard/salons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: editingSalon.id,
          ...editFormData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update salon');
        return;
      }

      setEditSuccess('Salon details updated successfully!');
      setTimeout(() => {
        setEditingSalon(null);
        fetchAdminData();
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update salon');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
        <span className="text-sm text-zinc-550 font-bold">Loading admin panel...</span>
      </div>
    );
  }

  const pendingSalons = salons.filter((s) => !s.isVerified);
  const verifiedSalons = salons.filter((s) => s.isVerified);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-955 dark:text-zinc-50 tracking-tight">Admin Operations Panel</h1>
        <p className="text-sm text-zinc-500">Create salon owner accounts, verify portfolios, and manage listings directly</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Total Registered Salons</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{salons.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Awaiting Verification</span>
          <span className="text-2xl font-extrabold text-amber-500">{pendingSalons.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Verified Partners</span>
          <span className="text-2xl font-extrabold text-emerald-500">{verifiedSalons.length}</span>
        </div>
      </div>

      {/* Create Salon Owner Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Create Salon Owner Account</h2>
              <p className="text-xs text-zinc-500">Directly provision a new owner profile and salon storefront</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
              showCreateForm 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {showCreateForm ? 'Cancel' : 'Register Salon Owner'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSalonOwner} className="flex flex-col gap-4 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-4 duration-300">
            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold">{createError}</div>
            )}
            {createSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 text-xs font-bold">{createSuccess}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Owner Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Saba Tesfaye"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Salon Store Name</label>
                <input
                  type="text"
                  required
                  value={formData.salonName}
                  onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
                  placeholder="e.g. Saba's Luxury Salon"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. owner@salon.com"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0911222333"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Temporary Password</label>
                <div className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-55 dark:bg-zinc-950">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter owner credentials password"
                    className="flex-1 bg-transparent border-none text-xs focus:outline-none text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Edna Mall, Bole, Addis Ababa"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-all disabled:opacity-60 shadow-md shadow-emerald-500/10"
            >
              {createLoading ? 'Provisioning...' : 'Provision Salon Owner Account'}
            </button>
          </form>
        )}
      </div>

      {/* Salon Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Verification Queue */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500" /> Verification Queue ({pendingSalons.length})
          </h3>

          {pendingSalons.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-xs text-zinc-400 font-medium bg-white dark:bg-zinc-900/50">
              No new salon registration requests awaiting credentials validation.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingSalons.map((salon) => (
                <div key={salon.id} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-zinc-200 shrink-0">
                      <Image
                        src={salon.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=150'}
                        alt={salon.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-xs gap-0.5">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">{salon.name}</span>
                      <span className="text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {salon.address}</span>
                      <span className="text-zinc-400">Category: {salon.category} • {salon.email}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleVerifyToggle(salon.id, false)}
                      disabled={verifyingId === salon.id}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                    >
                      {verifyingId === salon.id ? '...' : 'Verify'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(salon)}
                      className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl bg-white dark:bg-zinc-900 transition-colors shadow-sm"
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSalon(salon.id)}
                      disabled={deletingId === salon.id}
                      className="p-2 border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors shadow-sm"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Verified Salon List */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> Active Verified listings ({verifiedSalons.length})
          </h3>

          {verifiedSalons.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-xs text-zinc-400 font-medium bg-white dark:bg-zinc-900/50">
              No verified listings in directory.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {verifiedSalons.map((salon) => (
                <div key={salon.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                      <Image
                        src={salon.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=150'}
                        alt={salon.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-xs gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{salon.name}</span>
                        {salon.featured && (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] px-1.5 py-0.5 font-extrabold rounded-full uppercase">Featured</span>
                        )}
                      </div>
                      <span className="text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {salon.address}</span>
                      <span className="text-zinc-400">Category: {salon.category} • {salon.phone}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleVerifyToggle(salon.id, true)}
                      disabled={verifyingId === salon.id}
                      className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 text-xs font-bold rounded-xl transition-colors shadow-sm"
                    >
                      {verifyingId === salon.id ? '...' : 'Unverify'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(salon)}
                      className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl bg-white dark:bg-zinc-900 transition-colors shadow-sm"
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSalon(salon.id)}
                      disabled={deletingId === salon.id}
                      className="p-2 border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl transition-colors shadow-sm"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Edit Salon Details Modal */}
      {editingSalon && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-105 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-md">Edit Salon Details</h3>
                <p className="text-xs text-zinc-500">Modify information for "{editingSalon.name}"</p>
              </div>
              <button 
                onClick={() => setEditingSalon(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-550 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold">{editError}</div>
            )}
            {editSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 text-xs font-bold">{editSuccess}</div>
            )}

            <form onSubmit={handleUpdateSalon} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Salon Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="WOMEN">Women</option>
                    <option value="MEN">Men</option>
                    <option value="KIDS">Kids</option>
                    <option value="UNISEX">Unisex</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Street Address</label>
                  <input
                    type="text"
                    required
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Description</label>
                  <textarea
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Describe business, specialties..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Banner URL</label>
                  <input
                    type="url"
                    value={editFormData.bannerUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, bannerUrl: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={editFormData.latitude}
                    onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={editFormData.longitude}
                    onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Status Toggles */}
                <div className="flex flex-col gap-4 sm:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Verified Business Partner</span>
                      <span className="text-[10px] text-zinc-400">Displays verified checkmark badge on maps and search results</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editFormData.isVerified}
                      onChange={(e) => setEditFormData({ ...editFormData, isVerified: e.target.checked })}
                      className="h-4.5 w-4.5 rounded border-zinc-350 text-amber-500 focus:ring-amber-550 bg-zinc-100 dark:bg-zinc-950 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Featured Placement</span>
                      <span className="text-[10px] text-zinc-400">Pin to top of home page recommendations slider and searches</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editFormData.featured}
                      onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                      className="h-4.5 w-4.5 rounded border-zinc-350 text-amber-500 focus:ring-amber-550 bg-zinc-100 dark:bg-zinc-950 cursor-pointer"
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingSalon(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                >
                  {editLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
