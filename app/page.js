"use client";

import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, setLogLevel } from 'firebase/firestore';
export default function Page() {
  return <h1>Hello Next.js!</h1>
}