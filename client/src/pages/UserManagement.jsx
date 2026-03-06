import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ROLES, ROLE_LABELS, ROLE_COLORS, formatDate, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlusCircle, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', role: ROLES.CUSTOMER, phone: '', isActive: true,
  });

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/users', { params });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filters]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ firstName: '', lastName: '', email: '', password: '', role: ROLES.CUSTOMER, phone: '', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updates = { ...formData };
        if (!updates.password) delete updates.password;
        await api.patch(`/users/${editingUser._id}`, updates);
        toast.success('User updated');
      } else {
        await api.post('/users', formData);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (userId, email) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: !isActive });
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="page-transition space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">User Management</h1>
          <p className="text-base-content/50 text-sm mt-1">{pagination.total} registered users</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-3">
            <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-[200px]">
              <HiOutlineMagnifyingGlass className="w-4 h-4 opacity-50" />
              <input type="text" placeholder="Search by name or email..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="grow" />
            </label>
            <select className="select select-bordered select-sm" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">All Roles</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select select-bordered select-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>User</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary rounded-full w-10 h-10">
                              <span className="text-xs font-bold">{getInitials(u.firstName, u.lastName)}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-base-content/40">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge badge-sm ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                      <td>
                        <label className="cursor-pointer">
                          <input type="checkbox" className="toggle toggle-sm toggle-success" checked={u.isActive} onChange={() => handleToggleActive(u._id, u.isActive)} />
                        </label>
                      </td>
                      <td>{u.isEmailVerified ? <span className="text-success text-xs">✓ Verified</span> : <span className="text-warning text-xs">Pending</span>}</td>
                      <td className="text-sm text-base-content/50">{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEditModal(u)} className="btn btn-ghost btn-xs"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(u._id, u.email)} className="btn btn-ghost btn-xs text-error"><HiOutlineTrash className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center py-4">
              <div className="join">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`join-item btn btn-sm ${p === pagination.page ? 'btn-primary' : ''}`} onClick={() => fetchUsers(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-display font-bold text-lg">{editingUser ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">First Name</span></label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input input-bordered input-sm" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Last Name</span></label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input input-bordered input-sm" required />
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Email</span></label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input input-bordered input-sm" required />
              </div>
              {!editingUser && (
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Password</span></label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input input-bordered input-sm" required={!editingUser} />
                </div>
              )}
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Role</span></label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="select select-bordered select-sm">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Phone</span></label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input input-bordered input-sm" />
              </div>
              {editingUser && (
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Active</span>
                    <input type="checkbox" className="toggle toggle-success" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                  </label>
                </div>
              )}
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
        </dialog>
      )}
    </div>
  );
};

export default UserManagement;
