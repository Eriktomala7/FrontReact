import axios from "axios";

const API_URL = "https://apicomple-1.onrender.com/auth";

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'USUARIO';
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    nombre?: string;
    name?: string;
    rol: 'ADMIN' | 'USUARIO';
  };
  rol?: 'ADMIN' | 'USUARIO'; // For backward compatibility
}



interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'USUARIO';
}
export interface UserDetail {
  id: string | number;
  email: string;
  nombre: string;
  rol?: 'ADMIN' | 'USUARIO';
  avatarUrl?: string;}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Sending login request to:', `${API_URL}/login`, { email });
    const response = await axios({
      method: 'post',
      url: `${API_URL}/login`,
      data: { email, password },
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    console.log('Raw login response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    const responseData = response.data;
    
    // If the response is not successful, throw an error with the server's message
    if (response.status >= 400) {
      throw new Error(responseData.message || 'Error en la autenticación');
    }
    
    // Handle different response structures
    const userData = responseData.user || responseData;
    const token = responseData.token || responseData.access_token || responseData.data?.token;
    
    if (!token) {
      console.error('No token received in response:', responseData);
      throw new Error('No se recibió un token de autenticación');
    }
    
    const userRole = (userData.rol || responseData.rol || 'USUARIO').toUpperCase() as 'ADMIN' | 'USUARIO';
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: userData.id,
      email: userData.email,
      nombre: userData.nombre || userData.name || '',
      rol: userRole
    }));
    
    // Set axios auth header for subsequent requests
    setAxiosAuthHeader(token);
    
    return {
      token,
      user: {
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre || userData.name || '',
        rol: userRole
      }
    };
  } catch (error: any) {
    console.error('Login error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    throw error;
  }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await axios.post('https://apicomple-1.onrender.com/usuarios/recuperar', { email }, {
    validateStatus: (status) => status < 500,
  });

  if (response.status >= 400) {
    throw new Error(response.data?.message || 'No se pudo solicitar la recuperación de contraseña.');
  }
};

export const register = async (userData: RegisterData): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_URL}/register`, userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setAxiosAuthHeader(response.data.token);
  }
  return response.data;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAxiosAuthHeader = (token?: string | null) => {
  const t = token ?? getToken();
  if (t) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    setAxiosAuthHeader();
    const res = await axios.get<User>(`${API_URL}/me`, { validateStatus: (s) => s < 500 });
    if (res.status >= 400) {
      return null;
    }
    const u = res.data;
    localStorage.setItem('user', JSON.stringify(u));
    return u;
  } catch (e) {
    console.error('Error fetching current user (/auth/me):', e);
    return null;
  }
};

export const logout = (): void => {
  // Clear all auth related data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear any other auth related data if exists
  localStorage.removeItem('authState');
  
  // Clear axios default headers if any
  delete axios.defaults.headers.common['Authorization'];
  
  // Reload the app at login so its authentication state is reset.
  window.location.replace('/login');
};
export const getUserById = async (id: string | number): Promise<UserDetail> => {
  setAxiosAuthHeader(); // asegura el Authorization: Bearer <token>
  const res = await axios.get<UserDetail>(`https://apicomple-1.onrender.com/usuarios/${id}`, {
    validateStatus: (s) => s < 500,
  });
  if (res.status >= 400) {
    throw new Error(res.data ? JSON.stringify(res.data) : 'Error obteniendo usuario');
  }
  return res.data;
}

export const updateUserProfile = async (
  id: string | number,
  profileData: Pick<UserDetail, 'nombre'>
): Promise<UserDetail> => {
  setAxiosAuthHeader();
  const res = await axios.put<UserDetail>(`https://apicomple-1.onrender.com/usuarios/${id}`, profileData, {
    validateStatus: (status) => status < 500,
  });
  if (res.status >= 400) {
    throw new Error(res.data ? JSON.stringify(res.data) : 'Error actualizando el perfil');
  }
  return res.data;
};

export const updateUserPassword = async (id: string | number, password: string): Promise<void> => {
  setAxiosAuthHeader();
  const res = await axios.put(`https://apicomple-1.onrender.com/usuarios/${id}`, { password }, {
    validateStatus: (s) => s < 500,
  });
  if (res.status >= 400) {
    throw new Error(res.data ? JSON.stringify(res.data) : 'Error actualizando contraseña');
  }
};

export const uploadUserAvatar = async (id: string | number, file: File): Promise<string | undefined> => {
  setAxiosAuthHeader();
  const formData = new FormData();
  // El backend espera el archivo en el campo 'foto'
  formData.append('foto', file);
  const res = await axios.post(`https://apicomple-1.onrender.com/usuarios/${id}/foto-perfil`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    validateStatus: (s) => s < 500,
  });
  if (res.status >= 400) {
    throw new Error(res.data ? JSON.stringify(res.data) : 'Error subiendo foto de perfil');
  }
  // El backend responde { mensaje, foto_perfil }
  const url = (res.data && (res.data.foto_perfil as string)) || undefined;
  return url;
};

// Avatar helpers según tu backend devuelve JSON con { foto_perfil }
export const fetchUserAvatarUrl = async (id: string | number): Promise<string | undefined> => {
  setAxiosAuthHeader();
  const res = await axios.get(`https://apicomple-1.onrender.com/usuarios/${id}/foto-perfil`, {
    validateStatus: (s) => s < 500,
  });
  if (res.status >= 400) {
    return undefined;
  }
  return (res.data && (res.data.foto_perfil as string)) || undefined;
};

export const getUserAvatarUrl = async (id: string | number, cacheBust = true): Promise<string | undefined> => {
  const url = await fetchUserAvatarUrl(id);
  return cacheBust ? `${url}?t=${Date.now()}` : url;
};

export const fetchUserAvatarBlob = async (id: string | number): Promise<Blob> => {
  const url = await fetchUserAvatarUrl(id);
  if (!url) {
    throw new Error('No se pudo obtener la foto de perfil');
  }
  setAxiosAuthHeader();
  const res = await axios.get(url, {
    responseType: 'blob',
    validateStatus: (s) => s < 500,
  });
  if (res.status >= 400) {
    throw new Error('No se pudo obtener la foto de perfil');
  }
  return res.data as Blob;
};
