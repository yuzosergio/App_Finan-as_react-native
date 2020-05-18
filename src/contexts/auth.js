import React, { useState, createContext, useEffect } from 'react';
import firebase from '../services/firebaseConnection';
export const AuthContext = createContext({});
import AsyncStorage from '@react-native-community/async-storage';

function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [loading,setLoading] = useState(true);
    const [loadingAuth, setLoadingAuth] = useState(false);

    useEffect(()=> {
        async function loadStorage(){
            const storageUser = await AsyncStorage.getItem('Auth_user');

            if(storageUser){
                //converte de volta para json
                setUser(JSON.parse(storageUser));
                setLoading(false);
            }

            setLoading(false);
        }
        loadStorage();
    }, []);

    //funcção para logar usuario
    async function signIn(email, password){
        setLoadingAuth(true);
        await firebase.auth().signInWithEmailAndPassword(email,password)
        .then(async(value) => {
            let uid = value.user.uid;
            await firebase.database().ref('users').child(uid).once('value')
            .then((snapshot)=>{
                let data ={
                    uid:uid,
                    nome: snapshot.val().nome,
                    email: value.user.email,
                };
                setUser(data);
                storageUser(data);
                setLoadingAuth(false);
            })
        })
        .catch((error)=> {
            alert(error.code);
            setLoadingAuth(false);
        });
    }

    //cadastrar usuario
    async function signUp(email,password,nome){
        setLoadingAuth(true);
        await firebase.auth().createUserWithEmailAndPassword(email, password)
        //se o email e senha estiver correto cai no then
        .then(async (value) =>{
            let uid = value.user.uid;
            await firebase.database().ref('users').child(uid).set({
                saldo: 0,
                nome: nome
            })
            //caso tudo der certo salva em user
            .then(()=>{
                let data = {
                    uid: uid,
                    nome: nome,
                    email: value.user.email,
                };
                setUser(data);
                storageUser(data);
                setLoadingAuth(false);
            })
        })
        .catch((error)=> {
            alert(error.code);
            setLoadingAuth(false);
        });
    }

    async function storageUser(data){
                                                //transforma em string
        await AsyncStorage.setItem('Auth_user', JSON.stringify(data));
    }

    async function signOut(){
        await firebase.auth().signOut();
        await AsyncStorage.clear()
        .then( () => {
            //sendo null vai deslogar
            setUser(null);
        })
    }

    return(
        <AuthContext.Provider value={{ signed: !!user , user,loading, signUp, signIn, signOut, loadingAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;