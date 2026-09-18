import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

type AuthResult =
  | { success: true; user?: User }
  | { success: false; msg: string; error?: unknown };

const successResult = (user?: User): AuthResult => ({ success: true, user });
const failureResult = (msg: string, error?: unknown): AuthResult => ({
  success: false,
  msg,
  error,
});

type UserProfile = {
  username?: string;
  profileUrl?: string;
  userId?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean | undefined;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    email: string,
    password: string,
    username: string,
    profileUrl: string,
  ) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        await updateUserData(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    });

    return unsub;
  }, []);

  const updateUserData = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data() as UserProfile;
        setProfile(userData);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      setProfile(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        return {
          success: false,
          msg: "Please enter both email and password.",
        };
      }

      await signInWithEmailAndPassword(auth, cleanEmail, password);
      return successResult();
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Login failed";
      if (msg.includes("(auth/invalid-email)")) msg = "invalid email";
      if (msg.includes("(auth/wrong-password)")) msg = "wrong password";
      if (msg.includes("(auth/user-not-found)")) msg = "user not found";
      if (msg.includes("(auth/too-many-requests)"))
        msg = "too many attempts, try again later";
      return failureResult(msg, e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return successResult();
    } catch (e) {
      return failureResult(e instanceof Error ? e.message : "Logout failed", e);
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    profileUrl: string,
  ) => {
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (response.user) {
        const user = response.user;
        await updateProfile(user, {
          displayName: username,
          photoURL: profileUrl,
        });

        await setDoc(doc(db, "users", response.user.uid), {
          username,
          profileUrl,
          userId: response.user.uid,
        });
        return successResult(response.user);
      }
    } catch (e) {
      return failureResult(
        e instanceof Error ? e.message : "Registration failed",
        e,
      );
    }
    return failureResult("Registration failed");
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, isAuthenticated, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

//17:41
export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return value;
};
