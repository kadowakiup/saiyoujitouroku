// ==========================================
// 1. 環境設定
// ==========================================
const LIFF_ID = "2009827198-xpSRx2mI"; // LIFF ID
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxvQVuHD9_jTq1FqfhvL627OvG9Olf42X2lGoE5S_4VO--sfKw5Xo7nbyDcgddelLbwIA/exec"; // GASのウェブアプリURL

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
  
  // ローディング表示をオン
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

      // TomSelectによる検索機能の適用
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
    // 成功・失敗に関わらずローディング表示をオフ
    loadingText.style.display = 'none'; 
  }
}

/**
 * フォームが送信されたときの処理
 */
async function handleFormSubmit(event) {
  event.preventDefault(); // 画面の遷移・リロードを防止
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  // 1. LINE IDを取得（エラーになっても進めるようにする）
  let lineId = "不明";
  try {
    const profile = await liff.getProfile();
    lineId = profile.userId;
  } catch (err) {
    console.error("LINE IDの取得に失敗しました", err);
  }

  // 2. フォームデータを取得
  const formData = new FormData(event.target);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    params.append(key, value);
  }
  
  // 3. 取得したLINE IDを送信データに追加
  params.append("lineId", lineId);

  try {
    // GASへPOSTリクエストを送信
    const response = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const result = await response.json();

    if (result.success) {
      // 4. Anycrossからのレスポンスを確認
      const anycross = result.anycrossResponse || {};
      const status = anycross.status;

      // ステータスコードが 300, 330, 333 のいずれかに該当するかチェック
      if (status === 300 || status === 330 || status === 333) {
        // 重複エラーの場合: 推奨名を取得してアラート
        let suggestedName = anycross.name || 
                           (anycross.body && anycross.body.name) || 
                           (anycross.body && Array.isArray(anycross.body) && anycross.body[0] && anycross.body[0].name) || 
                           "不明";
        
        alert(`名前が重複したので、以下の名前を使用してください。\n（${suggestedName}）`);
        
        // 再入力できるようにボタンを復旧させる
        submitBtn.disabled = false;
        submitBtn.textContent = "登録する";
      } else {
        // 正常完了
        alert("登録が完了しました！");
        liff.closeWindow(); // 成功したら画面を閉じる
      }
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