// ==========================================
// 設定情報（ご自身の環境に合わせて変更してください）
// ==========================================
const LIFF_ID = "2009827198-xpSRx2mI"; 
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxvQVuHD9_jTq1FqfhvL627OvG9Olf42X2lGoE5S_4VO--sfKw5Xo7nbyDcgddelLbwIA/exec"; 

// ==========================================
// 初期化処理
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    
    // 未ログインの場合はログイン画面へ遷移
    if (!liff.isLoggedIn()) {
      liff.login();
    }
    
    // 起動時にGASからLarkの従業員リストを取得
    await loadReferrers();
    
  } catch (err) {
    console.error("LIFFの初期化に失敗しました", err);
    window.alert("システムの初期化に失敗しました。再読み込みしてください。");
  }
});

// ==========================================
// GASから紹介者リスト（Lark従業員）を取得する関数
// ==========================================
async function loadReferrers() {
  const selectElement = document.getElementById("referrerSelect");
  const submitBtn = document.getElementById("submitBtn");
  
  try {
    const response = await fetch(GAS_WEB_APP_URL);
    const names = await response.json();
    
    selectElement.innerHTML = '<option value="">選択してください (任意)</option>';
    
    names.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      selectElement.appendChild(option);
    });
    
    // リスト取得完了後、ボタンを有効化
    submitBtn.disabled = false;
    submitBtn.textContent = "送信する";
    
  } catch (error) {
    console.error("紹介者リストの取得に失敗しました", error);
    selectElement.innerHTML = '<option value="">取得エラー</option>';
    
    // エラー時でも他の必須項目は入力できるようボタンは有効化する
    submitBtn.disabled = false;
    submitBtn.textContent = "送信する";
  }
}

// ==========================================
// フォーム送信時の処理
// ==========================================
document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // デフォルトのフォーム送信（画面遷移）をブロック
  
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  // フォームデータの収集
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  
  // LINEのユーザーIDも合わせて送る場合
  if (liff.isLoggedIn()) {
    try {
      const profile = await liff.getProfile();
      data.lineUserId = profile.userId;
    } catch (profileErr) {
      console.warn("プロフィール取得に失敗しました", profileErr);
    }
  }

  try {
    // GASへデータを送信
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain", // CORS対策
      },
      body: JSON.stringify(data),
      redirect: "follow" // GASのリダイレクト対応
    });

    const result = await response.json();
    
    if (result.success) {
      window.alert("送信が完了しました！");
      liff.closeWindow(); // 完了後にLIFF画面を閉じる
    } else {
      throw new Error(result.error || "不明なエラーが発生しました");
    }
    
  } catch (error) {
    console.error("Submit error", error);
    window.alert("送信に失敗しました。時間をおいて再度お試しください。");
    
    // エラーになった場合はボタンを元に戻す
    submitBtn.disabled = false;
    submitBtn.textContent = "送信する";
  }
});