//const LIFF_ID = "2009827198-xpSRx2mI"; 
//const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxvQVuHD9_jTq1FqfhvL627OvG9Olf42X2lGoE5S_4VO--sfKw5Xo7nbyDcgddelLbwIA/exec"; 

// ==========================================
// 1. 環境設定（ご自身の環境に合わせて変更）
// ==========================================
const LIFF_ID = "2009827198-xpSRx2mI"; // LIFF IDを設定
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxvQVuHD9_jTq1FqfhvL627OvG9Olf42X2lGoE5S_4VO--sfKw5Xo7nbyDcgddelLbwIA/exec"; // デプロイしたGASのウェブアプリURLを設定

// ==========================================
// 2. 初期化・イベント設定
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // LIFFの初期化
  initializeLiff();

  // フォーム送信時のイベントリスナー登録
  const form = document.getElementById("registrationForm");
  form.addEventListener("submit", handleFormSubmit);
});

// ==========================================
// 3. 各種関数定義
// ==========================================

/**
 * LIFFを初期化し、必要に応じてログイン処理とデータ取得を行う
 */
async function initializeLiff() {
  try {
    await liff.init({ liffId: LIFF_ID });
    
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      // ログイン済みなら従業員データ（紹介者リスト）を取得
      fetchEmployees();
    }
  } catch (err) {
    console.error("LIFFの初期化に失敗しました", err);
    alert("LIFFの初期化に失敗しました。");
  }
}

/**
 * GASから従業員リストを取得し、プルダウンに追加する
 */
async function fetchEmployees() {
  const referrerSelect = document.getElementById('referrer');
  const loadingText = document.getElementById('referrerLoading');
  
  loadingText.style.display = 'block'; 

  try {
    const response = await fetch(GAS_WEBAPP_URL);
    const result = await response.json();

    if (result.success && result.employees) {
      // 取得したリストをプルダウンのoptionとして追加
      result.employees.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        referrerSelect.appendChild(option);
      });

      // ★追加：ここで標準のプルダウンを「検索可能なプルダウン」に変換する
      new TomSelect("#referrer", {
        create: false, // 新規作成は許可しない
        placeholder: "名前を検索して選択...",
        maxOptions: null // 全件表示する設定
      });

    } else {
      console.error("従業員データの取得に失敗しました", result.error);
    }
  } catch (error) {
    console.error("通信エラー:", error);
  } finally {
    loadingText.style.display = 'none'; 
  }
}

/**
 * フォームが送信されたときの処理
 */
async function handleFormSubmit(event) {
  event.preventDefault(); 
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  const formData = new FormData(event.target);
  
  // URLSearchParams を使うことで「シンプルリクエスト」として送る
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    params.append(key, value);
  }

  try {
    const response = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded" // これが重要
      },
      body: params
    });

    const result = await response.json();

    if (result.success) {
      alert("登録が完了しました！");
      liff.closeWindow();
    } else {
      alert("エラーが発生しました: " + result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = "登録する";
    }
  } catch (error) {
    console.error("通信エラー:", error);
    alert("通信エラーが発生しました。");
    submitBtn.disabled = false;
    submitBtn.textContent = "登録する";
  }
}