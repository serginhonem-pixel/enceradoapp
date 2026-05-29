"use client";
import { useState, useEffect } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPhoneNumber,
  RecaptchaVerifier, ConfirmationResult,
  signOut as firebaseSignOut, User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se Firebase não está configurado, marca como não autenticado
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    if (!auth) throw new Error("Firebase não configurado. Configure o .env.local");
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function sendPhoneCode(phone: string, containerId: string): Promise<ConfirmationResult> {
    if (!auth) throw new Error("Firebase não configurado");
    const recaptcha = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
    return signInWithPhoneNumber(auth, phone, recaptcha);
  }

  async function signUp(email: string, password: string) {
    if (!auth) throw new Error("Firebase não configurado. Configure o .env.local");
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    if (!auth) return;
    return firebaseSignOut(auth);
  }

  return { user, loading, signIn, signUp, signOut, sendPhoneCode };
}
