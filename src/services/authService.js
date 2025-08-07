// Simple hash function (in a real app, use proper bcrypt or similar)
const hashPassword = (password) => {
  return btoa(password); // Base64 encoding (NOT secure for production)
};

// Helper functions to manage localStorage
const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('movietime_users') || '[]');
  } catch (error) {
    console.error('Error parsing users from localStorage:', error);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    localStorage.setItem('movietime_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
    throw new Error('Failed to save user data');
  }
};

export const authService = {
  // Check if username is unique
  isUsernameAvailable: (username) => {
    if (!username || typeof username !== 'string') {
      return false;
    }
    const users = getUsers();
    return !users.find(user => user.username.toLowerCase() === username.toLowerCase());
  },

  // Sign up new user
  signUp: (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate API delay
        if (!username || !password) {
          reject({ message: 'Username and password are required' });
          return;
        }

        if (typeof username !== 'string' || typeof password !== 'string') {
          reject({ message: 'Username and password must be valid strings' });
          return;
        }

        if (username.trim().length < 3) {
          reject({ message: 'Username must be at least 3 characters long' });
          return;
        }

        if (password.length < 6) {
          reject({ message: 'Password must be at least 6 characters long' });
          return;
        }

        const trimmedUsername = username.trim();

        if (!authService.isUsernameAvailable(trimmedUsername)) {
          reject({ message: 'Username already exists' });
          return;
        }

        const users = getUsers();
        const newUser = {
          id: Date.now(),
          username: trimmedUsername,
          password: hashPassword(password),
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        resolve({ 
          success: true, 
          user: { id: newUser.id, username: newUser.username },
          message: 'Account created successfully' 
        });
      }, 500);
    });
  },

  // Sign in existing user
  signIn: (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate API delay
        if (!username || !password) {
          reject({ message: 'Username and password are required' });
          return;
        }

        if (typeof username !== 'string' || typeof password !== 'string') {
          reject({ message: 'Username and password must be valid strings' });
          return;
        }

        const trimmedUsername = username.trim();

        const users = getUsers();
        const user = users.find(user => 
          user.username.toLowerCase() === trimmedUsername.toLowerCase() && 
          user.password === hashPassword(password)
        );

        if (user) {
          // Set current user session
          localStorage.setItem('movietime_current_user', JSON.stringify({
            id: user.id,
            username: user.username
          }));

          resolve({ 
            success: true, 
            user: { id: user.id, username: user.username },
            message: 'Signed in successfully' 
          });
        } else {
          reject({ message: 'Invalid username or password' });
        }
      }, 500);
    });
  },

  // Get current user session
  getCurrentUser: () => {
    try {
      const currentUser = localStorage.getItem('movietime_current_user');
      return currentUser ? JSON.parse(currentUser) : null;
    } catch (error) {
      console.error('Error parsing current user from localStorage:', error);
      localStorage.removeItem('movietime_current_user');
      return null;
    }
  },

  // Sign out
  signOut: () => {
    localStorage.removeItem('movietime_current_user');
  }
};
