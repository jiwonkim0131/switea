import axios from 'axios';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/database';
import Swal from 'sweetalert2';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { inputStatus, isSubmit, isSamePassword } from './formValidation';

// firebase setting
const firebaseConfig = {
  apiKey: 'AIzaSyBO-Gg2r1Q58sjCfIDBvT_vjZkjwItkVik',
  authDomain: 'switea-19c19.firebaseapp.com',
  databaseURL: 'https://switea-19c19-default-rtdb.firebaseio.com',
  projectId: 'switea-19c19',
  storageBucket: 'switea-19c19.appspot.com',
  messagingSenderId: '182506057612',
  appId: '1:182506057612:web:27854724d6fe0d775a70a9',
  measurementId: 'G-XN3HTBG4LC',
};

firebase.initializeApp(firebaseConfig);
const auth = getAuth();

const $signUpSubmit = document.querySelector('.signup-submit');
const $confirmPassword = document.querySelector('#signupConfirmPassword');
const allInputOfForm = document.querySelectorAll('.required');

const getFormInfo = () => {
  const formInfo = {};
  allInputOfForm.forEach(input => {
    formInfo[input.name] = input.value;
  });
  return formInfo;
};

const checkValidation = target => {
  const [$iconSuccess, $iconError] =
    target.parentNode.querySelectorAll('.icon');
  const $errorMessage = target.parentNode.querySelector('.error');
  const inputType = inputStatus[target.name];

  inputType.status =
    target.name !== 'confirmPassword'
      ? inputType.RegExp.test(target.value)
      : isSamePassword(target.value);

  $iconSuccess.classList.toggle('hidden', !inputType.status);
  $iconError.classList.toggle('hidden', inputType.status);
  $errorMessage.textContent = inputType.status ? '' : inputType.errorMessage;
};

const uploadImage = () => {
  const ref = firebase.storage().ref();
  const file = document.querySelector('#signupProfileImage').files[0];
  const name = +new Date() + '-' + file.name;
  const metadata = {
    contentType: file.type,
  };

  return ref.child(name).put(file, metadata);
};

document.querySelector('#signupProfileImage').onclick = e => {
  e.target.value = null;
};

document.querySelector('#signupProfileImage').onchange = e => {
  if (!e.target.matches('input')) return;

  const reader = new FileReader();

  reader.onload = () => {
    document.querySelector('.profile-image__view').src = reader.result;
  };

  reader.readAsDataURL(e.target.files[0]);
};

document.querySelector('form').oninput = e => {
  if (e.target.name === 'profileImage') return;
  checkValidation(e.target);

  // 비밀번호 확인창이 입력된 상태에서 비밀번호 재입력시 비밀번호 확인 input 초기화
  if (e.target.name === 'password') {
    if ($confirmPassword.value !== '') {
      $confirmPassword.value = '';
      $confirmPassword.parentNode.querySelector('.error').textContent = '';
      $confirmPassword.parentNode
        .querySelector('.icon-success ')
        .classList.add('hidden');
      $confirmPassword.parentNode
        .querySelector('.icon-error ')
        .classList.add('hidden');
    }
  }

  $signUpSubmit.disabled = !isSubmit(allInputOfForm);
};

// 회원가입 버튼 클릭 시
$signUpSubmit.onclick = async e => {
  e.preventDefault();

  const { email, password, userName, phoneNum, nickname } = getFormInfo();

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // 프로필 이미지 서버 storage에 저장
    const snapshot = await uploadImage();
    const profileImage = await snapshot.ref.getDownloadURL();

    await axios.put(
      `https://switea-19c19-default-rtdb.firebaseio.com/users/${auth.currentUser.uid}.json`,
      {
        userName,
        phoneNum,
        nickname,
        profileImage,
      },
    );

    Swal.fire({
      title: '회원가입 성공',
      text: '성공적으로 회원가입 되었습니다. 로그인 페이지로 이동합니다.',
      icon: 'success',
      showCancelButton: false,
      confirmButtonText: '확인',
    }).then(() => {
      window.location = '/signin.html';
    });
  } catch (error) {
    const errorCode = error.code;
    switch (errorCode) {
      case 'auth/email-already-in-use':
        Swal.fire({
          title: '회원가입 실패',
          text: '중복된 아이디 입니다.',
          icon: 'error',
          showCancelButton: false,
          confirmButtonText: '확인',
        });
        break;
      default:
        Swal.fire({
          title: '회원가입 실패',
          text: '회원가입이 정상적으로 처리되지 않았습니다. 다시 시도해주세요.',
          icon: 'error',
          showCancelButton: false,
          confirmButtonText: '확인',
        });
        break;
    }
  }
};
