const firebaseConfig = {
    apiKey: "AIzaSyAV-XVaOyUiq1c-29VTaWjLKcEXrssnnTE",
    authDomain: "qlhs10a7.firebaseapp.com",
    projectId: "qlhs10a7",
    storageBucket: "qlhs10a7.firebasestorage.app",
    messagingSenderId: "584229565603",
    appId: "1:584229565603:web:d47a10f0a512a1a309bb16"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
