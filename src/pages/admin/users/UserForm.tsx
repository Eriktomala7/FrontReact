import { useState, useEffect } from 'react';
import type { User } from './UsersPage';
import styles from './UsersPage.module.css';


interface UserFormProps {
  user: User | null;
  onSave: (userData: Partial<User>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    nombre: '',
    email: '',
    rol: 'USUARIO',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        rol: user.rol || 'USUARIO',
        estado: user.estado || 'ACTIVO'
      });
    } else {
      setFormData({ nombre: '', email: '', rol: 'USUARIO', estado: 'ACTIVO' });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.userForm}>
      <div className={styles.formField}>
        <label htmlFor="nombre">
          Nombre
        </label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Nombre completo"
          disabled={isSaving}
          required
        />
      </div>

      <div className={styles.formField}>
        <label htmlFor="email">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="correo@empresa.com"
          disabled={isSaving}
          required
        />
      </div>

      <div className={styles.formField}>
        <label htmlFor="rol">
          Rol
        </label>
        <select
          id="rol"
          name="rol"
          value={formData.rol}
          onChange={handleChange}
          disabled={isSaving}
        >
          <option value="ADMIN">Administrador</option>
          <option value="USUARIO">Usuario</option>
        </select>
      </div>

      <div className={styles.formField}>
        <label htmlFor="estado">
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          value={formData.estado}
          onChange={handleChange}
          disabled={isSaving}
        >
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={isSaving}
          className={styles.submitButton}
        >
          {isSaving ? 'Guardando...' : user ? 'Guardar cambios' : 'Crear usuario'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={styles.cancelButton}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default UserForm;
