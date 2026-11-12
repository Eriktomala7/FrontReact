import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, Upload, message, Row, Col } from 'antd'
import {
  CheckCircleFilled,
  InfoCircleOutlined,
  LockOutlined,
  MailOutlined,
  RedoOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  fetchCurrentUser,
  fetchUserAvatarUrl,
  getCurrentUser,
  getUserById,
  requestPasswordReset,
  updateUserProfile,
  uploadUserAvatar,
  type User,
} from '../../services/authService'
import styles from './Profile.module.css'

interface UserProfile {
  nombre: string
  email: string
}

const Profile = () => {
  const [form] = Form.useForm<UserProfile>()
  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const local = getCurrentUser()
        if (local?.id) {
          setUser(local)
          try {
            const detail = await getUserById(local.id)
            form.setFieldsValue({ nombre: detail.nombre || '', email: detail.email || '' })
            if (detail.avatarUrl) {
              setAvatarUrl(detail.avatarUrl)
            } else {
              const url = await fetchUserAvatarUrl(local.id)
              if (url) setAvatarUrl(url)
            }
            return
          } catch (error) {
            console.warn('Fallo getUserById, intento con fetchCurrentUser', error)
          }
        }

        const fetched = await fetchCurrentUser()
        if (fetched?.id) {
          setUser(fetched)
          const detail = await getUserById(fetched.id)
          form.setFieldsValue({ nombre: detail.nombre || '', email: detail.email || '' })
          if (detail.avatarUrl) {
            setAvatarUrl(detail.avatarUrl)
          } else {
            const url = await fetchUserAvatarUrl(fetched.id)
            if (url) setAvatarUrl(url)
          }
        } else {
          setUser(fetched)
        }
      } finally {
        setLoadingUser(false)
      }
    }

    loadUser()
  }, [form])

  const handleSave = async (values: UserProfile) => {
    try {
      setSaving(true)
      if (!user?.id) throw new Error('No se encontró el usuario autenticado')
      const nombre = values.nombre.trim()
      const updatedProfile = await updateUserProfile(user.id, { nombre })
      const updated = { ...user, nombre: updatedProfile.nombre || nombre }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      message.success('Perfil actualizado correctamente')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No se pudo actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) {
      message.error('No se encontró el correo de la cuenta')
      return
    }

    try {
      setSendingReset(true)
      await requestPasswordReset(user.email)
      message.success(
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
      )
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'No se pudo enviar el enlace. Inténtalo de nuevo.',
      )
    } finally {
      setSendingReset(false)
    }
  }

  const beforeUpload = async (file: File) => {
    try {
      if (!user?.id) {
        message.error('No se encontró el usuario autenticado')
        return false
      }
      message.loading({ content: 'Subiendo foto...', key: 'uploadAvatar' })
      const urlFromUpload = await uploadUserAvatar(user.id, file)
      if (urlFromUpload) {
        setAvatarUrl(urlFromUpload)
      } else {
        const url = await fetchUserAvatarUrl(user.id)
        if (url) setAvatarUrl(url)
      }
      message.success({ content: 'Foto actualizada', key: 'uploadAvatar' })
    } catch (error) {
      console.error(error)
      message.error({ content: 'Error al subir la foto', key: 'uploadAvatar' })
    }
    return false
  }

  if (loadingUser) {
    return (
      <div className={styles.profilePage}>
        <p className={styles.pageDescription}>
          Administra tu información y mantén segura tu cuenta.
        </p>
        <Card className={styles.profileCard} loading bordered />
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.profilePage}>
        <p className={styles.pageDescription}>
          Administra tu información y mantén segura tu cuenta.
        </p>
        <Card className={styles.profileCard} bordered>
          No hay un usuario autenticado. Por favor inicia sesión.
        </Card>
      </div>
    )
  }

  const initials = user.nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const userRole = user.rol === 'ADMIN' ? 'Administrador' : 'Colaborador'

  return (
    <div className={styles.profilePage}>
      <p className={styles.pageDescription}>Administra tu información y mantén segura tu cuenta.</p>

      <Row gutter={[20, 20]} align="top">
        <Col xs={24} lg={12}>
          <Card
            className={styles.profileCard}
            title={
              <div className={styles.cardHeading}>
                <div>
                  <span>TU ESPACIO</span>
                  <strong>Información personal</strong>
                </div>
                <span className={styles.headingIcon}>
                  <UserOutlined />
                </span>
              </div>
            }
            bordered
          >
            <div className={styles.identityBanner}>
              <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
                <button
                  className={styles.avatarButton}
                  type="button"
                  aria-label="Cambiar foto de perfil"
                >
                  <Avatar size={54} src={avatarUrl} icon={<UserOutlined />}>
                    {!avatarUrl && initials}
                  </Avatar>
                  <span className={styles.avatarUploadIcon}>
                    <UploadOutlined />
                  </span>
                </button>
              </Upload>
              <div className={styles.identityCopy}>
                <span>PERFIL DE USUARIO</span>
                <strong>{userRole}</strong>
              </div>
              <span className={styles.activeBadge}>
                <CheckCircleFilled />
                Sesión activa
              </span>
            </div>

            <div className={styles.accountSection}>
              <h3>Datos de la cuenta</h3>
              <p>Actualiza el nombre que aparece en tu espacio de trabajo.</p>

              <Form
                form={form}
                className={styles.profileForm}
                layout="vertical"
                initialValues={{ nombre: user.nombre || '', email: user.email || '' }}
                onFinish={handleSave}
              >
                <Form.Item
                  name="nombre"
                  label="Nombre completo"
                  rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Tu nombre" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={
                    <span className={styles.emailLabel}>
                      Correo electrónico
                      <span>Solo lectura</span>
                    </span>
                  }
                >
                  <Input prefix={<MailOutlined />} suffix={<LockOutlined />} disabled />
                </Form.Item>
                <span className={styles.fieldHint}>
                  Para cambiar tu correo, comunícate con el administrador.
                </span>

                <div className={styles.formFooter}>
                  <p>Tus datos solo son visibles para ti y los administradores.</p>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                    Guardar cambios
                  </Button>
                </div>
              </Form>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            className={styles.securityCard}
            title={
              <div className={styles.cardHeading}>
                <div>
                  <span>PROTECCIÓN</span>
                  <strong>Seguridad de la cuenta</strong>
                </div>
                <span className={`${styles.headingIcon} ${styles.securityHeadingIcon}`}>
                  <LockOutlined />
                </span>
              </div>
            }
            bordered
          >
            <div className={styles.securityIntro}>
              <span className={styles.securityIllustration}>
                <SafetyCertificateOutlined />
              </span>
              <div>
                <strong>Protege tu contraseña</strong>
                <p>
                  Solicita un enlace seguro para restablecerla. Así verificamos tu identidad antes
                  de guardar una nueva contraseña.
                </p>
              </div>
            </div>

            <div className={styles.resetEmail}>
              <span>
                <MailOutlined />
              </span>
              <p>
                Enviaremos las instrucciones a<strong>{user.email}</strong>
              </p>
            </div>

            <Button
              className={styles.resetButton}
              type="primary"
              icon={<RedoOutlined />}
              loading={sendingReset}
              onClick={handlePasswordReset}
            >
              Restablecer contraseña
            </Button>

            <p className={styles.securityHint}>
              <InfoCircleOutlined />
              Si no recibes el correo, revisa tu carpeta de spam.
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile
