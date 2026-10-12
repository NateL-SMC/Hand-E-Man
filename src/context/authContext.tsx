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
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

type AuthResult =
  | { success: true; user?: User }
  | { success: false; msg: string; error?: unknown };

const successResult = (user?: User): AuthResult => ({ success: true, user });
const failureResult = (msg: string, error?: unknown): AuthResult => ({
  success: false,
  msg,
  error,
});

// CHANGED: added phone / address / role / location
export type UserProfile = {
  username?: string;
  profileUrl?: string;
  userId?: string;
  phone?: string;
  address?: string;
  location?: string;
  role?: "customer" | "handyman" | "admin";
};

export type RegisterExtra = Pick<UserProfile, "phone" | "address" | "role">;

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
    extra?: RegisterExtra, // CHANGED: new optional 5th argument
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
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    });

    return unsub;
  }, []);

  // CHANGED: live listener instead of a one-off getDoc, so the profile still fills in
  // when the users doc is created a moment after sign-up, and edits show instantly.
  useEffect(() => {
    if (!user?.uid) return;
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => setProfile(snap.exists() ? (snap.data() as UserProfile) : null),
      (error) => console.error("Error listening to user profile:", error),
    );
  }, [user?.uid]);

  const login = async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        return {
          success: false,
          msg: "Please enter both email and password.",
        } as AuthResult;
      }

      await signInWithEmailAndPassword(auth, cleanEmail, password);
      return successResult();
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Login failed";
      if (msg.includes("(auth/invalid-email)")) msg = "invalid email";
      if (msg.includes("(auth/wrong-password)")) msg = "wrong password";
      if (msg.includes("(auth/user-not-found)")) msg = "user not found";
      // CHANGED: newer Firebase returns this single code for bad email OR password
      if (msg.includes("(auth/invalid-credential)"))
        msg = "invalid email or password";
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
    extra: RegisterExtra = {},
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
          photoURL: profileUrl || null,
        });

        await setDoc(doc(db, "users", response.user.uid), {
          username,
          profileUrl,
          userId: response.user.uid,
          role: "customer", // default, overridden by extra.role
          ...extra,
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

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return value;
};
