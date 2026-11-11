// src/pages/user/Profile.tsx
import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Row, Col, Divider } from 'antd';
import { UserOutlined, UploadOutlined, SaveOutlined, LockOutlined } from '@ant-design/icons';
import { getCurrentUser, fetchCurrentUser, getUserById, updateUserProfile, updateUserPassword, uploadUserAvatar, fetchUserAvatarUrl, type User } from '../../services/authService';
import styles from './Profile.module.css';
interface UserProfile {
  nombre: string;
  email: string;
  avatarUrl?: string;
}

const Profile = () => {
  const [form] = Form.useForm<UserProfile>();
  const [passwordForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const local = getCurrentUser();
        if (local?.id) {
          setUser(local);
          try {
            const detail = await getUserById(local.id);
            form.setFieldsValue({ nombre: detail.nombre || '', email: detail.email || '' });
            if (detail.avatarUrl) {
              setAvatarUrl(detail.avatarUrl);
            } else {
              const url = await fetchUserAvatarUrl(local.id);
              if (url) setAvatarUrl(url);
            }
            return;
          } catch (e) {
            console.warn('Fallo getUserById, intento con fetchCurrentUser', e);
          }
        }
        const fetched = await fetchCurrentUser();
        if (fetched?.id) {
          setUser(fetched);
          const detail = await getUserById(fetched.id);
          form.setFieldsValue({ nombre: detail.nombre || '', email: detail.email || '' });
          if (detail.avatarUrl) {
            setAvatarUrl(detail.avatarUrl);
          } else {
            const url = await fetchUserAvatarUrl(fetched.id);
            if (url) setAvatarUrl(url);
          }
        } else {
          setUser(fetched);
        }
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const handleSave = async (values: UserProfile) => {
    try {
      setSaving(true);
      if (!user?.id) throw new Error('No se encontró el usuario autenticado');
      const updatedProfile = await updateUserProfile(user.id, { nombre: values.nombre.trim() });
      const updated = { ...user, nombre: updatedProfile.nombre || values.nombre.trim() };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      message.success('Perfil actualizado correctamente');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.warning('Las contraseñas nuevas no coinciden');
      return;
    }
    try {
      setSavingPwd(true);
      if (!user?.id) throw new Error('Usuario no válido');
      await updateUserPassword(user.id, values.newPassword);
      message.success('Contraseña actualizada');
      passwordForm.resetFields();
    } catch (e) {
      message.error('No se pudo actualizar la contraseña');
    } finally {
      setSavingPwd(false);
    }
  };

  const beforeUpload = async (file: File) => {
    try {
      if (!user?.id) {
        message.error('No se encontró el usuario autenticado');
        return false;
      }
      message.loading({ content: 'Subiendo foto...', key: 'uploadAvatar' });
      const urlFromUpload = await uploadUserAvatar(user.id, file);
      if (urlFromUpload) {
        setAvatarUrl(urlFromUpload);
      } else {
        // Fallback: consultar al backend la URL actual { foto_perfil }
        const url = await fetchUserAvatarUrl(user.id);
        if (url) setAvatarUrl(url);
      }
      message.success({ content: 'Foto actualizada', key: 'uploadAvatar' });
    } catch (e) {
      console.error(e);
      message.error({ content: 'Error al subir la foto', key: 'uploadAvatar' });
    }
    return false; // Evita upload automático de AntD
  };

  if (loadingUser) {
    return (
      <div className={styles.profilePage}>
        <Card className={styles.profileCard} title="Mi Perfil" loading bordered />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.profilePage}>
        <Card className={styles.profileCard} title="Mi Perfil" bordered>
          No hay un usuario autenticado. Por favor inicia sesión.
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card className={styles.profileCard} title="Mi Perfil" bordered>
            <div className={styles.profileAvatarRow}>
              <Avatar size={72} src={avatarUrl} icon={<UserOutlined />} />
              <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
                <Button icon={<UploadOutlined />}>Cambiar foto</Button>
              </Upload>
            </div>

            <Form
              form={form}
              className={styles.profileForm}
              layout="vertical"
              initialValues={{ nombre: user?.nombre || '', email: user?.email || '' }}
              onFinish={handleSave}
            >
              <Form.Item
                name="nombre"
                label="Nombre"
                rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
              >
                <Input placeholder="Tu nombre" />
              </Form.Item>

              <Form.Item name="email" label="Correo" tooltip="No editable" >
                <Input disabled />
              </Form.Item>

              <Form.Item className={styles.profileActions}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  Guardar cambios
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card className={styles.securityCard} title="Seguridad" bordered>
            <Form
              form={passwordForm}
              className={styles.securityForm}
              layout="vertical"
              onFinish={handlePasswordSave}
            >
              <Form.Item
                name="currentPassword"
                label="Contraseña actual"
                rules={[{ required: true, message: 'Ingresa tu contraseña actual' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="newPassword"
                    label="Nueva contraseña"
                    rules={[{ required: true, message: 'Ingresa una nueva contraseña' }]}
                  >
                    <Input.Password placeholder="Nueva contraseña" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="confirmPassword"
                    label="Confirmar contraseña"
                    dependencies={['newPassword']}
                    rules={[{ required: true, message: 'Confirma tu nueva contraseña' }]}
                  >
                    <Input.Password placeholder="Confirmar contraseña" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item className={styles.profileActions}>
                <Button type="primary" htmlType="submit" icon={<LockOutlined />} loading={savingPwd}>
                  Actualizar contraseña
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;