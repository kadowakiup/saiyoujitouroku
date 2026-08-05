const LIFF_ID = "2009827198-xpSRx2mI"; 
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxvQVuHD9_jTq1FqfhvL627OvG9Olf42X2lGoE5S_4VO--sfKw5Xo7nbyDcgddelLbwIA/exec"; 

document.addEventListener("DOMContentLoaded", () => {
  initializeLiff();
  const form = document.getElementById("registrationForm");
  form.addEventListener("submit", handleFormSubmit);
});

async function initializeLiff() {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      fetchEmployees();
    }
  } catch (err) {
    alert("LIFFの初期化に失敗しました。");
  }
}

async function fetchEmployees() {
  const referrerSelect = document.getElementById('referrer');
  const loadingText = document.getElementById('referrerLoading');
  loadingText.style.display = 'block'; 

  try {
    const response = await fetch(GAS_WEBAPP_URL);
    const result = await response.json();

    if (result.success && result.employees) {
      result.employees.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        referrerSelect.appendChild(option);
      });
      new TomSelect("#referrer", {
        create: false,
        placeholder: "名前を検索して選択...",
        maxOptions: null 
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingText.style.display = 'none'; 
  }
}

async function handleFormSubmit(event) {
  event.preventDefault(); 
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  let lineId = "不明";
  try {
    const profile = await liff.getProfile();
    lineId = profile.userId;
  } catch (err) {}

  const formData = new FormData(event.target);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    params.append(key, value);
  }
  params.append("lineId", lineId);

  try {
    const response = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const result = await response.json();

    if (result.success) {
      const statusCode = result.anycrossStatus; 
      const anycross = result.anycrossResponse || {};

      // ★デバッグ用：F12（開発者ツール）のコンソールで、実際に何が返ってきているか確認できます
      console.log("GASが受け取ったHTTPステータス:", statusCode);
      console.log("Anycrossからのレスポンス中身:", anycross);

      // ★追加: Anycrossのレスポンスボディの中に 400 が含まれているかチェック
      // （Anycross側でどのようなキー名で返しているかによって "status" の部分は調整してください）
      const bodyStatus = anycross.status || anycross.statusCode || anycross.code;

      if (statusCode === 300 || statusCode === 330 || statusCode === 333) {
        
        // 画像の構造 {"name": {"名前": "大田 花音③"}} から確実に取り出す
        let suggestedName = "不明";
        if (anycross.name && typeof anycross.name === 'object' && anycross.name["名前"]) {
          suggestedName = anycross.name["名前"];
        } else if (anycross.name && typeof anycross.name === 'string') {
          suggestedName = anycross.name;
        }
        
        // ★ご希望の文言に変更
        alert(`同姓同名の方がすでにいるので、今後は以下の名前を必ずご使用ください\n\n${suggestedName}`);
        
        // ★修正: 画面は閉じず、ボタンを無効化したまま「登録完了」に変更して再送信を防ぐ
        submitBtn.textContent = "登録完了";
        // submitBtn.disabled = true; // （すでに送信時に true になっているのでそのままでOK）

      } else if (statusCode === 400 || bodyStatus == 400) {
        // ★追加: 400エラー（登録済み）の場合の処理
        alert("すでに登録されています。修正がある場合は社員へお声がけください。");
        
        submitBtn.disabled = false;
        submitBtn.textContent = "登録する";

      } else {
        alert("登録が完了しました！");
        liff.closeWindow(); 
      }
    } else {
      alert("エラーが発生しました: " + result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = "登録する";
    }
  } catch (error) {
    alert("通信エラーが発生しました。");
    submitBtn.disabled = false;
    submitBtn.textContent = "登録する";
  }
}