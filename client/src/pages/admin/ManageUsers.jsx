import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  function load() {
    api.get('/users').then((res) => setUsers(res.data.users));
  }
  useEffect(load, []);

  async function toggleActive(user) {
    await api.patch(`/users/${user._id}/status`, { isActive: !user.isActive });
    load();
  }

  return (
    <div className="container">
      <h2>Manage users</h2>
      <table className="card">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
              <td>
                <button onClick={() => toggleActive(u)}>
                  {u.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
