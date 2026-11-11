import { useEffect, useState } from 'react';
import axios from 'axios';
import { PencilIcon, PlusIcon, TrashIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { UserForm } from './UserForm';
import styles from './UsersPage.module.css';
import ConfirmModal from '../../components/ConfirmModal';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'USUARIO';
  estado: string;
  foto_perfil: string | null;
  reset_token: string | null;
  reset_token_expiration: string | null;
}

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://apicomple-1.onrender.com/usuarios');
      setUsers(response.data);
      setError(null);
    } catch (fetchError) {
      console.error('Error al cargar usuarios:', fetchError);
      setError('Error al cargar los usuarios. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setSelectedUser(null);
    setError(null);
  };

  const handleEdit = (user: User) => {
    setError(null);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleNewUser = () => {
    setError(null);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleSave = async (userData: Partial<User>) => {
    setIsSaving(true);
    setError(null);
    try {
      if (selectedUser) {
        await axios.put(`https://apicomple-1.onrender.com/usuarios/${selectedUser.id}`, userData);
      } else {
        await axios.post('https://apicomple-1.onrender.com/auth/register', {
          ...userData,
          password: 'ContraseñaTemporal123!',
          confirmPassword: 'ContraseñaTemporal123!',
        });
      }

      await fetchUsers();
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (saveError) {
      console.error('Error al guardar el usuario:', saveError);
      setError('Error al guardar el usuario. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const userId = pendingDelete.id;
    setIsDeleting(true);
    try {
      await axios.delete(`https://apicomple-1.onrender.com/usuarios/${userId}`);
      setUsers((currentUsers) => currentUsers.map((user) =>
        user.id === userId ? { ...user, estado: 'INACTIVO' } : user
      ));
    } catch (deleteError) {
      console.error('Error al desactivar usuario:', deleteError);
      setError('No se pudo desactivar el usuario.');
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando usuarios...</div>;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Administración <span>/</span> Equipo</p>
          <h1>Usuarios</h1>
        </div>
      </header>

      <section className={styles.directory} aria-labelledby="users-title">
        <div className={styles.directoryHeader}>
          <div>
            <h2 id="users-title">Usuarios</h2>
            <p>Administra los accesos y roles de tu equipo.</p>
          </div>
          <button className={styles.createButton} type="button" onClick={handleNewUser}>
            <PlusIcon aria-hidden="true" />
            Nuevo usuario
          </button>
        </div>

        {error && !isModalOpen && <div className={styles.pageError} role="alert">{error}</div>}

        {users.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const initials = user.nombre.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
                  const isActive = user.estado === 'ACTIVO';

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userCell}>
                          {user.foto_perfil ? (
                            <img className={styles.avatar} src={user.foto_perfil} alt="" />
                          ) : (
                            <span className={styles.avatarFallback} aria-hidden="true">
                              {initials || <UserIcon />}
                            </span>
                          )}
                          <strong>{user.nombre}</strong>
                        </div>
                      </td>
                      <td className={styles.emailCell}>{user.email}</td>
                      <td className={styles.roleCell}>{user.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${isActive ? styles.active : styles.inactive}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.editButton}
                            type="button"
                            onClick={() => handleEdit(user)}
                            title={`Editar ${user.nombre}`}
                          >
                            <PencilIcon aria-hidden="true" />
                            Editar
                          </button>
                          <button
                            className={styles.deleteButton}
                            type="button"
                            onClick={() => setPendingDelete(user)}
                            disabled={!isActive}
                            title={isActive ? `Desactivar ${user.nombre}` : 'Usuario inactivo'}
                            aria-label={isActive ? `Desactivar ${user.nombre}` : `${user.nombre} inactivo`}
                          >
                            <TrashIcon aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>Todavía no hay usuarios registrados.</div>
        )}
      </section>

      <Dialog open={isModalOpen} onClose={closeModal} className={styles.dialogRoot}>
        <div className={styles.dialogBackdrop} aria-hidden="true" />
        <div className={styles.dialogScroll}>
          <div className={styles.dialogCenter}>
            <Dialog.Panel className={styles.dialogPanel}>
              <header className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Equipo</p>
                  <Dialog.Title className={styles.modalTitle}>
                    {selectedUser ? 'Editar usuario' : 'Agregar nuevo usuario'}
                  </Dialog.Title>
                </div>
                <button className={styles.modalClose} type="button" onClick={closeModal} disabled={isSaving} aria-label="Cerrar modal">
                  <XMarkIcon aria-hidden="true" />
                </button>
              </header>
              {error && isModalOpen && <div className={styles.modalError} role="alert">{error}</div>}
              <UserForm user={selectedUser} onSave={handleSave} onCancel={closeModal} isSaving={isSaving} />
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Desactivar usuario"
        message={<>¿Seguro que deseas desactivar a <strong>{pendingDelete?.nombre}</strong>?</>}
        confirmLabel="Sí, desactivar"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
};

export default UsersPage;