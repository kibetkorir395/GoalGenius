import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

import { collection, doc, getDoc, getDocs, getFirestore, query, updateDoc, where, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdzgeQpJyKlalVoQ-q4-msajNdgss6OGU",
  authDomain: "football2024-f741a.firebaseapp.com",
  projectId: "football2024-f741a",
  storageBucket: "football2024-f741a.appspot.com",
  messagingSenderId: "988342307794",
  appId: "1:988342307794:web:7b6093345325be89f4d60b",
  measurementId: "G-GKR00LWSND"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const signInUser = async (email, password, setNotification, navigate, from, refreshUser) => {
  signInWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
    setNotification({
      isVisible: true,
      type: 'success',
      message: "Welcome Back!",
    });

    if (refreshUser) {
      await refreshUser(userCredential.user.email);
    }  
    navigate(from); // Add redirect
  }).catch(async (error) => {
    const errorMessage = await error.message;
    setNotification({
      isVisible: true,
      type: 'error',
      message: errorMessage,
    });
  });
}

export const registerUser = async (username, email, password, setNotification, navigate) => {
  createUserWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
    const user = userCredential.user;
    const userDocRef = doc(db, "users", user.email);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return setNotification({
        isVisible: true,
        type: 'error',
        message: "The user already exists! Login instead.",
      });
    }
    await setDoc(userDocRef, {
      email: user.email,
      username: username,
      isPremium: false,
      subscription: null
    }).then(async (response) => {
      setNotification({
        isVisible: true,
        type: 'success',
        message: `User with ${user.email} has been registered successfully`,
      });
      
      if (refreshUser) {
        await refreshUser(user.email);
      }
      navigate('/login'); // Add redirect here
    }).catch(async (error) => {
      const errorMessage = await error.message;
      setNotification({
        isVisible: true,
        type: 'error',
        message: errorMessage,
      });
    });
  }).catch(async (error) => {
    const errorMessage = await error.message;
    setNotification({
      isVisible: true,
      type: 'error',
      message: errorMessage,
    });
  });
}

export const updateUser = async (userId, isPremium, subscription, setNotification) => {
  const usercollref = doc(db, 'users', userId)
  updateDoc(usercollref, {
    isPremium,
    subscription
  }).then(response => {
    setNotification({
      isVisible: true,
      type: 'success',
      message: "user data updated!",
    });
  }).catch(error => {
    setNotification({
      isVisible: true,
      type: 'error',
      message: "An Unkown Error Occurred" + error.message,
    });
  })
}

export const getUser = async (userId, setUserData) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    setUserData(userData);
    return userData; // Return the data
  } else {
    return null;
  }
};

export const getAllusers = async (setUsers, setLoading) => {
  setLoading(true);
  try {
    const usersCollectionRef = collection(db, "users");
    const querySnapshot = await getDocs(usersCollectionRef);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    setUsers(users);
  } catch (err) {
  } finally {
    setLoading(false);
  }
};

export const addMailList = async (data, setNotification, setEmail) => {
  try {
    // Reference to the document using email as the document ID
    const mailDocRef = doc(db, "mail-list", data.email);
    const mailDoc = await getDoc(mailDocRef);

    // Check if the email already exists
    if (mailDoc.exists()) {
      return setNotification({
        isVisible: true,
        type: 'warning',
        message: "The email already exists! Try a new one.",
      });
    }

    // Add new email to the mail-list
    await setDoc(mailDocRef, { ...data });
    setNotification({
      isVisible: true,
      type: 'success',
      message: "You are now subscribed to our newsletter.",
    });
    setEmail("");
  } catch (error) {
    setNotification({
      isVisible: true,
      type: 'error',
      message: error.message || "An error occurred while subscribing.",
    });
  }
};

export const addTip = async (data, setNotification, setLoading) => {
  setLoading(true);
  const tipsDocRef = doc(db, "tips", data.home.trim() + data.away.trim() + data.date.split("/").join(""));
  await setDoc(tipsDocRef, {
    ...data
  }).then(async (docRef) => {
    setNotification({
      isVisible: true,
      type: 'success',
      message: "tip added",
    });
    window.location.replace(`/tips`);
  }).catch(async (error) => {
    setNotification({
      isVisible: true,
      type: 'error',
      message: error.message,
    });
    setLoading(false);
  });
  setLoading(false)
};

export const updateTip = async (id, data, setNotification, setLoading, setData) => {
  setLoading(true);
  const tipsDocRef = doc(db, "tips", id);
  await updateDoc(tipsDocRef, {
    ...data
  }).then(async (docRef) => {
    setNotification({
      isVisible: true,
      type: 'success',
      message: "Tip updated successfully!",
    });

    const docSnap = await getDoc(tipsDocRef); // Fetch the document

    if (docSnap.exists()) {
      setData(docSnap.data());
      return docSnap.data();
    } else {
      return null;
    }
  }).catch(async (error) => {
    setNotification({
      isVisible: true,
      type: 'error',
      message: error.message,
    });
    setLoading(false);
  });
  setLoading(false)
};

export const getTips = async (setTips, setLoading, currentDate) => {
  setLoading(true);
  try {
    const tipsCollectionRef = collection(db, "tips");
    const q = query(tipsCollectionRef, where("date", "==", currentDate));
    const querySnapshot = await getDocs(q);
    const tips = [];
    querySnapshot.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() });
    });
    setTips(tips);
  } catch (err) {
    setTips([]);
  } finally {
    setLoading(false);
  }
};

export const sendPasswordReset = async (email) => {
  return await sendPasswordResetEmail(auth, email);
}
