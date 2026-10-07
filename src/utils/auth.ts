import { User, UserRole } from '../types';

const USERS_STORAGE_KEY = 'diario_professor_users_v1';
const SESSION_STORAGE_KEY = 'diario_professor_session_v1';

// Simple deterministic salt + base64 encoding for local storage
export function hashPassword(password: string): string {
  const salt = 'dp_edu_salt_';
  return btoa(unescape(encodeURIComponent(salt + password.trim())));
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export const initialDefaultUsers: User[] = [
  {
    id: 'user-admin-1',
    name: 'Coordenação Pedagógica / Direção',
    email: 'admin@escola.com',
    role: 'admin',
    roleLabel: 'Administrador do Sistema',
    schoolName: 'Escola Municipal Santos Dumont',
    phone: '(11) 99999-0001',
    passwordHash: hashPassword('admin123'),
    createdAt: '2026-01-01T08:00:00.000Z',
    lastLoginAt: '2026-02-01T10:00:00.000Z'
  },
  {
    id: 'user-prof-1',
    name: 'Prof. Carlos Eduardo Silva',
    email: 'professor@escola.com',
    role: 'professor',
    roleLabel: 'Professor de Matemática',
    schoolName: 'Escola Municipal Santos Dumont',
    phone: '(11) 98765-4321',
    passwordHash: hashPassword('123456'),
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLoginAt: '2026-02-01T10:00:00.000Z'
  }
];

export function getRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure the admin account exists in the list
        const hasAdmin = parsed.some((u: User) => u.role === 'admin' || u.email.toLowerCase() === 'admin@escola.com');
        if (!hasAdmin) {
          const merged = [initialDefaultUsers[0], ...parsed];
          saveRegisteredUsers(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler usuários do localStorage:', err);
  }

  // Seed default demo users if empty
  saveRegisteredUsers(initialDefaultUsers);
  return initialDefaultUsers;
}

export function saveRegisteredUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Erro ao salvar usuários no localStorage:', err);
  }
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const user = JSON.parse(raw) as User;
      const allUsers = getRegisteredUsers();
      const current = allUsers.find(u => u.id === user.id);
      if (current) {
        return current;
      }
    }
  } catch (err) {
    console.error('Erro ao ler sessão do usuário:', err);
  }
  return null;
}

export function setCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Erro ao salvar sessão do usuário:', err);
  }
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.email.toLowerCase() === 'admin@escola.com';
}

/**
 * Register user - RESTRICTED: Should only be performed by administrator
 */
export function registerUserByAdmin(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  roleLabel?: string;
  schoolName?: string;
  phone?: string;
}): { success: boolean; user?: User; error?: string } {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (!cleanName) {
    return { success: false, error: 'O nome completo é obrigatório.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Informe um e-mail válido.' };
  }
  if (!data.password || data.password.length < 6) {
    return { success: false, error: 'A senha provisória deve conter no mínimo 6 caracteres.' };
  }

  const users = getRegisteredUsers();
  const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return { success: false, error: 'Já existe um usuário cadastrado com este e-mail no sistema.' };
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    role: data.role,
    roleLabel: data.roleLabel?.trim() || (data.role === 'admin' ? 'Administrador Escolar' : 'Professor(a)'),
    schoolName: data.schoolName?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    passwordHash: hashPassword(data.password),
    createdAt: new Date().toISOString(),
    lastLoginAt: undefined
  };

  const updatedUsers = [...users, newUser];
  saveRegisteredUsers(updatedUsers);

  return { success: true, user: newUser };
}

/**
 * Delete user - RESTRICTED: Only admin can delete users
 */
export function deleteUserByAdmin(userId: string, currentAdminId: string): { success: boolean; error?: string } {
  if (userId === currentAdminId) {
    return { success: false, error: 'Você não pode excluir sua própria conta enquanto estiver logado.' };
  }

  const users = getRegisteredUsers();
  const target = users.find(u => u.id === userId);
  if (!target) {
    return { success: false, error: 'Usuário não encontrado.' };
  }

  // Count remaining admins
  const admins = users.filter(u => u.role === 'admin');
  if (target.role === 'admin' && admins.length <= 1) {
    return { success: false, error: 'Não é possível excluir o único administrador do sistema.' };
  }

  const updated = users.filter(u => u.id !== userId);
  saveRegisteredUsers(updated);

  return { success: true };
}

export function loginUser(
  email: string,
  password: string
): { success: boolean; user?: User; error?: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { success: false, error: 'Por favor, preencha o e-mail e a senha.' };
  }

  const users = getRegisteredUsers();
  const foundUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!foundUser) {
    return { success: false, error: 'E-mail não encontrado no sistema. Entre em contato com o Administrador para cadastrar seu acesso.' };
  }

  if (!verifyPassword(password, foundUser.passwordHash)) {
    return { success: false, error: 'Senha incorreta. Tente novamente ou use a recuperação de senha.' };
  }

  // Update last login
  const updatedUser: User = {
    ...foundUser,
    lastLoginAt: new Date().toISOString()
  };

  const updatedList = users.map(u => (u.id === updatedUser.id ? updatedUser : u));
  saveRegisteredUsers(updatedList);
  setCurrentUser(updatedUser);

  return { success: true, user: updatedUser };
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function resetUserPassword(
  email: string,
  newPassword: string
): { success: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !newPassword) {
    return { success: false, error: 'Preencha o e-mail e a nova senha.' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' };
  }

  const users = getRegisteredUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

  if (userIndex === -1) {
    return { success: false, error: 'Nenhum usuário cadastrado com este e-mail foi encontrado.' };
  }

  users[userIndex].passwordHash = hashPassword(newPassword);
  saveRegisteredUsers(users);

  // If current session is this user, update it
  const current = getCurrentUser();
  if (current && current.email.toLowerCase() === cleanEmail) {
    setCurrentUser(users[userIndex]);
  }

  return { success: true };
}

export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'role' | 'roleLabel' | 'schoolName' | 'phone'>>
): { success: boolean; user?: User; error?: string } {
  const users = getRegisteredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return { success: false, error: 'Usuário não encontrado.' };
  }

  if (updates.email) {
    const cleanEmail = updates.email.trim().toLowerCase();
    const conflict = users.some(u => u.id !== userId && u.email.toLowerCase() === cleanEmail);
    if (conflict) {
      return { success: false, error: 'Este e-mail já está sendo utilizado por outro usuário.' };
    }
    updates.email = cleanEmail;
  }

  const updatedUser: User = {
    ...users[idx],
    ...updates,
    name: updates.name ? updates.name.trim() : users[idx].name
  };

  users[idx] = updatedUser;
  saveRegisteredUsers(users);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(updatedUser);
  }

  return { success: true, user: updatedUser };
}
